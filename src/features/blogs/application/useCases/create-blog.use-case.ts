import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogCreateModel } from '../../api/models/input/create-blog.input.model';
import { BlogsRepositoryTO } from '../../infrastructure/blogs.repository.to';
import {UsersService} from "../../../users/application/users.service";

export class CreateBlogCommand {
  constructor(
    public blogCreateModel: BlogCreateModel,
    public bearerHeader?: string
  ) {
  }

}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  implements ICommandHandler<CreateBlogCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepositoryTO,
    private readonly usersService: UsersService
  ) {
  }

  async execute(command: CreateBlogCommand) {
    if (!command.bearerHeader) {
      return this.blogsRepository.createBlog(command.blogCreateModel);
    }

    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    return this.blogsRepository.createBlog(command.blogCreateModel, user);
  }

  // async execute(command: CreateBlogCommand) {
  //   let newBlogId
  //   if (command.bearerHeader) {
  //     const token = this.tokensService.getToken(command.bearerHeader);
  //     const decodedToken = this.tokensService.decodeToken(token);
  //     const user = await this.usersRepository.findUserById(decodedToken._id);
  //     if (!user) {
  //       throw new NotFoundException('User not found');
  //     }
  //     newBlogId = await this.blogsRepository.createBlog(command.blogCreateModel, user)
  //   } else {
  //     newBlogId = await this.blogsRepository.createBlog(command.blogCreateModel)
  //   }
  //   return newBlogId
  // }
}
