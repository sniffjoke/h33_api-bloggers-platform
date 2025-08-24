import { INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-settings';
import { deleteAllData } from '../helpers/delete-all-data';
import { UsersService } from '../../src/features/users/application/users.service';
import { createMockUser, UsersTestManager } from '../helpers/users-test-helpers';
import { BanUserDto } from '../../src/features/users/api/models/input/ban-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersManager: UsersTestManager;
  let usersService: UsersService;


  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    usersManager = result.userTestManager;
    usersService = result.usersService;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('/users (e2e)', () => {
    it('/sa/users (POST)', async () => {
      const emailConfirmationInfo = usersService.createEmailConfirmation(true);
      const user = await usersManager.createUser(createMockUser(1), emailConfirmationInfo);
      expect(user.status).toBe(201);
      expect(user.body).toHaveProperty('id');
      expect(user.body).toHaveProperty('login');
      expect(user.body).toHaveProperty('email');
      expect(user.body).toHaveProperty('createdAt');
      expect(user.body).toHaveProperty('banInfo');
      expect(user.body.banInfo).toHaveProperty('isBanned');
      expect(user.body.banInfo).toHaveProperty('banDate');
      expect(user.body.banInfo).toHaveProperty('banReason');
      expect(new Date(user.body.createdAt).toISOString()).toContain('T');
      expect(user.body.createdAt).toBeDefined();
      expect(user.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          login: expect.any(String),
          email: expect.any(String),
          createdAt: expect.any(String),
        }),
      );
    });

    it('/sa/users (GET)', async () => {
      for (let i = 2; i < 12; i++) {
        let emailConfirmation = usersService.createEmailConfirmation(true);
        let res = await usersManager.createUser(createMockUser(i), emailConfirmation);
      }
      const users = await usersManager.getUsersWithSA();
      expect(users.status).toBe(200);
      expect(Array.isArray(users.body.items)).toBe(true);
      expect(users.body.items.length).toBeGreaterThan(0);
      users.body.items.forEach((user: any) => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('login');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('createdAt');
      });
      users.body.items.forEach((user: any) => {
        expect(user.createdAt).toBeDefined();
        expect(new Date(user.createdAt).toISOString()).toContain('T');
      });
      expect(users.body.items[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          login: expect.any(String),
          email: expect.any(String),
          createdAt: expect.any(String),
        }),
      );
      if (users.body.items.length === 0) {
        expect(users.body.items).toEqual([]);
      } else {
        const dates = users.body.items.map((user: any) => new Date(user.createdAt));
        expect(dates).toEqual([...dates].sort((a, b) => b.getTime() - a.getTime()));
      }
    });

    it('/sa/users/:id (DELETE)', async () => {
      const emailConfirmation = usersService.createEmailConfirmation(true);
      const user = await usersManager.createUser(createMockUser(13), emailConfirmation);
      const response = await usersManager.deleteUser(user.body.id);
      const users = await usersManager.getUsersWithSA();
      expect(response.status).toBe(204);
      expect(users.body.items.length).toBeLessThan(1);
    });

    it('/sa/users/:userId/ban (PUT)', async () => {
      const emailConfirmation = usersService.createEmailConfirmation(true);
      const user = await usersManager.createUser(createMockUser(15), emailConfirmation);
      const banUserData: BanUserDto = {
        isBanned: true,
        banReason: 'ban',
      }
      const response = await usersManager.banUser(user.body.id, banUserData);
      const users = await usersManager.getUsersWithSA();
      expect(response.status).toBe(204);
      const response2 = await usersManager.banUser(user.body.id, {
        isBanned: false,
        banReason: 'ban',
      });
      const users2 = await usersManager.getUsersWithSA();
      console.log('userBefore: ', user.body);
      console.log('userAfter: ', users.body.items[0]);
      console.log('userAfterUnban: ', users2.body.items[0]);
      // expect(users.body.items.length).toBeLessThan(1);
    });
  });

  describe('BadRequest (e2e)', () => {
    it('should return 400 if required field is missing on create user', async () => {
      const invalidPayload = {
        login: '',
        email: 'InvalidUrl',
        password: 'Valid Password',
      };
      const emailConfirmationInfo = usersService.createEmailConfirmation(true);

      const response = await usersManager.createUser(invalidPayload, emailConfirmationInfo);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errorsMessages');
      // toHaveLength, expect.any(Array)
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      response.body.errorsMessages.forEach((error) => {
        expect(error).toEqual(
          expect.objectContaining({
            message: expect.any(String),
          }),
        );
      });
      response.body.errorsMessages.forEach((error: any) => {
        expect(['login', 'email']).toContain(error.field);
      });
    });

    it('should return 400 if login or email already exists on create user', async () => {
      const emailConfirmationInfo = usersService.createEmailConfirmation(false);
      const createUser = await usersManager.createUser(createMockUser(16), emailConfirmationInfo);
      const invalidPayload = createMockUser(16);
      const response = await usersManager.createUser(invalidPayload, emailConfirmationInfo);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errorsMessages');
      expect(Array.isArray(response.body.errorsMessages)).toBe(true);
      response.body.errorsMessages.forEach((error) => {
        expect(error).toEqual(
          expect.objectContaining({
            message: expect.any(String),
          }),
        );
      });
      response.body.errorsMessages.forEach((error: any) => {
        expect(['login', 'email']).toContain(error.field);
      });
    });

  });

  describe('NotFound (e2e)', () => {
    it('should return 404 if id field from URL not found on delete user', async () => {
      const confirmationInfo = usersService.createEmailConfirmation(true);
      const user = await usersManager.createUser(createMockUser(14), confirmationInfo);
      const deleteUser = await usersManager.deleteUser(user.body.id);
      const response = await usersManager.deleteUser(user.body.id);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('AuthGuard (e2e)', () => {
    // blog must not create
    it('should return 401 when no token is provided', async () => {
      const confirmationInfo = usersService.createEmailConfirmation(true);
      const response = await usersManager.createUserWOAuth(createMockUser(15), confirmationInfo);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });

});
