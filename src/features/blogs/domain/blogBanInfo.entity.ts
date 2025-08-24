import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { BlogBanEntity } from './blogBan.entity';


@Entity('blogBanInfo')
export class BlogBanInfoEntity {

    @PrimaryColumn()
    blogBanId: string;

    @Column()
    banReason: string;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    banDate: string;

    @Column()
    isBanned: boolean;

    @OneToOne(() => BlogBanEntity, (ban) => ban.blogBanInfo, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'blogBanId'})
    blogBan: BlogBanEntity;

}
