import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TokensService } from '../../../tokens/application/tokens.service';
import { CommentCreateModel } from '../../api/models/input/create-comment.input.model';
import { PostsRepositoryTO } from '../../../posts/infrastructure/posts.repository.to';
import { UsersRepositoryTO } from '../../../users/infrastructure/users.repository.to';
import { CommentsRepositoryTO } from '../../infrastructure/comments.repository.to';
import { BlogsRepositoryTO } from '../../../blogs/infrastructure/blogs.repository.to';

export class CreateCommentCommand {
  constructor(
    public commentDto: CommentCreateModel,
    public postId: string,
    public bearerHeader: string
  ) {
  }

}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand> {
  constructor(
    private readonly postsRepository: PostsRepositoryTO,
    private readonly tokensService: TokensService,
    private readonly usersRepository: UsersRepositoryTO,
    private readonly commentsRepository: CommentsRepositoryTO,
    private readonly blogsRepository: BlogsRepositoryTO
  ) {
  }

  async execute(command: CreateCommentCommand) {
    const token = this.tokensService.getToken(command.bearerHeader);
    const decodedToken = this.tokensService.decodeToken(token);
    const user = await this.usersRepository.findUserById(decodedToken._id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const post = await this.postsRepository.findPostById(command.postId);
    const checkUserInBL = await this.blogsRepository.checkUserInBL(user.id, post.blogId)
    if (checkUserInBL.length) {
      throw new ForbiddenException(`Forbidden, user ${user.login} in blackList for this blog`)
    }
    const findedPost = await this.postsRepository.findPostById(command.postId);
    const newCommentId = await this.commentsRepository.createComment(command.commentDto, user.id, command.postId);
    return newCommentId;
  }
}
