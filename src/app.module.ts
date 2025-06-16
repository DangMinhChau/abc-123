import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { envValidationSchema } from './config/env-validation.schema';
import { OrdersModule } from './order/orders/orders.module';
import { PaymentsModule } from './order/payments/payments.module';
import { ShippingModule } from './order/shippings/shipping.module';
import { OrderItemsModule } from './order/order-items/order-items.module';
import { CloudinaryModule } from './common/services/cloudinary/cloudinary.module';
import { MailModule } from './common/services/mail/mail.module';
import { WishlistsModule } from './cart/wishlists/wishlists.module';
import { NotificationsModule } from './notification/notifications/notifications.module';
import { CartsModule } from './cart/carts/carts.module';
import { CartItemsModule } from './cart/cart-items/cart-items.module';
import { ProductsModule } from 'src/product/products/products.module';
import { SizesModule } from 'src/product/sizes/sizes.module';
import { ColorsModule } from 'src/product/colors/colors.module';
import { ReviewsModule } from 'src/review/reviews/reviews.module';
import { UsersModule } from 'src/user/users/users.module';
import { VouchersModule } from 'src/promotion/vouchers/vouchers.module';
import { AuthModule } from 'src/user/auth/auth.module';
import { VariantsModule } from 'src/product/variants/variants.module';
import { AddressesModule } from 'src/user/addresses/addresses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60) * 1000, // Convert to milliseconds
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
      inject: [ConfigService],
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }), // Organized modules following NestJS best practices    // Product-related modules
    ProductsModule,
    SizesModule,
    ColorsModule,
    VariantsModule,
    // User-related modules
    UsersModule,
    //Order-related modules
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    OrderItemsModule,
    CloudinaryModule,
    MailModule,
    ReviewsModule,
    AuthModule,
    AddressesModule,
    NotificationsModule,
    CartsModule,
    CartItemsModule,
    WishlistsModule,
    VouchersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
