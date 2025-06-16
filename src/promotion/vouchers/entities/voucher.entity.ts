import { DiscountType } from 'src/common/constants/discount-type.enum';
import { BaseEntity } from 'src/common/classes/base.entity';
import { Column, Entity, Check, Index } from 'typeorm';

@Entity('vouchers')
@Check(`
  (discount_type = 'amount' AND discount_amount > 0 AND discount_percent IS NULL) OR
  (discount_type = 'percent' AND discount_percent > 0 AND discount_percent <= 100 AND discount_amount IS NULL)
`)
@Check(`"usage_count" <= "usage_limit" OR "usage_limit" IS NULL`)
@Check(`"start_at" < "expire_at"`)
@Index(['code', 'isActive'])
@Index(['startAt', 'expireAt'])
export class Voucher extends BaseEntity {
  @Column({ unique: true, length: 50 })
  code: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.AMOUNT,
  })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  minOrderAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  maxDiscountAmount: number;

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp' })
  expireAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int', nullable: true })
  usageLimit: number;

  // Helper method to check if voucher is valid
  isValidForUse(): boolean {
    const now = new Date();
    return (
      this.isActive &&
      now >= this.startAt &&
      now <= this.expireAt &&
      (this.usageLimit === null || this.usageCount < this.usageLimit)
    );
  }

  // Calculate discount amount for given order total
  calculateDiscount(orderTotal: number): number {
    if (!this.isValidForUse() || (this.minOrderAmount && orderTotal < this.minOrderAmount)) {
      return 0;
    }

    let discount = 0;
    if (this.discountType === DiscountType.AMOUNT) {
      discount = this.discountAmount;
    } else if (this.discountType === DiscountType.PERCENT) {
      discount = (orderTotal * this.discountPercent) / 100;
    }

    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }

    return discount;
  }
}
