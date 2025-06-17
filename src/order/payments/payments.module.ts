import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SimplePayPalService } from './services/simple-paypal.service';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from 'src/product/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ConfigModule,
    OrdersModule,
    ProductsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, SimplePayPalService],
  exports: [TypeOrmModule, PaymentsService, SimplePayPalService],
})
export class PaymentsModule {}
