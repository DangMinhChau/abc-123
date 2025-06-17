import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin/admin-orders.controller';
import { OrderManagementService } from './services/order-management.service';
import { OrderValidationService } from './services/order-validation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/order/orders/entities/order.entity';
import { OrderItem } from 'src/order/order-items/entities/order-item.entity';
import { Payment } from 'src/order/payments/entities/payment.entity';
import { Shipping } from 'src/order/shippings/entities/shipping.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { ProductsModule } from 'src/product/products/products.module';
import { ShippingModule } from '../shippings/shipping.module';
import { OrderItemsModule } from '../order-items/order-items.module';
import { NotificationsModule } from '../../notification/notifications/notifications.module';
import { VouchersModule } from 'src/promotion/vouchers/vouchers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Payment,
      Shipping,
      ProductVariant,
    ]),
    ProductsModule,
    ShippingModule,
    OrderItemsModule,
    NotificationsModule,
    VouchersModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrderManagementService, OrderValidationService],
  exports: [OrdersService, OrderManagementService, OrderValidationService],
})
export class OrdersModule {}
