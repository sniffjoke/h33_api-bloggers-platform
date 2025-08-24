import { SendAnswerUseCase } from './send-answer.use-case';
import { CreateOrConnectUseCase } from './create-or-connect.use-case';
import { CreateQuestionUseCase } from './create-question.use-case';
import { DeleteQuestionUseCase } from './delete-question.use-case';
import { UpdateQuestionUseCase } from './update-question.use-case';
import { UpdatePublishStatusUseCase } from './update-publish-status.use-case';
import { GetGameUseCase } from './get-game-by-id.use-case';
import { GetCurGameForUserUseCase } from './get-current-game-for-user.use-case';
import { GetStatForUserUseCase } from './get-stat-for-user.use-case';

export const QuizCommandHandlers = [
  SendAnswerUseCase,
  CreateOrConnectUseCase,
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  UpdateQuestionUseCase,
  UpdatePublishStatusUseCase,
  GetGameUseCase,
  GetCurGameForUserUseCase,
  GetStatForUserUseCase
];
