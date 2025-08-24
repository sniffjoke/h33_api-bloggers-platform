import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';
import { UsersService } from '../../../users/application/users.service';

export class GetGameCommand {
  constructor(
    public id: number,
    public bearerHeader: string
  ) {
  }

}

@CommandHandler(GetGameCommand)
export class GetGameUseCase
  implements ICommandHandler<GetGameCommand> {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
    private readonly usersService: UsersService,
  ) {
  }

  async execute(command: GetGameCommand) {
    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    return await this.quizRepository.findGameById(command.id, user);
  }
}
