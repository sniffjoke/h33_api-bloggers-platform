import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';
import { UsersService } from '../../../users/application/users.service';

export class GetStatForUserCommand {
  constructor(
    public bearerHeader: string
  ) {
  }

}

@CommandHandler(GetStatForUserCommand)
export class GetStatForUserUseCase
  implements ICommandHandler<GetStatForUserCommand> {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
    private readonly usersService: UsersService,
  ) {
  }

  async execute(command: GetStatForUserCommand) {
    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    return await this.quizRepository.findStatistic(user);
  }
}
