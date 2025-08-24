import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('banInfo')
export class BanInfoEntity {

  @PrimaryColumn()
  userId: string


  @Column({default: false})
  isBanned: boolean;

  @Column({type: 'timestamp', nullable: true})
  banDate: string | null;

  @Column({type: 'text', nullable: true})
  banReason: string | null;

  @OneToOne(() => UserEntity, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'userId'})
  user: UserEntity;

}
