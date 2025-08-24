import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GamePairEntity } from './game-pair.entity';
import { CreateQuestionInputModel } from '../api/models/input/create-question.input.model';
import { UpdatePublishStatusInputModel } from '../api/models/input/update-publish-status.input.model';


@Entity('question')
export class QuestionEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  body: string


  @Column('text', {array: true})
  correctAnswers: string[];

  @Column({default: false})
  published: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  updatedAt: string;

  @ManyToMany(() => GamePairEntity, (gamePair) => gamePair.questions)
  gamePairs: GamePairEntity[];

  static createQuestion(questionData: CreateQuestionInputModel): QuestionEntity {
    const question = new QuestionEntity();
    question.body = questionData.body;
    question.correctAnswers = questionData.correctAnswers;
    return question;
  }

  updatePublishStatus(question: QuestionEntity, updateData: UpdatePublishStatusInputModel): void {
    question.published = updateData.published;
    question.updatedAt = new Date(Date.now()).toISOString();
  }

}

