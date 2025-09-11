import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ImageEntity } from './images.entity';
import { ImageType } from '../api/models/input/create-blog.input.model';
import { PostEntity } from '../../posts/domain/posts.entity';

@Entity('photoSizes')
export class PhotoSizeEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  imageId: string;

  @Column({nullable: true})
  postId: string;

  @Column({
    type: 'enum',
    enum: ImageType,
    default: ImageType.MAIN,
  })
  imageType: ImageType;

  @ManyToOne(() => ImageEntity, (image) => image.photoMetadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'imageId' })
  image: ImageEntity;

  @ManyToOne(() => PostEntity, (post) =>  post.photoSize)
  @JoinColumn({ name: 'postId' })
  post: PostEntity;

}
