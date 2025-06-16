import { forwardRef, Module } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { AdminVariantsController } from './admin-variants.controller';
import { VariantsController } from './variants.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from './entities/variant.entity';
import { Product } from '../products/entities/product.entity';
import { Color } from '../colors/entities/color.entity';
import { Size } from '../sizes/entities/size.entity';
import { ProductsModule } from '../products/products.module';
import { SizesModule } from '../sizes/sizes.module';
import { ColorsModule } from '../colors/colors.module';
import { CloudinaryModule } from '../../common/services/cloudinary/cloudinary.module';
import { ImagesModule } from 'src/media/images/images.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariant, Product, Color, Size]),
    forwardRef(() => ProductsModule),
    SizesModule,
    ColorsModule,
    ImagesModule,
    CloudinaryModule,
  ],
  controllers: [AdminVariantsController, VariantsController],
  providers: [VariantsService],
  exports: [TypeOrmModule, VariantsService],
})
export class VariantsModule {}
