import { Injectable } from '@nestjs/common';
import { QuizRepositoryTO } from '../infrastructure/quiz.repository.to';
import { UsersService } from '../../users/application/users.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GamePairEntity } from '../domain/game-pair.entity';
import { LoggerService } from '../../../logger.service';

@Injectable()
export class QuizService {
  constructor(
    private readonly quizRepository: QuizRepositoryTO,
    private logger: LoggerService,
  ) {
  }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  // async checkFinishTime() {
  //   let lastAnswerTime;
  //   const currentActiveGames = await this.quizRepository.findAllActiveGames();
  //   if (!currentActiveGames.length) {
  //     this.logger.setContext('No active games found');
  //     this.logger.log('No active games found');
  //   }
  //   for (let game of currentActiveGames) {
  //     if (game.firstPlayerProgress.answers.length === 5) {
  //       lastAnswerTime = game.secondPlayerProgress.answers.length
  //         ? Date.parse(
  //             game.secondPlayerProgress.answers[
  //               game.secondPlayerProgress.answers.length - 1
  //             ].addedAt,
  //           )
  //         : Date.parse(
  //             game.firstPlayerProgress.answers[
  //               game.firstPlayerProgress.answers.length - 1
  //             ].addedAt,
  //           );
  //       if (
  //         game.secondPlayerProgress.answers.length < 5 &&
  //         Date.parse(
  //           new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' '),
  //         ) -
  //           10000 >
  //           lastAnswerTime
  //       ) {
  //         game = this.calculateScore(game);
  //         await this.quizRepository.finishGame(game);
  //       }
  //     }
  //     if (game.secondPlayerProgress.answers.length === 5) {
  //       lastAnswerTime = game.firstPlayerProgress.answers.length
  //         ? Date.parse(
  //             game.firstPlayerProgress.answers[
  //               game.firstPlayerProgress.answers.length - 1
  //             ].addedAt,
  //           )
  //         : Date.parse(
  //             game.secondPlayerProgress.answers[
  //               game.secondPlayerProgress.answers.length - 1
  //             ].addedAt,
  //           );
  //       if (
  //         game.firstPlayerProgress.answers.length < 5 &&
  //         Date.parse(
  //           new Date(Date.now()).toISOString().slice(0, 19).replace('T', ' '),
  //         ) -
  //           10000 >
  //           lastAnswerTime
  //       ) {
  //         game = this.calculateScore(game);
  //         await this.quizRepository.finishGame(game);
  //       }
  //     }
  //     await this.quizRepository.recordStatistic(game);
  //   }
  // }

  calculateScore(gamePair: GamePairEntity) {
    const hasCorrectAnswerFirstPlayer =
      gamePair.firstPlayerProgress.answers.some(
        (item) => item.answerStatus === 'Correct',
      );
    const hasCorrectAnswerSecondPlayer =
      gamePair.secondPlayerProgress.answers.some(
        (item) => item.answerStatus === 'Correct',
      );
    const firstPlayerLastAnswer = gamePair.firstPlayerProgress.answers.at(-1);
    const secondPlayerLastAnswer = gamePair.secondPlayerProgress.answers.at(-1);
    if (
      gamePair.firstPlayerProgress.answers.length === 5 &&
      gamePair.secondPlayerProgress.answers.length === 5
    ) {
      if (
        firstPlayerLastAnswer &&
        secondPlayerLastAnswer &&
        Date.parse(firstPlayerLastAnswer.addedAt) <
          Date.parse(secondPlayerLastAnswer.addedAt) &&
        hasCorrectAnswerFirstPlayer
      ) {
        gamePair.firstPlayerProgress.score++;
      }
      if (!secondPlayerLastAnswer) {
        gamePair.firstPlayerProgress.score++;
      }
      if (
        firstPlayerLastAnswer &&
        secondPlayerLastAnswer &&
        Date.parse(secondPlayerLastAnswer.addedAt) <
          Date.parse(firstPlayerLastAnswer.addedAt) &&
        hasCorrectAnswerSecondPlayer
      ) {
        gamePair.secondPlayerProgress.score++;
      }
      if (!firstPlayerLastAnswer) {
        gamePair.secondPlayerProgress.score++;
      }
    } else {
      if (
        gamePair.firstPlayerProgress.answers.length >
        gamePair.secondPlayerProgress.answers.length
      ) {
        gamePair.firstPlayerProgress.score++;
      } else {
        gamePair.secondPlayerProgress.score++;
      }
    }
    return gamePair;
  }
}
