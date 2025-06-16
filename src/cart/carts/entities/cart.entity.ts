import { CartItem } from 'src/cart/cart-items/entities/cart-item.entity';
import { User } from 'src/user/users/entities/user.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Entity, JoinColumn, OneToMany, OneToOne, Index } from 'typeorm';

@Entity('carts')
@Index(['user'])
export class Cart extends BaseEntity {
  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items: CartItem[];

  // Helper methods
  getTotalItems(): number {
    return this.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }

  getTotalAmount(): number {
    return (
      this.items?.reduce(
        (total, item) => total + item.calculateTotalPrice(),
        0,
      ) || 0
    );
  }

  isEmpty(): boolean {
    return !this.items || this.items.length === 0;
  }
}
