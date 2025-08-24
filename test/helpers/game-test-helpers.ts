import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateAnswerInputModel } from '../../src/features/quiz/api/models/input/create-answer.input.model';

export class GameTestManager {
  constructor(
    protected readonly app: INestApplication,
  ) {
  }

  async getAllMyGames(accessToken: string) {
    const response = await request(this.app.getHttpServer())
      .get('/pair-game-quiz/pairs/my')
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

  async getUnfinishedGame(accessToken: string) {
    const response = await request(this.app.getHttpServer())
      .get('/pair-game-quiz/pairs/my-current')
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

  async getGameById(accessToken: string, gameId: string) {
    const response = await request(this.app.getHttpServer())
      .get(`/pair-game-quiz/pairs/${gameId}`)
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

  async createGameOrConnect(accessToken: string) {
    const response = await request(this.app.getHttpServer())
      .post('/pair-game-quiz/pairs/connection')
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

  async sendAnswer(createModel: Partial<CreateAnswerInputModel>, accessToken: string) {
    const response = await request(this.app.getHttpServer())
      .post('/pair-game-quiz/pairs/my-current/answers')
      .send(createModel)
      .set({ 'Authorization': 'Bearer ' +  accessToken});
    return response;
  }

}

export const createMockAnswer = (data: string): CreateAnswerInputModel => ({
  answer: data,
});
