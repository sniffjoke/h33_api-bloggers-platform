import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {BlogCreateModel} from '../../api/models/input/create-blog.input.model';
import {BlogsRepositoryTO} from '../../infrastructure/blogs.repository.to';
import {UsersCheckHandler} from "../../../users/domain/users.check-handler";
import {UsersService} from "../../../users/application/users.service";
import {UsersRepositoryTO} from "../../../users/infrastructure/users.repository.to";

export class BindUserToBlogCommand {
    constructor(
        public blogId: string,
        public userId: string,
    ) {
    }

}

@CommandHandler(BindUserToBlogCommand)
export class BindUserToBlogUseCase
    implements ICommandHandler<BindUserToBlogCommand> {
    constructor(
        private readonly blogsRepository: BlogsRepositoryTO,
        private readonly usersRepository: UsersRepositoryTO,
        private readonly usersCheckHandler: UsersCheckHandler
    ) {
    }

    async execute(command: BindUserToBlogCommand) {
        const blog = await this.blogsRepository.findBlogById(command.blogId);
        const user = await this.usersRepository.findUserById(command.userId);
        return await this.blogsRepository.bindUserAsOwnToBlog(blog, user)
    }
}
