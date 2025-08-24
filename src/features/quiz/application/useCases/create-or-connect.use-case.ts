import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GamePairEntity } from '../../domain/game-pair.entity';
import { ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../../users/application/users.service';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';

export class CreateOrConnectCommand {
  constructor(
    public bearerHeader: string
  ) {
  }

}

@CommandHandler(CreateOrConnectCommand)
export class CreateOrConnectUseCase
  implements ICommandHandler<CreateOrConnectCommand> {
  constructor(
    private readonly usersService: UsersService,
    private readonly quizRepository: QuizRepositoryTO,
  ) {
  }

  async execute(command: CreateOrConnectCommand) {
    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    const findUserGames = await this.quizRepository.findLastActiveGameForUser(user)
    for (const item of findUserGames) {
      if (item.firstPlayerProgress.userId === user.id || item?.secondPlayerProgress?.userId === user.id) {
        throw new ForbiddenException('You cant connect because have an active game');
      }
    }
    let gamePair: GamePairEntity | null;
    gamePair = await this.quizRepository.findPendingGame();
    if (!gamePair) {
      const newGame = GamePairEntity.createGame(null, user);
      const createGame = await this.quizRepository.saveGame(newGame);
      return createGame.id;
    } else {
      if (gamePair.firstPlayerProgress.userId === user.id) {
        throw new ForbiddenException('You cant connect for your own game pair');
      }
      const questions = await this.quizRepository.getQuestionsForGame();
      gamePair.startGame(gamePair, questions, user);
      const saveGame = await this.quizRepository.saveGame(gamePair);
      return saveGame.id;
    }
  }
}
