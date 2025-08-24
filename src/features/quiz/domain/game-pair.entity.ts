import {
  Column,
  Entity,
  JoinColumn, JoinTable, ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameStatuses } from '../api/models/input/create-pairs-status.input.model';
import { QuestionEntity } from './question.entity';
import { PlayerProgressEntity } from './player-progress.entity';
import { UserEntity } from '../../users/domain/user.entity';

@Entity('gamePair')
export class GamePairEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => PlayerProgressEntity, (player) => player.gamePairFirstPlayer, {
    cascade: true,
  })
  @JoinColumn({ name: 'firstPlayerProgressId' })
  firstPlayerProgress: PlayerProgressEntity;

  @OneToOne(() => PlayerProgressEntity, (player) => player.gamePairSecondPlayer, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: 'secondPlayerProgressId' })
  secondPlayerProgress: PlayerProgressEntity;

  @Column()
  firstPlayerProgressId: number;

  @Column({ nullable: true, default: null })
  secondPlayerProgressId: number | null;

  @Column()
  status: GameStatuses;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  pairCreatedDate: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  startGameDate: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  finishGameDate: string;

  @ManyToMany(() => QuestionEntity, (question) => question.gamePairs, {
    cascade: true,
    nullable: true
  })
  @JoinTable()
  questions: QuestionEntity[] | null;

  static createGame(questions: QuestionEntity[] | null, user: UserEntity): GamePairEntity {
    const newGame = new GamePairEntity();
    newGame.status = GameStatuses.PendingSecondPlayer;
    newGame.questions = questions;
    const firstPlayerProgress = new PlayerProgressEntity();
    firstPlayerProgress.userId = user.id;
    firstPlayerProgress.user = user;
    firstPlayerProgress.answers = [];
    newGame.firstPlayerProgress = firstPlayerProgress;
    newGame.secondPlayerProgressId = null;
    return newGame;
  }

  startGame(gamePair: GamePairEntity, questions: QuestionEntity[] | null, user: UserEntity): void {
    gamePair.status = GameStatuses.Active;
    gamePair.startGameDate = new Date(Date.now()).toISOString();
    gamePair.questions = questions;
    const secondPlayerProgress = new PlayerProgressEntity();
    secondPlayerProgress.userId = user.id;
    secondPlayerProgress.user = user;
    secondPlayerProgress.answers = [];
    gamePair.secondPlayerProgress = secondPlayerProgress;
  }

  finishGame(gamePair: GamePairEntity): void {
    gamePair.status = GameStatuses.Finished;
    gamePair.finishGameDate = new Date(Date.now()).toISOString();
  }

}
