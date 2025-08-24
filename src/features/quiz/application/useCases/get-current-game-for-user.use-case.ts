import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';
import { UsersService } from '../../../users/application/users.service';

export class GetCurGameForUserCommand {
  constructor(
    public bearerHeader: string
  ) {
  }

}

@CommandHandler(GetCurGameForUserCommand)
export class GetCurGameForUserUseCase
  implements ICommandHandler<GetCurGameForUserCommand> {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
    private readonly usersService: UsersService,
  ) {
  }

  async execute(command: GetCurGameForUserCommand) {
    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    return await this.quizRepository.findGameByUser(user);
  }
}
