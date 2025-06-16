import { Module } from '@nestjs/common';
import { CartItemsService } from './cart-items.service';
import { CartItemsController } from './cart-items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from 'src/cart/cart-items/entities/cart-item.entity';
import { Cart } from 'src/cart/carts/entities/cart.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { User } from 'src/user/users/entities/user.entity';
import { ProductsModule } from 'src/product/products/products.module';

@Module({
  imports: [
    ProductsModule,
    TypeOrmModule.forFeature([CartItem, Cart, ProductVariant, User]),
  ],
  controllers: [CartItemsController],
  providers: [CartItemsService],
  exports: [CartItemsService],
})
export class CartItemsModule {}
