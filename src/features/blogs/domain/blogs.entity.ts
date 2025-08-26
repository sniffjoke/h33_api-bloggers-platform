import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostEntity } from '../../posts/domain/posts.entity';
import { UserEntity } from '../../users/domain/user.entity';
import { BlogBanEntity } from './blogBan.entity';
import { BlogBanBySuperEntity } from './blogBanBySuper.entity';
import { ImageEntity } from './images.entity';

@Entity('blogs')
export class BlogEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  websiteUrl: string;

  @Column({ default: false })
  isMembership: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  // @Column({ type: 'jsonb', default: new ImagesEntity()})
  @Column({nullable: true})
  imagesId: string;

  @Column({ nullable: true })
  userId: string;

  // @Column({nullable: true})
  // blogBanByUserId: string;

  @OneToMany(() => PostEntity, (post) => post.blog, { cascade: true })
  posts: PostEntity[];

  @ManyToOne(() => UserEntity, (user) => user.blogs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @OneToMany(() => BlogBanEntity, (blogBan) => blogBan.blog)
  blogsBans: BlogBanEntity[];

  @OneToOne(() => BlogBanBySuperEntity, (blogBanByUser) => blogBanByUser.blog, {
    cascade: true,
  })
  @JoinColumn({ name: 'blogBanByUserId' })
  banInfo: BlogBanBySuperEntity;

  // @OneToOne(() => ImageEntity, (image) => image.blog, { onDelete: 'CASCADE' })
  @OneToOne(() => ImageEntity, (image) => image.blog, { cascade: true, eager: true })
  @JoinColumn({ name: 'imagesId' })
  images: ImageEntity;
}
