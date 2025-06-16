import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';
import { Order } from 'src/order/orders/entities/order.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Column, Entity, JoinColumn, OneToOne, Check, Index } from 'typeorm';

@Entity('payments')
@Check(`"amount" >= 0`)
@Index(['status'])
@Index(['transactionId'])
export class Payment extends BaseEntity {
  @OneToOne(() => Order, { nullable: false })
  @JoinColumn()
  order: Order;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 18, scale: 3 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  status: PaymentStatus;

  @Column({ nullable: true, length: 255 })
  transactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  note: string;

  // Business logic methods
  isPaid(): boolean {
    return this.status === PaymentStatus.PAID;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  canBeRefunded(): boolean {
    return (
      this.status === PaymentStatus.PAID &&
      !!this.paidAt &&
      // Chỉ hoàn tiền trong vòng 30 ngày kể từ khi thanh toán
      new Date().getTime() - new Date(this.paidAt).getTime() <
        30 * 24 * 60 * 60 * 1000
    );
  }
}
