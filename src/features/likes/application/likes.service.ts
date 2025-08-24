import { Injectable } from '@nestjs/common';
import { PostsRepositoryTO } from '../../posts/infrastructure/posts.repository.to';
import { LikesRepository } from '../infrastructure/likes.repository';
import { CommentsRepositoryTO } from '../../comments/infrastructure/comments.repository.to';

@Injectable()
export class LikesService {
  constructor(
    private readonly postsRepository: PostsRepositoryTO,
    private readonly commentsRepository: CommentsRepositoryTO,
    private readonly likesRepository: LikesRepository,
  ) {}

  async reCalculateLikesInfoForUserWithPosts(userId: string) {
    const posts = await this.postsRepository.getAllPosts();
    const likes = await Promise.all(
      posts.map(async (post) => {
        const likesCount = await this.likesRepository.getLikesByPostId(
          post.id,
          userId,
        );
        post.extendedLikesInfo.likesCount = likesCount
        await this.postsRepository.savePost(post)
        return likesCount;
      }),
    );
    const dislikes = await Promise.all(
      posts.map(async (post) => {
        const likesCount = await this.likesRepository.getDislikesByPostId(
          post.id,
          userId,
        );
        post.extendedLikesInfo.dislikesCount = likesCount
        await this.postsRepository.savePost(post)
        return likesCount;
      }),
    );
    return
  }

  async reCalculateLikesInfoForUserWithComments(userId: string) {
    const comments = await this.commentsRepository.getAllComments();
    const likes = await Promise.all(
      comments.map(async (comment) => {
        const likesCount = await this.likesRepository.getLikesByCommentId(
          comment.id,
          userId,
        );
        comment.likesInfo.likesCount = likesCount
        await this.commentsRepository.saveComment(comment)
        return likesCount;
      }),
    );
    const dislikes = await Promise.all(
      comments.map(async (comment) => {
        const likesCount = await this.likesRepository.getDislikesByCommentId(
          comment.id,
          userId,
        );
        comment.likesInfo.dislikesCount = likesCount
        await this.commentsRepository.saveComment(comment)
        return likesCount;
      }),
    );
    return
  }
}
