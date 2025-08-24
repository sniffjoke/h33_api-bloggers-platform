import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeEntity } from '../domain/likes.entity';

@Injectable()
export class LikesRepository {
  constructor(
    @InjectRepository(LikeEntity)
    private readonly lRepository: Repository<LikeEntity>,
  ) {}

  async getLikesByPostId(postId: string, userId: string) {
    const likesCount = await this.lRepository
      .createQueryBuilder('l')
      .where('l.status = :status', { status: 'Like' })
      .andWhere('l.hyde = :hyde', { hyde: false })
      .andWhere('l.userId = :userId', { userId: userId })
      .andWhere('l.postId = :postId', { postId: postId })
      .getCount();
    return likesCount;
  }

  async getDislikesByPostId(postId: string, userId: string) {
    const dislikesCount = await this.lRepository
      .createQueryBuilder('l')
      .where('l.status = :status', { status: 'Dislike' })
      .andWhere('l.hyde = :hyde', { hyde: false })
      .andWhere('l.userId = :userId', { userId: userId })
      .andWhere('l.postId = :postId', { postId: postId })
      .getCount();
    return dislikesCount;
  }

  async getLikesByCommentId(commentId: string, userId: string) {
    const likesCount = await this.lRepository
      .createQueryBuilder('l')
      .where('l.status = :status', { status: 'Like' })
      .andWhere('l.hyde = :hyde', { hyde: false })
      .andWhere('l.userId = :userId', { userId: userId })
      .andWhere('l.commentId = :commentId', { commentId: commentId })
      .getCount();
    return likesCount;
  }

  async getDislikesByCommentId(commentId: string, userId: string) {
    const dislikesCount = await this.lRepository
      .createQueryBuilder('l')
      .where('l.status = :status', { status: 'Dislike' })
      .andWhere('l.hyde = :hyde', { hyde: false })
      .andWhere('l.userId = :userId', { userId: userId })
      .andWhere('l.commentId = :commentId', { commentId: commentId })
      .getCount();
    return dislikesCount;
  }

  async hydeAllLikesForCurrentUser(userId: string) {
    const likes = await this.lRepository.find({
      where: { userId },
    });
    await Promise.all(
      likes.map(async (like) => {
        like.hyde = true;
        return this.lRepository.save(like);
      }),
    );
    return likes;
  }

  async showAllLikesForCurrentUser(userId: string) {
    const likes = await this.lRepository.find({
      where: { userId },
    });
    await Promise.all(
      likes.map(async (like) => {
        like.hyde = false;
        return this.lRepository.save(like);
      }),
    );
    return likes;
  }
}
