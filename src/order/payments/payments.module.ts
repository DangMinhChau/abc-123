import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { SimplePaymentsController } from './controllers/simple-payments.controller';
import { SimplePaymentsService } from './services/simple-payments.service';
import { SimplePayPalService } from './services/simple-paypal.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), ConfigModule, OrdersModule],
  controllers: [SimplePaymentsController],
  providers: [SimplePaymentsService, SimplePayPalService],
  exports: [TypeOrmModule, SimplePaymentsService],
})
export class PaymentsModule {}
