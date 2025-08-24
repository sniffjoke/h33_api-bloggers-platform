import { ExecutionContext, INestApplication } from '@nestjs/common';
import { checkWebsiteString } from '../helpers/test-helpers';
import { initSettings } from '../helpers/init-settings';
import { deleteAllData } from '../helpers/delete-all-data';
import { BlogsTestManager, createMockBlog } from '../helpers/blogs-test-helpers';
import {createMockUser, UsersTestManager} from "../helpers/users-test-helpers";
import {UsersService} from "../../src/features/users/application/users.service";
import { AuthTestManager, mockLoginData } from '../helpers/auth-test-helpers';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { createMockPost, PostsTestManager } from '../helpers/posts-test-helpers';
import { BanInfoForUserDto } from '../../src/features/blogs/api/models/input/ban-user-for-blog.dto';
import { CommentsTestManager, createMockComment } from '../helpers/comments-test-helpers';

describe('BlogsController (e2e)', () => {
  let app: INestApplication;
  let blogsManager: BlogsTestManager;
  let postsManager: PostsTestManager;
  let usersManager: UsersTestManager;
  let usersService: UsersService;
  let authManager: AuthTestManager;
  let commentsManager: CommentsTestManager;


  beforeAll(async () => {
    const result = await initSettings(
      (moduleBuilder) =>
        moduleBuilder
          .overrideGuard(ThrottlerGuard)
          .useValue({
            canActivate: (_context: ExecutionContext) => true, // Разрешаем все запросы
          })
          .overrideProvider(JwtService)
          .useValue(
            new JwtService({
              secret: 'secret_key',
              signOptions: { expiresIn: '2s' },
            }),
          ),
    );
    app = result.app;
    blogsManager = result.blogTestManager;
    postsManager = result.postTestManager;
    usersManager = result.userTestManager;
    usersService = result.usersService;
    authManager = result.authTestManager;
    commentsManager = result.commentTestManager;
    // await deleteAllData(app)
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('/blogs (e2e)', () => {
    it('/sa/blogs (POST)', async () => {
      const blog = await blogsManager.createBlog(createMockBlog(1));
      expect(blog.status).toBe(201);
      expect(blog.body).toHaveProperty('id');
      expect(blog.body).toHaveProperty('name');
      expect(blog.body).toHaveProperty('description');
      expect(blog.body).toHaveProperty('websiteUrl');
      expect(blog.body).toHaveProperty('createdAt');
      expect(blog.body).toHaveProperty('isMembership');
      expect(new Date(blog.body.createdAt).toISOString()).toContain('T');
      expect(blog.body.createdAt).toBeDefined();
      expect(blog.body.isMembership).toBeDefined();
      expect(blog.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          websiteUrl: expect.stringMatching(checkWebsiteString),
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        }),
      );
    });

    it('/sa/blogs/:id (UPDATE)', async () => {
      const newBlog = await blogsManager.createBlog(createMockBlog(2));
      const upd = await blogsManager.updateBlog(createMockBlog(3), newBlog.body.id);
      const updatedBlog = await blogsManager.getBlogById(newBlog.body.id);
      expect(upd.status).toBe(204);
      expect(updatedBlog.body.id).toEqual(newBlog.body.id);
      expect(updatedBlog.body.name).not.toEqual(newBlog.body.name);
      expect(updatedBlog.body.description).not.toEqual(newBlog.body.description);
      expect(updatedBlog.body.websiteUrl).not.toEqual(newBlog.body.websiteUrl);
    });

    it('/sa/blogs/:id (DELETE)', async () => {
      const newBlog = await blogsManager.createBlog(createMockBlog(4));
      const response = await blogsManager.deleteBlog(newBlog.body.id);
      const blogs = await blogsManager.getBlogsWithSA();
      expect(response.status).toBe(204);
      // expect(blogs.body.items.length).toBeLessThan(1);
    });

    it('/blogs (GET)', async () => {
      for (let i = 5; i < 15; i++) {
        let newBlog = await blogsManager.createBlog(createMockBlog(i));
      }
      const blogs = await blogsManager.getBlogs();
      expect(blogs.status).toBe(200);
      expect(Array.isArray(blogs.body.items)).toBe(true);
      // toHaveLength
      expect(blogs.body.items.length).toBeGreaterThan(0);
      //toEqual
      blogs.body.items.forEach((blog: any) => {
        expect(blog).toHaveProperty('id');
        expect(blog).toHaveProperty('name');
        expect(blog).toHaveProperty('description');
        expect(blog).toHaveProperty('websiteUrl');
        expect(blog).toHaveProperty('createdAt');
        expect(blog).toHaveProperty('isMembership');
      });
      blogs.body.items.forEach((blog: any) => {
        expect(blog.createdAt).toBeDefined();
        expect(blog.isMembership).toBeDefined();
        // regular
        expect(new Date(blog.createdAt).toISOString()).toContain('T');
      });
      expect(blogs.body.items[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          // regular to constant
          websiteUrl: expect.stringMatching(/^https?:\/\/[^\s$.?#].[^\s]*$/),
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        }),
      );
      if (blogs.body.items.length === 0) {
        expect(blogs.body.items).toEqual([]);
      }
    });

    it('/sa/blogs (GET)', async () => {
      for (let i = 16; i < 26; i++) {
        let res = await blogsManager.createBlog(createMockBlog(i));
      }
      const blogs = await blogsManager.getBlogsWithSA();
      expect(blogs.status).toBe(200);
      expect(Array.isArray(blogs.body.items)).toBe(true);
      expect(blogs.body.items.length).toBeGreaterThan(0);
      blogs.body.items.forEach((blog: any) => {
        expect(blog).toHaveProperty('id');
        expect(blog).toHaveProperty('name');
        expect(blog).toHaveProperty('description');
        expect(blog).toHaveProperty('websiteUrl');
        expect(blog).toHaveProperty('createdAt');
        expect(blog).toHaveProperty('isMembership');
      });
      blogs.body.items.forEach((blog: any) => {
        expect(typeof blog.id).toBe('string');
        expect(typeof blog.name).toBe('string');
        expect(typeof blog.description).toBe('string');
        expect(typeof blog.websiteUrl).toBe('string');
        expect(typeof blog.createdAt).toBe('string');
        expect(typeof blog.isMembership).toBe('boolean');
      });
      blogs.body.items.forEach((blog: any) => {
        expect(blog.createdAt).toBeDefined();
        expect(blog.isMembership).toBeDefined();
        expect(new Date(blog.createdAt).toISOString()).toContain('T');
      });
      expect(blogs.body.items[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          websiteUrl: expect.stringMatching(/^https?:\/\/[^\s$.?#].[^\s]*$/),
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        }),
      );
      if (blogs.body.items.length === 0) {
        expect(blogs.body.items).toEqual([]);
      } else {
        const dates = blogs.body.items.map((blog: any) => new Date(blog.createdAt));
        expect(dates).toEqual([...dates].sort((a, b) => b.getTime() - a.getTime()));
      }
    });

    it('/blogs/:id (GET)', async () => {
      const newBlog = await blogsManager.createBlog(createMockBlog(27));
      const blog = await blogsManager.getBlogById(newBlog.body.id);
      expect(blog.status).toBe(200);
      expect(blog.body).toHaveProperty('id');
      expect(blog.body).toHaveProperty('name');
      expect(blog.body).toHaveProperty('description');
      expect(blog.body).toHaveProperty('websiteUrl');
      expect(blog.body).toHaveProperty('createdAt');
      expect(blog.body).toHaveProperty('isMembership');
      expect(new Date(blog.body.createdAt).toISOString()).toContain('T');
      expect(blog.body.createdAt).toBeDefined();
      expect(blog.body.isMembership).toBeDefined();
      expect(typeof blog.body.id).toBe('string');
      expect(typeof blog.body.name).toBe('string');
      expect(typeof blog.body.description).toBe('string');
      expect(typeof blog.body.websiteUrl).toBe('string');
      expect(typeof blog.body.createdAt).toBe('string');
      expect(typeof blog.body.isMembership).toBe('boolean');
      expect(blog.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          websiteUrl: expect.stringMatching(/^https?:\/\/[^\s$.?#].[^\s]*$/),
          createdAt: expect.any(String),
          isMembership: expect.any(Boolean),
        }),
      );
    });

    it('/sa/blogs/:blogId/bind-with-user/:userId (UPDATE)', async () => {
      const blog = await blogsManager.createBlog(createMockBlog(1));
      const emailConfirmationInfo = usersService.createEmailConfirmation(true);
      const user = await usersManager.createUser(createMockUser(1), emailConfirmationInfo);
      const bindWithUser = await blogsManager.bindWithUser(blog.body.id, user.body.id)
      const blogs = await blogsManager.getBlogsWithSA()
      expect(bindWithUser.status).toBe(204);
      expect(blogs.body.items[0]).toHaveProperty('id');
      expect(blogs.body.items[0]).toHaveProperty('name');
      expect(blogs.body.items[0]).toHaveProperty('description');
      expect(blogs.body.items[0]).toHaveProperty('websiteUrl');
      expect(blogs.body.items[0]).toHaveProperty('createdAt');
      expect(blogs.body.items[0]).toHaveProperty('isMembership');
      expect(blogs.body.items[0]).toHaveProperty('blogOwnerInfo');
      expect(blogs.body.items[0].blogOwnerInfo).toHaveProperty('userId');
      expect(blogs.body.items[0].blogOwnerInfo).toHaveProperty('userLogin');
      expect(new Date(blogs.body.items[0].createdAt).toISOString()).toContain('T');
      expect(blogs.body.items[0].createdAt).toBeDefined();
      expect(blogs.body.items[0].isMembership).toBeDefined();
      expect(blogs.body.items[0].blogOwnerInfo.userId).toBe(user.body.id);
      expect(blogs.body.items[0].blogOwnerInfo.userLogin).toBe(user.body.login);
      expect(blogs.body.items[0]).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            websiteUrl: expect.stringMatching(checkWebsiteString),
            createdAt: expect.any(String),
            isMembership: expect.any(Boolean),
            blogOwnerInfo: expect.any(Object)
          }),
      );
    });

  });

  describe('BadRequest (e2e)', () => {
    it('should return 400 if required field is missing on create blog', async () => {
      const invalidPayload = {
        name: '',
        description: 'Invalid',
        websiteUrl: 'InvalidUrl',
      };

      const response = await blogsManager.createBlog(invalidPayload);
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
        expect(['name', 'websiteUrl']).toContain(error.field);
      });
    });

    it('should return 400 if required field is missing on update blog', async () => {
      const newBlog = await blogsManager.createBlog(createMockBlog(28));
      const invalidPayload = {
        name: '',
        description: 'Invalid',
        websiteUrl: 'InvalidUrl',
      };
      const response = await blogsManager.updateBlog(invalidPayload, newBlog.body.id);
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
        expect(['name', 'websiteUrl']).toContain(error.field);
      });
    });
  });

  describe('NotFound (e2e)', () => {
    it('should return 404 if id field from URL not found on delete blog', async () => {
      const newBlog = await blogsManager.createBlog(createMockBlog(29));
      const response = await blogsManager.deleteBlog(newBlog.body.id);
      const findedBlog = await blogsManager.getBlogById(newBlog.body.id);
      expect(findedBlog.status).toBe(404);
      expect(findedBlog.body).toHaveProperty('statusCode', 404);
      expect(findedBlog.body).toHaveProperty('message');
    });

    it('should return 404 if id field from URL not found on update blog', async () => {
      const newBlog = await blogsManager.createBlog(createMockBlog(30));
      const deleteBlog = await blogsManager.deleteBlog(newBlog.body.id);
      const upd = await blogsManager.updateBlog(createMockBlog(31), newBlog.body.id);
      const findedBlog = await blogsManager.getBlogById(newBlog.body.id);
      expect(findedBlog.status).toBe(404);
      expect(findedBlog.body).toHaveProperty('statusCode', 404);
      expect(findedBlog.body).toHaveProperty('message');
    });
  });

  describe('AuthGuard (e2e)', () => {
    // blog must not create
    it('should return 401 when no token is provided', async () => {
      const response = await blogsManager.createBlogWOAuth(createMockBlog(32));
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });

  //--------------_BLOGGER PLATFORM_--------------------//

  describe('blogger/users (e2e)', () => {
    it('/:id/ban (PUT)', async () => {
      const emailConfirmationInfo = usersService.createEmailConfirmation(true);
      const user = await usersManager.createUser(createMockUser(1), emailConfirmationInfo);
      const loginUser = await authManager.login(mockLoginData(1));
      const blog = await blogsManager.createBlogByBlogger(
        createMockBlog(1),
        loginUser.body.accessToken,
      );
      const user2 = await usersManager.createUser(createMockUser(2), emailConfirmationInfo);
      const loginUser2 = await authManager.login(mockLoginData(2));
      const post = await postsManager.createPost(createMockPost(1), blog.body.id);

      const modelForBan: BanInfoForUserDto = {
        isBanned: true,
        banReason: 'banReason21symbolsfjdslkejwlkjf',
        blogId: blog.body.id,
      }

      const modelForUnBan: BanInfoForUserDto = {
        isBanned: false,
        banReason: 'banReason21symbolsfjdslkejwlkjf',
        blogId: blog.body.id,
      }

      // const upd = await blogsManager.banUserForBlog(
      //   modelForBan,
      //   loginUser.body.accessToken,
      //   user2.body.id
      // );

      // console.log('upd1status: ', upd.status);


      // const upd2 = await blogsManager.banUserForBlog(
      //   modelForUnBan,
      //   loginUser.body.accessToken,
      //   user2.body.id
      // );

      // console.log('upd2status: ', upd2.status);

      // const upd3 = await blogsManager.banUserForBlog(
      //   modelForBan,
      //   loginUser.body.accessToken,
      //   user2.body.id
      // );
      //
      // console.log('upd3status: ', upd3.status);


      // const bannedUsers = await blogsManager.getUsersBannedForBlog(
      //   loginUser.body.accessToken,
      //   blog.body.id
      // )

      const comment = await commentsManager.createComment(
        createMockComment(1),
        post.body.id,
        loginUser2.body.accessToken,
      );

      console.log('comment: ', comment.body);

      // console.log('bannedUsers: ', bannedUsers.body);

      // console.log('user: ', user.body.login);
      // console.log('blog: ', blog.body);
      // console.log('user2: ', user2.body.login);
      // console.log('post: ', post.body);
      // console.log('upd: ', upd.status)
      // expect(blog.status).toBe(201);
    });
  });

  describe('blogger/blogs (e2e)', () => {
    it('/:id/ban (PUT)', async () => {
      const emailConfirmationInfo = usersService.createEmailConfirmation(true);
      const user = await usersManager.createUser(createMockUser(1), emailConfirmationInfo);
      const loginUser = await authManager.login(mockLoginData(1));
      const blog = await blogsManager.createBlogByBlogger(
        createMockBlog(1),
        loginUser.body.accessToken,
      );
      const post = await postsManager.createPost(createMockPost(1), blog.body.id);

      // console.log('blog: ', blog.body);

      const findedBlog = await blogsManager.getBlogById(blog.body.id);

      const findedPost = await postsManager.getPostById(post.body.id);

      console.log('findedBlog: ', findedBlog.body);

      console.log('findedPost: ', findedPost.body);

      const updModel = {
        isBanned: true,
      }

      const upd = await blogsManager.banBlogBySuperUser(updModel, blog.body.id);

      const findedBlog2 = await blogsManager.getBlogById(blog.body.id);
      console.log('findedBlog2: ', findedBlog2.body);

      const findedPost2 = await postsManager.getPostById(post.body.id);

      console.log('findedPost2: ', findedPost2.body);



      // console.log('user: ', user.b ody.login);
      // console.log('post: ', post.body);
      // console.log('upd: ', upd.status)
      // expect(blog.status).toBe(201);
    });
  });


});
