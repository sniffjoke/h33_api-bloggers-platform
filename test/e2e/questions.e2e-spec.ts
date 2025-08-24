import { INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-settings';
import { deleteAllData } from '../helpers/delete-all-data';
import {
  createMockQuestion,
  QuestionsTestManager,
} from '../helpers/questions-test-helpers';
import { Repository } from 'typeorm';
import { QuestionEntity } from '../../src/features/quiz/domain/question.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateQuestionInputModel } from '../../src/features/quiz/api/models/input/create-question.input.model';

describe('QuestionsController (e2e)', () => {
  let app: INestApplication;
  let questionManager: QuestionsTestManager;

  beforeAll(async () => {
    const result = await initSettings();
    app = result.app;
    questionManager = result.questionTestManager;
    // await deleteAllData(app)
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  describe('/sa/quiz/questions (e2e)', () => {
    it('/sa/quiz/questions (POST)', async () => {
      const question = await questionManager.createQuestion(
        createMockQuestion(1),
      );
      expect(question.status).toBe(201);
      expect(question.body).toHaveProperty('id');
      expect(question.body).toHaveProperty('body');
      expect(question.body).toHaveProperty('correctAnswers');
      expect(question.body).toHaveProperty('published');
      expect(question.body).toHaveProperty('createdAt');
      expect(question.body).toHaveProperty('updatedAt');
      expect(new Date(question.body.createdAt).toISOString()).toContain('T');
      expect(question.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          body: expect.any(String),
          correctAnswers: expect.any(Array),
          published: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: null,
        }),
      );
      expect(question.body.createdAt).toBeDefined();
    });

    it('/sa/quiz/questions/:id (UPDATE)', async () => {
      const question = await questionManager.createQuestion(
        createMockQuestion(2),
      );
      const upd = await questionManager.updateQuestionByid(
        createMockQuestion(3),
        question.body.id,
      );
      expect(upd.status).toBe(204);
      const questionsRepository = app.get<Repository<QuestionEntity>>(
        getRepositoryToken(QuestionEntity),
      );
      const updatedQuestion = await questionsRepository.findOne({
        where: { id: question.body.id },
      });
      if (updatedQuestion) {
        expect(updatedQuestion.id).toEqual(Number(question.body.id));
        expect(updatedQuestion.body).not.toEqual(question.body.body);
      }
    });

    it('/sa/quiz/questions/:id/publish (UPDATE)', async () => {
      const question = await questionManager.createQuestion(
        createMockQuestion(4),
      );
      const upd = await questionManager.updateQuestionWithPublish(
        {
          published: true,
        },
        question.body.id,
      );
      expect(upd.status).toBe(204);
      const questionsRepository = app.get<Repository<QuestionEntity>>(
        getRepositoryToken(QuestionEntity),
      );
      const updatedQuestion = await questionsRepository.findOne({
        where: { id: question.body.id },
      });
      if (updatedQuestion) {
        expect(updatedQuestion.id).toEqual(Number(question.body.id));
        expect(updatedQuestion.published).not.toEqual(question.body.published);
      }
    });

    it('/sa/quiz/questions/:id (DELETE)', async () => {
      const newQuestion = await questionManager.createQuestion(
        createMockQuestion(5),
      );
      const response = await questionManager.deleteQuestion(
        newQuestion.body.id,
      );
      const questionsRepository = app.get<Repository<QuestionEntity>>(
        getRepositoryToken(QuestionEntity),
      );
      const deletedQuestion = await questionsRepository.findOne({
        where: { id: newQuestion.body.id },
      });
      const questions = await questionManager.getQuestions();
      expect(response.status).toBe(204);
      expect(deletedQuestion).toBe(null);
      expect(questions.body.items.length).toBeLessThan(1);
    });

    it('/sa/quiz/questions (GET)', async () => {
      for (let i = 6; i < 16; i++) {
        let newQuestion = await questionManager.createQuestion(
          createMockQuestion(i),
        );
      }
      const questions = await questionManager.getQuestions();
      expect(questions.status).toBe(200);
      expect(Array.isArray(questions.body.items)).toBe(true);
      // toHaveLength
      expect(questions.body.items.length).toBeGreaterThan(0);
      //toEqual
      questions.body.items.forEach((question: any) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('body');
        expect(question).toHaveProperty('correctAnswers');
        expect(question).toHaveProperty('published');
        expect(question).toHaveProperty('createdAt');
        expect(question).toHaveProperty('updatedAt');
      });
      questions.body.items.forEach((question: any) => {
        expect(question.createdAt).toBeDefined();
        expect(question.updatedAt).toBeDefined();
        expect(new Date(question.createdAt).toISOString()).toContain('T');
      });
      expect(questions.body.items[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          body: expect.any(String),
          correctAnswers: expect.any(Array),
          published: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: null,
        }),
      );
      if (questions.body.items.length === 0) {
        expect(questions.body.items).toEqual([]);
      } else {
        const dates = questions.body.items.map(
          (blog: any) => new Date(blog.createdAt),
        );
        expect(dates).toEqual(
          [...dates].sort((a, b) => b.getTime() - a.getTime()),
        );
      }
    });
  });

  describe('BadRequest (e2e)', () => {
    it('should return 400 if required field is missing on create question', async () => {
      const invalidPayload: Partial<CreateQuestionInputModel> = {
        body: '',
        correctAnswers: [],
      };

      const response = await questionManager.createQuestion(invalidPayload);
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
        expect(['body']).toContain(error.field);
      });
    });

    it('should return 400 if required field is missing on update question', async () => {
      const newQuestion = await questionManager.createQuestion(
        createMockQuestion(17),
      );
      const invalidPayload: Partial<CreateQuestionInputModel> = {
        body: '',
      };
      const response = await questionManager.updateQuestionByid(
        invalidPayload,
        newQuestion.body.id,
      );
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
        expect(['body']).toContain(error.field);
      });
    });
  });
  //
  describe('NotFound (e2e)', () => {
    it('should return 404 if id field from URL not found on delete blog', async () => {
      const newQuestion = await questionManager.createQuestion(
        createMockQuestion(18),
      );
      const response = await questionManager.deleteQuestion(
        newQuestion.body.id,
      );
      const questionsRepository = app.get<Repository<QuestionEntity>>(
        getRepositoryToken(QuestionEntity),
      );
      const responseDeleteAgain = await questionManager.deleteQuestion(
        newQuestion.body.id,
      );
      const deletedQuestion = await questionsRepository.findOne({
        where: { id: newQuestion.body.id },
      });
      expect(responseDeleteAgain.status).toBe(404);
      expect(responseDeleteAgain.body).toHaveProperty('statusCode', 404);
      expect(responseDeleteAgain.body).toHaveProperty('message');
      expect(deletedQuestion).toBe(null);
    });

      it('should return 404 if id field from URL not found on update question', async () => {
        const newQuestion = await questionManager.createQuestion(createMockQuestion(19));
        const deleteQuestion = await questionManager.deleteQuestion(newQuestion.body.id);
        const upd = await questionManager.updateQuestionByid(createMockQuestion(20), newQuestion.body.id);
        const questionsRepository = app.get<Repository<QuestionEntity>>(
          getRepositoryToken(QuestionEntity),
        );
        const deletedQuestion = await questionsRepository.findOne({
          where: { id: newQuestion.body.id },
        });
        expect(upd.status).toBe(404);
        expect(upd.body).toHaveProperty('statusCode', 404);
        expect(upd.body).toHaveProperty('message');
        expect(deletedQuestion).toBe(null);
      });
  });

  describe('AuthGuard (e2e)', () => {
    // question must not create
    it('should return 401 when no token is provided', async () => {
      const response = await questionManager.createQuestionWOSA(createMockQuestion(20));
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
    // questions must not get
    it('should return 401 when no token is provided', async () => {
      for (let i = 21; i < 31; i++) {
        let newQuestion = await questionManager.createQuestion(
          createMockQuestion(i),
        );
      }
      const response = await questionManager.getQuestionsWOSA();
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });
});
