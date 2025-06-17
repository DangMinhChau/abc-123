import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayPalService } from './services/paypal.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order])],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayPalService],
  exports: [PaymentsService, PayPalService],
})
export class PaymentsModule {}
