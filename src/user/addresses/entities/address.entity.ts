import { BaseEntity } from 'src/common/classes/base.entity';
import { User } from 'src/user/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('addresses')
export class Address extends BaseEntity {
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  recipientName: string;

  @Column()
  phoneNumber: string;

  @Column()
  streetAddress: string;

  @Column({ length: 50 })
  ward: string;

  @Column({ length: 50 })
  district: string;

  @Column({ length: 50 })
  province: string;

  @Column({ default: false })
  isDefault: boolean;
}
