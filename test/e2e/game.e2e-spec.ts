import { ExecutionContext, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-settings';
import { deleteAllData } from '../helpers/delete-all-data';
import {
  createMockQuestion,
  QuestionsTestManager,
} from '../helpers/questions-test-helpers';
import {
  createMockAnswer,
  GameTestManager,
} from '../helpers/game-test-helpers';
import {
  createMockUser,
  UsersTestManager,
} from '../helpers/users-test-helpers';
import { UsersService } from '../../src/features/users/application/users.service';
import { AuthTestManager, mockLoginData } from '../helpers/auth-test-helpers';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';

describe('QuizController (e2e)', () => {
  let app: INestApplication;
  let questionManager: QuestionsTestManager;
  let gameManager: GameTestManager;
  let usersManager: UsersTestManager;
  let usersService: UsersService;
  let authManager: AuthTestManager;
  let user1;
  let user2;
  let login1;
  let login2;

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) =>
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
    questionManager = result.questionTestManager;
    gameManager = result.gameTestManager;
    usersManager = result.userTestManager;
    usersService = result.usersService;
    authManager = result.authTestManager;
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  // beforeEach(async () => {
  // await deleteAllData(app);
  // });

  describe('/pair-game-quiz/pairs (e2e)', () => {
    it('/pair-game-quiz/pairs/connection (POST)', async () => {
      const emailConfirmationInfo = usersService.createEmailConfirmation(true);
      user1 = await usersManager.createUser(
        createMockUser(1),
        emailConfirmationInfo,
      );
      user2 = await usersManager.createUser(
        createMockUser(2),
        emailConfirmationInfo,
      );
      login1 = await authManager.login(mockLoginData(1));
      login2 = await authManager.login(mockLoginData(2));
      for (let i = 1; i < 6; i++) {
        const question = await questionManager.createQuestion(
          createMockQuestion(i),
        );
      }

      const createGame = await gameManager.createGameOrConnect(
        login1.body.accessToken,
      );
      expect(createGame.status).toBe(200);
      expect(createGame.body).toHaveProperty('id');
      expect(createGame.body).toHaveProperty('firstPlayerProgress');
      expect(createGame.body).toHaveProperty('secondPlayerProgress');
      expect(createGame.body).toHaveProperty('questions');
      expect(createGame.body).toHaveProperty('status');
      expect(createGame.body).toHaveProperty('pairCreatedDate');
      expect(createGame.body).toHaveProperty('startGameDate');
      expect(createGame.body).toHaveProperty('finishGameDate');
      expect(new Date(createGame.body.pairCreatedDate).toISOString()).toContain(
        'T',
      );
      expect(createGame.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          firstPlayerProgress: expect.any(Object),
          secondPlayerProgress: null,
          questions: null,
          status: expect.any(String),
          pairCreatedDate: expect.any(String),
          startGameDate: null,
          finishGameDate: null,
        }),
      );

      const connectGame = await gameManager.createGameOrConnect(
        login2.body.accessToken,
      );
      expect(connectGame.status).toBe(200);
      expect(connectGame.body).toHaveProperty('id');
      expect(connectGame.body).toHaveProperty('firstPlayerProgress');
      expect(connectGame.body).toHaveProperty('secondPlayerProgress');
      expect(connectGame.body).toHaveProperty('questions');
      expect(connectGame.body).toHaveProperty('status');
      expect(connectGame.body).toHaveProperty('pairCreatedDate');
      expect(connectGame.body).toHaveProperty('startGameDate');
      expect(connectGame.body).toHaveProperty('finishGameDate');
      expect(
        new Date(connectGame.body.pairCreatedDate).toISOString(),
      ).toContain('T');
      expect(new Date(connectGame.body.startGameDate).toISOString()).toContain(
        'T',
      );
      expect(connectGame.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          firstPlayerProgress: expect.any(Object),
          secondPlayerProgress: expect.any(Object),
          questions: expect.arrayContaining([]),
          status: expect.any(String),
          pairCreatedDate: expect.any(String),
          startGameDate: expect.any(String),
          finishGameDate: null,
        }),
      );

      connectGame.body.questions.forEach((question: any) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('body');
      });
    });

    it('/pair-game-quiz/pairs/my-current (GET)', async () => {
      const response = await gameManager.getUnfinishedGame(
        login1.body.accessToken,
      );
    });

    it('/pair-game-quiz/pairs/my (GET)', async () => {
      const response = await gameManager.getAllMyGames(login1.body.accessToken);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('pagesCount');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('items');
      response.body.items.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('firstPlayerProgress');
        expect(item).toHaveProperty('secondPlayerProgress');
        expect(item).toHaveProperty('questions');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('pairCreatedDate');
        expect(item).toHaveProperty('startGameDate');
        expect(item).toHaveProperty('finishGameDate');
      });
      expect(response.body).toEqual(
        expect.objectContaining({
          pageSize: expect.any(Number),
          pagesCount: expect.any(Number),
          totalCount: expect.any(Number),
          page: expect.any(Number),
          items: expect.arrayContaining([]),
        }),
      );
      // console.log('resp: ', response.body);
      // console.log('st: ', response.status);
    });

    it('/pair-game-quiz/pairs/:id (GET)', async () => {
      const emailConfirmationInfo = usersService.createEmailConfirmation(true);
      const user3 = await usersManager.createUser(
        createMockUser(3),
        emailConfirmationInfo,
      );
      const login3 = await authManager.login(mockLoginData(3));
      const createGame = await gameManager.createGameOrConnect(
        login3.body.accessToken,
      );
      const response = await gameManager.getGameById(
        login3.body.accessToken,
        createGame.body.id,
      );
    });

    it('/pair-game-quiz/pairs/my-current/answers (POST)', async () => {
      let sendAnswerF;
      let sendAnswerS;
      const curGame = await gameManager.getUnfinishedGame(
        login1.body.accessToken,
      );

      function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      for (let i = 0; i < 5; i++) {
        await Promise.all([
          (sendAnswerF = await gameManager.sendAnswer(
            createMockAnswer('correct'),
            login1.body.accessToken,
          )),
          await sleep(100),
          (sendAnswerS = await gameManager.sendAnswer(
            createMockAnswer('incorrect'),
            login2.body.accessToken,
          )),
        ]);
      }
      const response = await gameManager.getGameById(
        login1.body.accessToken,
        curGame.body.id,
      );
      expect(response.body).toHaveProperty('finishGameDate');
      expect(new Date(response.body.finishGameDate).toISOString()).toContain(
        'T',
      );
      expect(response.body.status).toBe('Finished');
      expect(response.body.firstPlayerProgress.score).toBeGreaterThan(
        response.body.secondPlayerProgress.score,
      );
      // Answer by first user
      expect(sendAnswerF.status).toBe(200);
      expect(sendAnswerF.body).toHaveProperty('questionId');
      expect(sendAnswerF.body).toHaveProperty('answerStatus');
      expect(sendAnswerF.body).toHaveProperty('addedAt');
      expect(sendAnswerF.body).toEqual(
        expect.objectContaining({
          questionId: expect.any(String),
          answerStatus: expect.any(String),
          addedAt: expect.any(String),
        }),
      );
      // Answer by second user
      expect(sendAnswerS.status).toBe(200);
      expect(sendAnswerS.body).toHaveProperty('questionId');
      expect(sendAnswerS.body).toHaveProperty('answerStatus');
      expect(sendAnswerS.body).toHaveProperty('addedAt');
      expect(sendAnswerS.body).toEqual(
        expect.objectContaining({
          questionId: expect.any(String),
          answerStatus: expect.any(String),
          addedAt: expect.any(String),
        }),
      );
    });
  });
});
