import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepositoryTO } from '../../infrastructure/blogs.repository.to';
import {UsersCheckHandler} from "../../../users/domain/users.check-handler";
import {UsersService} from "../../../users/application/users.service";

export class DeleteBlogCommand {
  constructor(
    public id: string,
    public bearerHeader?: string,
  ) {
  }

}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase
  implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepositoryTO,
    private readonly usersService: UsersService,
    private readonly usersCheckHandler: UsersCheckHandler
  ) {
  }

  async execute(command: DeleteBlogCommand) {
    const findedBlog = await this.blogsRepository.findBlogById(command.id)
    if (!command.bearerHeader) {
      return await this.blogsRepository.deleteBlog(command.id)
    }
    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    if (this.usersCheckHandler.checkIsOwner(Number(findedBlog.userId), Number(user.id))) {
      return await this.blogsRepository.deleteBlog(command.id)
    }
  }
}
