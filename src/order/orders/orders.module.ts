import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/order/orders/entities/order.entity';
import { OrderItem } from 'src/order/order-items/entities/order-item.entity';
import { Payment } from 'src/order/payments/entities/payment.entity';
import { Shipping } from 'src/order/shippings/entities/shipping.entity';
import { ProductsModule } from 'src/product/products/products.module';
import { PaymentsModule } from '../payments/payments.module';
import { ShippingModule } from '../shippings/shipping.module';
import { OrderItemsModule } from '../order-items/order-items.module';
import { NotificationsModule } from '../../notification/notifications/notifications.module';
import { VouchersModule } from 'src/promotion/vouchers/vouchers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Payment, Shipping]),
    ProductsModule,
    PaymentsModule,
    ShippingModule,
    OrderItemsModule,
    NotificationsModule,
    VouchersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
