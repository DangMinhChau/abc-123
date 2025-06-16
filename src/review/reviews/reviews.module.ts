import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entities/review.entity';
import { User } from 'src/user/users/entities/user.entity';
import { Product } from 'src/product/products/entities/product.entity';
import { Order } from 'src/order/orders/entities/order.entity';
import { ProductsModule } from 'src/product/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, User, Product, Order]),
    ProductsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
