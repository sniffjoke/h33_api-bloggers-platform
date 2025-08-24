import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostCreateModelWithParams } from '../../api/models/input/create-post.input.model';
import { BlogsRepositoryTO } from '../../../blogs/infrastructure/blogs.repository.to';
import { PostsRepositoryTO } from '../../infrastructure/posts.repository.to';
import {UsersService} from "../../../users/application/users.service";
import {UsersCheckHandler} from "../../../users/domain/users.check-handler";

export class UpdatePostWithBlogInParamsCommand {
  constructor(
    public postId: string,
    public blogId: string,
    public dto: PostCreateModelWithParams,
    public bearerHeader?: string
  ) {
  }

}

@CommandHandler(UpdatePostWithBlogInParamsCommand)
export class UpdatePostWithBlogInParamsUseCase
  implements ICommandHandler<UpdatePostWithBlogInParamsCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepositoryTO,
    private readonly postsRepository: PostsRepositoryTO,
    private readonly usersService: UsersService,
    private readonly usersCheckHandler: UsersCheckHandler
  ) {
  }

  async execute(command: UpdatePostWithBlogInParamsCommand) {
    const findedBlog = await this.blogsRepository.findBlogById(command.blogId)
    const findedPost = await this.postsRepository.findPostById(command.postId)

    if (!command.bearerHeader) {
      return await this.postsRepository.updatePostFromBlogsUri(command.postId, command.blogId, command.dto)
    }

    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    if (this.usersCheckHandler.checkIsOwner(Number(findedPost.userId), Number(user.id))) {
      return await this.postsRepository.updatePostFromBlogsUri(command.postId, command.blogId, command.dto)
    }
  }
}
