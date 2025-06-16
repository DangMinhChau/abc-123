import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistsService } from './wishlists.service';
import { WishlistsController } from './wishlists.controller';
import { Wishlist } from './entities/wishlist.entity';
import { User } from 'src/user/users/entities/user.entity';
import { Product } from 'src/product/products/entities/product.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../cart-items/entities/cart-item.entity';
import { CartItemsModule } from '../cart-items/cart-items.module';
import { ProductsModule } from 'src/product/products/products.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wishlist,
      User,
      Product,
      ProductVariant,
      Cart,
      CartItem,
    ]),
    forwardRef(() => CartItemsModule),
    ProductsModule, 
  ],
  controllers: [WishlistsController],
  providers: [WishlistsService],
  exports: [WishlistsService],
})
export class WishlistsModule {}
