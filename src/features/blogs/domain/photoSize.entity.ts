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
import { ImagesEntity } from './images.entity';

@Entity('photoSize')
export class PhotoSizeEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  url: string;

  @Column({nullable: true})
  width: number;

  @Column({nullable: true})
  height: number;

  @Column({nullable: true})
  fileSize: number;

  @ManyToOne(() => ImagesEntity, (image) => image.main)
  imageMain: ImagesEntity;

  @OneToOne(() => ImagesEntity, (image) => image.wallpaper)
  imageWallpaper: ImagesEntity;

  // @Column()
  // imageType: string;
  //
  // @Column()
  // ownType: string;

}
