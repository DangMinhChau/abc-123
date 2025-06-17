import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { GhnService } from './services/ghn.service';
import { GhnController } from './controllers/ghn.controller';
import { Shipping } from './entities/shipping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipping])],
  controllers: [ShippingController, GhnController],
  providers: [ShippingService, GhnService],
  exports: [ShippingService, GhnService],
})
export class ShippingModule {}
