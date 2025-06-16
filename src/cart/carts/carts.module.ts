import { Module, forwardRef } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from 'src/cart/carts/entities/cart.entity';
import { User } from 'src/user/users/entities/user.entity';
import { CartItemsModule } from '../cart-items/cart-items.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, User]),
    forwardRef(() => CartItemsModule),
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
