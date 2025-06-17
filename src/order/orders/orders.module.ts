import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Shipping } from '../shippings/entities/shipping.entity';
import { OrderItemsModule } from '../order-items/order-items.module';
import { PaymentsModule } from '../payments/payments.module';
import { ShippingModule } from '../shippings/shipping.module';
import { User } from 'src/user/users/entities/user.entity';
import { Voucher } from 'src/promotion/vouchers/entities/voucher.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { Product } from 'src/product/products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Payment,
      Shipping,
      User,
      Voucher,
      ProductVariant,
      Product,
    ]),
    OrderItemsModule,
    forwardRef(() => PaymentsModule),
    ShippingModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
