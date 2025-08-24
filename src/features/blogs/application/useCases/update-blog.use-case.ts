import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {BlogCreateModel} from '../../api/models/input/create-blog.input.model';
import {BlogsRepositoryTO} from '../../infrastructure/blogs.repository.to';
import {UsersCheckHandler} from "../../../users/domain/users.check-handler";
import {UsersService} from "../../../users/application/users.service";

export class UpdateBlogCommand {
    constructor(
        public id: string,
        public dto: BlogCreateModel,
        public bearerHeader?: string
    ) {
    }

}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase
    implements ICommandHandler<UpdateBlogCommand> {
    constructor(
        private readonly blogsRepository: BlogsRepositoryTO,
        private readonly usersService: UsersService,
        private readonly usersCheckHandler: UsersCheckHandler
    ) {
    }

    async execute(command: UpdateBlogCommand) {
        const blog = await this.blogsRepository.findBlogById(command.id);

        if (!command.bearerHeader) {
            return await this.blogsRepository.updateBlogById(blog.id, command.dto);
        }

        const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
        if (this.usersCheckHandler.checkIsOwner(Number(blog.userId), Number(user.id))) {
            return await this.blogsRepository.updateBlogById(blog.id, command.dto);
        }
    }
}
