import { Controller, Get, Post, Body, Param, Req, UseGuards, HttpCode, Query } from '@nestjs/common';
import { QuizService } from '../application/quiz.service';
import { GamePairViewModel } from './models/output/game-pair.view.model';
import { Request } from 'express';
import { CreateAnswerInputModel } from './models/input/create-answer.input.model';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { QuizQueryRepositoryTO } from '../infrastructure/quiz.query-repository.to';
import { UsersService } from '../../users/application/users.service';
import { JwtAuthStrategy } from '../../../core/guards/jwt-auth-strat.guard';
import { CommandBus } from '@nestjs/cqrs';
import { SendAnswerCommand } from '../application/useCases/send-answer.use-case';
import { CreateOrConnectCommand } from '../application/useCases/create-or-connect.use-case';
import { GetGameCommand } from '../application/useCases/get-game-by-id.use-case';
import { GetCurGameForUserCommand } from '../application/useCases/get-current-game-for-user.use-case';
import { GetStatForUserCommand } from '../application/useCases/get-stat-for-user.use-case';

@Controller('pair-game-quiz')
export class QuizController {
  constructor(
    private readonly quizQueryRepository: QuizQueryRepositoryTO,
    private readonly usersService: UsersService,
    private readonly commandBus: CommandBus,
  ) {
  }

  @Get('pairs/my')
  @UseGuards(JwtAuthGuard)
  async getAllMyGames(@Query() query: any, @Req() req: Request) {
    const user = await this.usersService.getUserByAuthToken(req.headers.authorization as string);
    return await this.quizQueryRepository.getAllMyGamesWithQuery(query, user);
  }

  @Get('pairs/my-current')
  @UseGuards(JwtAuthGuard)
  async getCurrentUnfUserGame(@Req() req: Request): Promise<GamePairViewModel> {
    const findedGame = await this.commandBus.execute(new GetCurGameForUserCommand(req.headers.authorization as string));
    return this.quizQueryRepository.gamePairOutputMap(findedGame);
  }

  @UseGuards(JwtAuthStrategy)
  @Get('pairs/:id')
  // @UseGuards(JwtAuthGuard)
  async getGameById(@Param('id') id: number, @Req() req: Request): Promise<GamePairViewModel> {
    const findedGame = await this.commandBus.execute(new GetGameCommand(id, req.headers.authorization as string));
    return this.quizQueryRepository.gamePairOutputMap(findedGame);
  }

  @Post('pairs/connection')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async createOrConnectToConnection(@Req() req: Request): Promise<GamePairViewModel> {
    const gameId = await this.commandBus.execute(new CreateOrConnectCommand(req.headers.authorization as string));
    const findedGame = await this.quizQueryRepository.gameOutput(gameId);
    return findedGame;
  }

  @Post('pairs/my-current/answers')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async sendAnswer(@Body() answerData: CreateAnswerInputModel, @Req() req: Request) {
    const answerId = await this.commandBus.execute(new SendAnswerCommand(answerData, req.headers.authorization as string));
    return this.quizQueryRepository.answerOutput(answerId);
  }

  @Get('users/my-statistic')
  @UseGuards(JwtAuthGuard)
  async getMyStatistic(@Req() req: Request) {
    const myStatistic = await this.commandBus.execute(new GetStatForUserCommand(req.headers.authorization as string));
    const myStatisticOutput = this.quizQueryRepository.myStatisticOutputMap(myStatistic)
    return myStatisticOutput
  }

  @Get('users/top')
  async getAllStatistic(@Query() query: any) {
    const statsArray = await this.quizQueryRepository.getAllStatistic(query);
    return statsArray;
  }
}
