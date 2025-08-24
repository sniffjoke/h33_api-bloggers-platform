import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import {UserEntity} from "../../users/domain/user.entity";
import { BlogEntity } from './blogs.entity';
import { BlogBanInfoEntity } from './blogBanInfo.entity';


@Entity('blogBan')
export class BlogBanEntity {

    @PrimaryGeneratedColumn()
    id: string;

    @Column({default: false})
    banStatus: boolean

    @Column()
    userId: string;

    @Column()
    blogId: string;

    @ManyToOne(() => UserEntity, (user) => user.blogsBans, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @ManyToOne(() => BlogEntity, (blog) => blog.blogsBans, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blogId' })
    blog: BlogEntity;

    @OneToOne(() => BlogBanInfoEntity, (info) => info.blogBan )
    blogBanInfo: BlogBanInfoEntity

}
