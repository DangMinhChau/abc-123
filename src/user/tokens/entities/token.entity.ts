import { User } from 'src/user/users/entities/user.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity('tokens')
export class UserToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'text' })
  token: string;

  @Column()
  type: string; // REFRESH, RESET_PASSWORD, EMAIL_VERIFICATION

  @Column()
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  revokedAt: Date;
}
