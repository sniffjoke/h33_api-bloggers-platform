import {
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PhotoSizeEntity } from './photoSize.entity';
import { BlogEntity } from './blogs.entity';
import { PostEntity } from '../../posts/domain/posts.entity';

@Entity('images')
export class ImageEntity {
  @PrimaryGeneratedColumn()
  id: string;

  // @Column({nullable: true})
  // postId: string;

  @OneToMany(() => PhotoSizeEntity, (photoSize) => photoSize.image, {
    cascade: true,
    eager: true,
  })
  photoMetadata: PhotoSizeEntity[];

  @OneToOne(() => BlogEntity, (blog) => blog.images)
  blog: BlogEntity;

  @OneToMany(() => PostEntity, (post) => post.images)
  post: PostEntity;
}
