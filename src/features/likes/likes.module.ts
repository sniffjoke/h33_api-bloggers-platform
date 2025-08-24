import { Module } from '@nestjs/common';
import { LikeHandler } from './domain/like.handler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikeEntity } from './domain/likes.entity';
import { LikesRepository } from './infrastructure/likes.repository';
import { LikesService } from './application/likes.service';
import { PostsRepositoryTO } from '../posts/infrastructure/posts.repository.to';
import { PostEntity } from '../posts/domain/posts.entity';
import { CommentsRepositoryTO } from '../comments/infrastructure/comments.repository.to';
import { CommentEntity } from '../comments/domain/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LikeEntity, PostEntity, CommentEntity]),
  ],
  controllers: [],
  providers: [
    LikeHandler,
    LikesRepository,
    LikesService,
    PostsRepositoryTO,
    CommentsRepositoryTO
  ],
  exports: [
    LikeHandler,
    LikesRepository,
    LikesService,
    PostsRepositoryTO,
    CommentsRepositoryTO
  ]
})
export class LikesModule {}
