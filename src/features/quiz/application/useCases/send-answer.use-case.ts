import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PlayerProgressEntity } from '../../domain/player-progress.entity';
import { GamePairEntity } from '../../domain/game-pair.entity';
import { ForbiddenException } from '@nestjs/common';
import { AnswerStatuses, GameStatuses } from '../../api/models/input/create-pairs-status.input.model';
import { AnswerEntity } from '../../domain/answer.entity';
import { UsersService } from '../../../users/application/users.service';
import { QuizRepositoryTO } from '../../infrastructure/quiz.repository.to';
import { CreateAnswerInputModel } from '../../api/models/input/create-answer.input.model';
import { QuizService } from '../quiz.service';

export class SendAnswerCommand {
  constructor(
    public answerData: CreateAnswerInputModel,
    public bearerHeader: string
  ) {
  }

}

@CommandHandler(SendAnswerCommand)
export class SendAnswerUseCase
  implements ICommandHandler<SendAnswerCommand> {
  constructor(
    private readonly usersService: UsersService,
    private readonly quizRepository: QuizRepositoryTO,
    private readonly quizService: QuizService,
  ) {
  }

  async execute(command: SendAnswerCommand) {
    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    let player: PlayerProgressEntity;
    let findedGame: GamePairEntity;
    let saveScores: GamePairEntity;
    try {
      findedGame = await this.quizRepository.findGameByUser(user);
    } catch (e) {
      throw new ForbiddenException('No found game');
    }
    if (findedGame.status === GameStatuses.PendingSecondPlayer) {
      throw new ForbiddenException('No active pair');
    }
    if (
      findedGame?.firstPlayerProgress.userId !== user.id &&
      findedGame?.secondPlayerProgress.userId !== user.id
    ) {
      throw new ForbiddenException('User is not owner');
    }
    const isFirstPlayer = findedGame.firstPlayerProgress.userId === user.id;
    player = isFirstPlayer
      ? findedGame.firstPlayerProgress
      : findedGame.secondPlayerProgress;

    if (player.answers.length >= 5) {
      throw new ForbiddenException('No more answers');
    }
    const newAnswer = new AnswerEntity();
    newAnswer.question =
      findedGame.questions![
      findedGame.questions!.length - 5 + player.answers.length
        ];
    newAnswer.playerId = player.user.id;
    newAnswer.body = command.answerData.answer;
    if (newAnswer.question.correctAnswers.includes(newAnswer.body)) {
      player.score++;
      newAnswer.answerStatus = AnswerStatuses.Correct;
    } else {
      newAnswer.answerStatus = AnswerStatuses.Incorrect;
    }
    player.answers.push(newAnswer);

    let saveAnswer = await this.quizRepository.saveGame(findedGame);
    if (
      saveAnswer.firstPlayerProgress.answers.length === 5 &&
      saveAnswer.secondPlayerProgress.answers.length === 5
    ) {
      findedGame.finishGame(saveAnswer);
      findedGame = this.quizService.calculateScore(findedGame);
      saveAnswer = await this.quizRepository.saveGame(findedGame)
      await this.quizRepository.recordStatistic(saveAnswer);
    }
    saveScores = await this.quizRepository.saveGame(saveAnswer)

    if (findedGame.firstPlayerProgress.userId === user.id) {
      return saveScores.firstPlayerProgress.answers[
      saveAnswer.firstPlayerProgress.answers.length - 1
        ].id;
    } else {
      return saveScores.secondPlayerProgress.answers[
      saveAnswer.secondPlayerProgress.answers.length - 1
        ].id;
    }
  }
}
