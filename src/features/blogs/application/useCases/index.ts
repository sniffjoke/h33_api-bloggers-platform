import {UpdateBlogUseCase} from './update-blog.use-case';
import {CreateBlogUseCase} from './create-blog.use-case';
import {
    UpdatePostWithBlogInParamsUseCase
} from '../../../posts/application/useCases/update-post-from-blogs-in-params.use-case';
import {
    DeletePostWithBlogInParamsUseCase
} from '../../../posts/application/useCases/delete-post-from-blogs-in-params.use-case';
import {DeleteBlogUseCase} from './delete-blog.use-case';
import {BindUserToBlogUseCase} from "./bind-user-to-blog.use-case";

export const BlogsCommandHandlers = [
    CreateBlogUseCase,
    UpdateBlogUseCase,
    DeleteBlogUseCase,
    UpdatePostWithBlogInParamsUseCase,
    DeletePostWithBlogInParamsUseCase,
    BindUserToBlogUseCase
];
