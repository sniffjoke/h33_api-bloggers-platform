import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query, Req,
  UseGuards,
} from '@nestjs/common';
import { BlogCreateModel } from './models/input/create-blog.input.model';
import { PostCreateModelWithParams } from '../../posts/api/models/input/create-post.input.model';
import { BasicAuthGuard } from '../../../core/guards/basic-auth.guard';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/useCases/create-blog.use-case';
import { UpdateBlogCommand } from '../application/useCases/update-blog.use-case';
import { DeleteBlogCommand } from '../application/useCases/delete-blog.use-case';
import {
  UpdatePostWithBlogInParamsCommand,
} from '../../posts/application/useCases/update-post-from-blogs-in-params.use-case';
import { DeletePostWithBlogInParamsCommand } from '../../posts/application/useCases/delete-post-from-blogs-in-params.use-case';
import { CreatePostCommand } from '../../posts/application/useCases/create-post.use-case';
import { BlogsQueryRepositoryTO } from '../infrastructure/blogs.query-repository.to';
import { PostsQueryRepositoryTO } from '../../posts/infrastructure/posts.query-repository.to';
import {PostsService} from "../../posts/application/posts.service";
import {BindUserToBlogCommand} from "../application/useCases/bind-user-to-blog.use-case";
import { BlogsService } from '../application/blogs.service';
import { BanBlogBySuperDto } from './models/input/ban-blog.input.dto';

@Controller('sa')
export class BlogsSAController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepositoryTO,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepositoryTO,
    private readonly blogsService: BlogsService
  ) {
  }

  @Get('blogs')
  @UseGuards(BasicAuthGuard)
  async getAllBlogs(@Query() query: any) {
    const blogsWithQuery = await this.blogsQueryRepository.getAllBlogsWithQuery(
      query,
      true,
      undefined,
      true
    );
    return blogsWithQuery;
  }

  @Post('blogs')
  @UseGuards(BasicAuthGuard)
  async createBlog(@Body() dto: BlogCreateModel) {
    const blogId = await this.commandBus.execute(new CreateBlogCommand(dto));
    const newBlog = await this.blogsQueryRepository.blogOutput(blogId);
    return newBlog;
  }

  @Put('blogs/:id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updateBlogById(@Param('id') id: string, @Body() dto: BlogCreateModel) {
    const updateBlog = await this.commandBus.execute(new UpdateBlogCommand(id, dto));
    return updateBlog;
  }

  @Delete('blogs/:id')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async deleteBlog(@Param('id') id: string) {
    const deleteBlog = await this.commandBus.execute(new DeleteBlogCommand(id));
    return deleteBlog;
  }

  // ------------------------- posts ------------------------- //
  @Post('blogs/:id/posts')
  @UseGuards(BasicAuthGuard)
  async createPostWithParams(@Body() dto: PostCreateModelWithParams, @Param('id') blogId: string, @Req() req: Request) {
    const postId = await this.commandBus.execute(new CreatePostCommand({ ...dto, blogId }));
    const newPost = await this.postsQueryRepository.postOutput(postId);
    const postWithDetails = await this.postsService.generateOnePostWithLikesDetails(newPost, req.headers.authorization as string);
    return postWithDetails;
  }

  @Get('blogs/:id/posts')
  // @UseGuards(BasicAuthGuard)
  async getAllPostsWithBlogId(@Param('id') id: string, @Query() query: any, @Req() req: Request) {
    const posts = await this.postsQueryRepository.getAllPostsWithQuery(query, id);
    const newData = await this.postsService.generatePostsWithLikesDetails(posts.items, req.headers.authorization as string);
    return {
      ...posts,
      items: newData,
    };
  }

  @Put('blogs/:blogId/posts/:postId')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async updatePost(@Body() dto: PostCreateModelWithParams, @Param() idParams: any) {
    const updatePost = await this.commandBus.execute(new UpdatePostWithBlogInParamsCommand(idParams.postId, idParams.blogId, dto));
    return updatePost;
  }

  @Delete('blogs/:blogId/posts/:postId')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async deletePost(@Param() idParams: any) {
    const deletePost = await this.commandBus.execute(new DeletePostWithBlogInParamsCommand(idParams.postId, idParams.blogId));
    return deletePost;
  }

  @Put('blogs/:blogId/bind-with-user/:userId')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async bindBlogWithUser(@Param() idParams: any) {
    return await this.commandBus.execute(new BindUserToBlogCommand(idParams.blogId, idParams.userId));
  }

  //------------------_BLOGGER_PLATFORM_--------------------//

  @Put('blogs/:id/ban')
  @HttpCode(204)
  @UseGuards(BasicAuthGuard)
  async banBlogById(@Param('id') id: string, @Body() dto: BanBlogBySuperDto) {
    return await this.blogsService.banBlogBySuperUser(id, dto)
  }

}
