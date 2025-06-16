import { Order } from 'src/order/orders/entities/order.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Column, Entity, ManyToOne, Check, Index } from 'typeorm';

@Entity('order_items')
@Check(`"quantity" > 0`)
@Check(`"unit_price" >= 0`)
@Index(['order', 'variant'])
export class OrderItem extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.items, { 
    nullable: false,
    onDelete: 'CASCADE' 
  })
  order: Order;

  @ManyToOne(() => ProductVariant, { nullable: false })
  variant: ProductVariant;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  unitPrice: number;

  // Store product details at time of order (for historical accuracy)
  @Column({ length: 255 })
  productName: string;

  @Column({ length: 50 })
  variantSku: string;

  @Column({ length: 50 })
  colorName: string;

  @Column({ length: 50 })
  sizeName: string;

  // Calculate total price for this line item
  getTotalPrice(): number {
    return this.quantity * this.unitPrice;
  }
}
