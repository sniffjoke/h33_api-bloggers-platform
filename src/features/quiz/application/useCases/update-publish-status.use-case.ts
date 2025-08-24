import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';
import { UpdatePublishStatusInputModel } from '../../api/models/input/update-publish-status.input.model';

export class UpdatePublishStatusCommand {
  constructor(
    public id: string,
    public updateData: UpdatePublishStatusInputModel
  ) {
  }

}

@CommandHandler(UpdatePublishStatusCommand)
export class UpdatePublishStatusUseCase
  implements ICommandHandler<UpdatePublishStatusCommand> {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
  ) {
  }

  async execute(command: UpdatePublishStatusCommand) {
    return await this.quizRepository.updateQuestionPublishStatus(
      command.id,
      command.updateData,
    );
  }
}
