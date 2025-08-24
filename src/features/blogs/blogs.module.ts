import { Module } from '@nestjs/common';
import { BlogsController } from './api/blogs.controller';
import { PostsModule } from '../posts/posts.module';
import { BlogsCommandHandlers } from './application/useCases';
import { BlogsRepositoryTO } from './infrastructure/blogs.repository.to';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogEntity } from './domain/blogs.entity';
import { PostEntity } from '../posts/domain/posts.entity';
import { BlogsQueryRepositoryTO } from './infrastructure/blogs.query-repository.to';
import { BloggersController } from './api/bloggers.controller';
import { BlogsSAController } from './api/blogs.sa.controller';
import { UsersModule } from '../users/users.module';
import { UsersCheckHandler } from '../users/domain/users.check-handler';
import { BlogBanEntity } from './domain/blogBan.entity';
import { BlogsService } from './application/blogs.service';
import { BlogBanInfoEntity } from './domain/blogBanInfo.entity';
import { BlogBanBySuperEntity } from './domain/blogBanBySuper.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlogEntity, PostEntity, BlogBanEntity, BlogBanInfoEntity, BlogBanBySuperEntity]),
    PostsModule,
    UsersModule,
  ],
  controllers: [BlogsController, BlogsSAController, BloggersController],
  providers: [
    BlogsQueryRepositoryTO,
    BlogsRepositoryTO,
    ...BlogsCommandHandlers,
    UsersCheckHandler,
    BlogsService,
  ],
  exports: [
    BlogsQueryRepositoryTO,
    BlogsRepositoryTO,
    ...BlogsCommandHandlers,
    BlogsService,
  ],
})
export class BlogsModule {}
