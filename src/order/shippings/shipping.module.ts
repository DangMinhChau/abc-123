import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { GHNService } from './services/ghn.service';
import { CacheService } from './services/cache.service';
import { GHNAddressController } from './controllers/ghn-address.controller';
import { Shipping } from './entities/shipping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipping]),
    HttpModule,
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  controllers: [ShippingController, GHNAddressController],
  providers: [ShippingService, GHNService, CacheService],
  exports: [ShippingService, GHNService, CacheService],
})
export class ShippingModule {}
