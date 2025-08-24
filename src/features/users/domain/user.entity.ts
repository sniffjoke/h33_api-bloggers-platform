import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommentEntity } from '../../comments/domain/comment.entity';
import { LikeEntity } from '../../likes/domain/likes.entity';
import { UserScoreEntity } from '../../quiz/domain/user-score.entity';
import {BlogEntity} from "../../blogs/domain/blogs.entity";
import {PostEntity} from "../../posts/domain/posts.entity";
import { BanInfoEntity } from './ban-info.entity';
import { BanInfoDto } from '../api/models/input/ban-user.dto';
import { BlogBanEntity } from '../../blogs/domain/blogBan.entity';


@Entity('users')
export class UserEntity {

  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  login: string

  @Column()
  email: string

  @Column()
  password: string

  @OneToOne(() => BanInfoEntity, (banInfo) => banInfo.user, {cascade: true})
  banInfo: BanInfoEntity;

  @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
  createdAt: string

  @OneToMany(() => CommentEntity, (comment) => comment.user, { cascade: true })
  comments: CommentEntity[];
  // comments: Comment[];

  @OneToMany(() => LikeEntity, (like) => like.user, {onDelete: 'CASCADE'})
  likes: LikeEntity[];

  @OneToOne(() => UserScoreEntity, (score) => score.user, {cascade: true})
  score: UserScoreEntity;

  @OneToMany(() => BlogEntity, (blog) => blog.user, { cascade: true })
  blogs: BlogEntity[];

  @OneToMany(() => PostEntity, (post) => post.user, { cascade: true })
  posts: PostEntity[];

  @OneToMany(() => BlogBanEntity, (blogBan) => blogBan.user, { cascade: true })
  blogsBans: BlogBanEntity[];

  banUser(user: UserEntity, banModel: BanInfoDto) {
    user.banInfo.banDate = banModel.banDate;
    user.banInfo.banReason = banModel.banReason
    user.banInfo.isBanned = banModel.isBanned
  }

}
