import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';
import { CreateQuestionInputModel } from '../../api/models/input/create-question.input.model';

export class UpdateQuestionCommand {
  constructor(
    public id: string,
    public questionData: Partial<CreateQuestionInputModel>
  ) {
  }

}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand> {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
  ) {
  }

  async execute(command: UpdateQuestionCommand) {
    return await this.quizRepository.updateQuestionById(command.id, command.questionData);
  }
}
