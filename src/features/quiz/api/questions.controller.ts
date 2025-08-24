import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
  HttpCode,
} from '@nestjs/common';
import { QuizService } from '../application/quiz.service';
import { QuizQueryRepositoryTO } from '../infrastructure/quiz.query-repository.to';
import { CreateQuestionInputModel } from './models/input/create-question.input.model';
import { BasicAuthGuard } from '../../../core/guards/basic-auth.guard';
import { UpdatePublishStatusInputModel } from './models/input/update-publish-status.input.model';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/useCases/create-question.use-case';
import { DeleteQuestionCommand } from '../application/useCases/delete-question.use-case';
import { UpdateQuestionCommand } from '../application/useCases/update-question.use-case';
import { UpdatePublishStatusCommand } from '../application/useCases/update-publish-status.use-case';

@Controller('sa/quiz')
export class QuestionsController {
  constructor(
    private readonly quizService: QuizService,
    private readonly quizQueryRepository: QuizQueryRepositoryTO,
    private readonly commandBus: CommandBus,
  ) {
  }

  @Post('questions')
  @UseGuards(BasicAuthGuard)
  async createNewQuestion(@Body() questionData: CreateQuestionInputModel) {
    const newQuestionId = await this.commandBus.execute(new CreateQuestionCommand(questionData));
    return await this.quizQueryRepository.questionOutput(newQuestionId)
  }

  @Get('questions')
  @UseGuards(BasicAuthGuard)
  async getAllQuestionsWithQueryData(@Query() query: any) {
    return await this.quizQueryRepository.getAllQuestionsWithQuery(query);
  }

  @Put('questions/:id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async updateQuestion(@Body() questionData: CreateQuestionInputModel, @Param('id') id: string) {
    return await this.commandBus.execute(new UpdateQuestionCommand(id, questionData));
  }

  @Delete('questions/:id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async createQuestion(@Param('id') id: string) {
    return await this.commandBus.execute(new DeleteQuestionCommand(id));
  }

  @Put('questions/:id/publish')
  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  async changePublishStatus(@Body() updateData: UpdatePublishStatusInputModel, @Param('id') id: string) {
    return await this.commandBus.execute(new UpdatePublishStatusCommand(id, updateData));
  }

}
