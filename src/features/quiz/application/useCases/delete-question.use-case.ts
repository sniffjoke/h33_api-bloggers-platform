import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';

export class DeleteQuestionCommand {
  constructor(
    public id: string
  ) {
  }

}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand> {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
  ) {
  }

  async execute(command: DeleteQuestionCommand) {
    return await this.quizRepository.deleteQuestion(command.id);
  }
}
