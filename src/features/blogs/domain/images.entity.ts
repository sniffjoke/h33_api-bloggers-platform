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
import { BlogImagesViewModel } from '../api/models/output/blog-images.view.model';
import { PhotoSizeEntity } from './photoSize.entity';
import { BlogEntity } from './blogs.entity';

@Entity('images')
export class ImagesEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({nullable: true})
  wallpaperId: string

  @Column({nullable: true})
  postId: string;

  @OneToOne(() => PhotoSizeEntity, (photoSize) => photoSize.imageWallpaper, {cascade: true})
  @JoinColumn({name: 'wallpaperId'})
  wallpaper: PhotoSizeEntity;

  @OneToMany(() => PhotoSizeEntity, (photoSize) => photoSize.imageMain, {cascade: true, eager: true})
  @JoinColumn()
  main: PhotoSizeEntity[];

  // @OneToOne(() => BlogEntity, (blog) => blog.image, {eager: true})
  // blog: BlogEntity;
  //
  // @OneToOne(() => PostEntity, (post) => post.image, {eager: true})
  // post: PostEntity;

}
