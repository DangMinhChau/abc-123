import { ShippingMethod } from 'src/common/constants/shipping-method.enum';
import { ShippingStatus } from 'src/common/constants/shipping-status.enum';
import { Order } from 'src/order/orders/entities/order.entity';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Column, Entity, JoinColumn, OneToOne, Check, Index } from 'typeorm';

@Entity('shippings')
@Check(`"shipping_fee" >= 0`)
@Index(['trackingNumber'])
@Index(['status'])
export class Shipping extends BaseEntity {
  @OneToOne(() => Order)
  @JoinColumn()
  order: Order;
  @Column()
  recipientName: string;

  @Column()
  recipientPhone: string;

  @Column()
  address: string;

  @Column()
  wardCode: string;

  @Column()
  districtId: number;

  @Column()
  provinceId: number;

  @Column()
  ward: string;

  @Column()
  district: string;

  @Column()
  province: string;

  @Column({
    type: 'enum',
    enum: ShippingMethod,
  })
  shippingMethod: ShippingMethod;
  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  shippingFee: number;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.PENDING,
  })
  status: ShippingStatus;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'text', nullable: true })
  note: string;

  // GHN specific fields
  @Column({ nullable: true })
  ghnOrderCode: string;

  @Column({ nullable: true })
  ghnSortCode: string;

  @Column({ nullable: true })
  ghnTransType: string;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  codAmount: number;

  @Column({ nullable: true })
  serviceId: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  length: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  width: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  insuranceValue: number;
}
