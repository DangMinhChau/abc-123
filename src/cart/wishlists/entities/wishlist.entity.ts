import { Product } from 'src/product/products/entities/product.entity';
import { User } from 'src/user/users/entities/user.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Entity, ManyToOne, Unique, Index } from 'typeorm';

@Entity('wishlists')
@Unique(['user', 'product'])
@Index(['user'])
export class Wishlist extends BaseEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'CASCADE' })
  product: Product;
}
