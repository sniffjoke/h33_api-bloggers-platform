import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';
import { QuestionEntity } from '../../domain/question.entity';
import { CreateQuestionInputModel } from '../../api/models/input/create-question.input.model';

export class CreateQuestionCommand {
  constructor(
    public questionData: CreateQuestionInputModel
  ) {
  }

}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand> {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
  ) {
  }

  async execute(command: CreateQuestionCommand) {
    const question = QuestionEntity.createQuestion(command.questionData);
    const newQuestion = await this.quizRepository.saveQuestion(question);
    return newQuestion.id;
  }
}
