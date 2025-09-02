import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { PostsService } from '../../posts/application/posts.service';
import { Request } from 'express';
import { CommandBus } from '@nestjs/cqrs';
import { BlogsQueryRepositoryTO } from '../infrastructure/blogs.query-repository.to';
import { PostsQueryRepositoryTO } from '../../posts/infrastructure/posts.query-repository.to';

@Controller()
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly blogsQueryRepository: BlogsQueryRepositoryTO,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepositoryTO,
  ) {}

  // TODO: метод execute pattern (service)

  @Get('blogs') //-1
  async getAll(@Query() query: any) {
    const blogsWithQuery =
      await this.blogsQueryRepository.getAllBlogsWithQuery(query);
    return blogsWithQuery;
  }

  @Get('blogs/:id')
  async getBlogById(@Param('id') id: string) {
    const blog = await this.blogsQueryRepository.blogOutput(id);
    return blog;
  }

  @Get('blogs/:id/posts')
  async getAllPostsByBlogId(
    @Param('id') id: string,
    @Query() query: any,
    @Req() req: Request,
  ) {
    const posts = await this.postsQueryRepository.getAllPostsWithQuery(
      query,
      id,
    );
    const newData = await this.postsService.generatePostsWithLikesDetails(
      posts.items,
      req.headers.authorization as string,
    );
    return {
      ...posts,
      items: newData,
    };
  }
}
