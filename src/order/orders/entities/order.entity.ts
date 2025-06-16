import { OrderStatus } from 'src/common/constants/order-status.enum';
import { OrderItem } from 'src/order/order-items/entities/order-item.entity';
import { Payment } from 'src/order/payments/entities/payment.entity';
import { Shipping } from 'src/order/shippings/entities/shipping.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { User } from 'src/user/users/entities/user.entity';
import { Voucher } from 'src/promotion/vouchers/entities/voucher.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Check,
} from 'typeorm';

@Entity('orders')
@Index(['status', 'orderedAt'])
@Index(['user', 'status'])
@Check(`"total_price" >= 0`)
@Check(`"sub_total" >= 0`)
export class Order extends BaseEntity {
  @Column({ length: 50, unique: true })
  orderNumber: string;
  @ManyToOne(() => User, (user) => user.orders, {
    nullable: true, // Allow guest orders
    onDelete: 'SET NULL',
  })
  @Index()
  user: User | null;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column()
  customerPhone: string;

  @Column()
  shippingAddress: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Shipping, { cascade: true })
  @JoinColumn()
  shipping: Shipping;

  @OneToOne(() => Payment, { cascade: true })
  @JoinColumn()
  payment: Payment;

  @ManyToOne(() => Voucher, { nullable: true })
  voucher: Voucher;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  subTotal: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  shippingFee: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  totalPrice: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  note: string;
  @CreateDateColumn()
  orderedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  // Business logic methods
  calculateSubTotal(): number {
    return (
      this.items?.reduce((total, item) => total + item.getTotalPrice(), 0) || 0
    );
  }

  calculateTotalPrice(): number {
    const subTotal = this.calculateSubTotal();
    const shippingFee = this.shippingFee || 0;
    const discount = this.discount || 0;
    return subTotal + shippingFee - discount;
  }

  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(this.status);
  }

  isCompleted(): boolean {
    return this.status === OrderStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }
}
