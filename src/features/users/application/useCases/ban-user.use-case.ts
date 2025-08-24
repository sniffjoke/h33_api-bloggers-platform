import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepositoryTO } from '../../infrastructure/users.repository.to';
import { BanUserDto } from '../../api/models/input/ban-user.dto';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { LikesService } from '../../../likes/application/likes.service';

export class BanUserCommand {
  constructor(
    public userId: string,
    public banUserModel: BanUserDto,
  ) {}
}

@CommandHandler(BanUserCommand)
export class BanUserUseCase implements ICommandHandler<BanUserCommand> {
  constructor(
    private readonly usersRepository: UsersRepositoryTO,
    private readonly likesRepository: LikesRepository,
    private readonly likesService: LikesService,
  ) {}

  async execute(command: BanUserCommand) {
    // console.log('BanUserCommand: ', command);
    const findedUser = await this.usersRepository.findUserById(command.userId);
    const banDate = command.banUserModel.isBanned
      ? new Date(Date.now()).toISOString()
      : null;
    const banReason = command.banUserModel.isBanned
      ? command.banUserModel.banReason
      : null;
    const banUserData = {
      isBanned: command.banUserModel.isBanned,
      banDate,
      banReason,
    };
    findedUser.banUser(findedUser, banUserData);
    // const likes = await this.likesRepository.getLikesByPostId(findedUser.id);
    // console.log('likes: ', likes);
    command.banUserModel.isBanned
      ? await this.likesRepository.hydeAllLikesForCurrentUser(findedUser.id)
      : await this.likesRepository.showAllLikesForCurrentUser(findedUser.id);
    await this.likesService.reCalculateLikesInfoForUserWithPosts(findedUser.id);
    await this.likesService.reCalculateLikesInfoForUserWithComments(findedUser.id);
    // await Promise.all(findedUser.comments.map(item => console.log(item.id)));
    // await this.commentsRepository.deleteComment('12')
    // await Promise.all(
    //   findedUser.comments.map(async (item) =>
    //     this.commentsRepository.deleteComment(item.id),
    //   ),
    // );
    return await this.usersRepository.saveUser(findedUser);
    // return await Promise.all(
    //   findedUser.comments.map(async (item) =>
    //     this.commentsRepository.deleteComment(item.id),
    //   ),
    // );
  }
}
