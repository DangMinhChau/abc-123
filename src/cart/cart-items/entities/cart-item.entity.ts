import { Cart } from 'src/cart/carts/entities/cart.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Column, Entity, ManyToOne, Unique, Check, Index } from 'typeorm';

@Entity('cart_items')
@Unique(['cart', 'variant'])
@Check(`"quantity" > 0`)
@Index(['cart'])
export class CartItem extends BaseEntity {
  @ManyToOne(() => Cart, (cart) => cart.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  cart: Cart;

  @ManyToOne(() => ProductVariant, { nullable: false })
  variant: ProductVariant;

  @Column({ type: 'int' })
  quantity: number;
  // Helper method to calculate total price
  calculateTotalPrice(): number {
    return this.quantity * (this.variant?.product?.calculateActualPrice() || 0);
  }
}
