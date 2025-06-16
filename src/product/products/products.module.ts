import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin/admin-products.controller';
import { AdminProductsService } from './admin/admin-products.service';
import { ProductFilterService } from './services/product-filter.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/product/products/entities/product.entity';
import { Category } from 'src/product/categories/entities/category.entity';
import { Material } from 'src/product/materials/entities/material.entity';
import { Style } from 'src/product/styles/entities/style.entity';
import { Collection } from 'src/product/collections/entities/collection.entity';
import { Tag } from 'src/product/tags/entities/tag.entity';
import { Color } from 'src/product/colors/entities/color.entity';
import { Size } from 'src/product/sizes/entities/size.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { CloudinaryModule } from 'src/common/services/cloudinary/cloudinary.module';
import { CategoriesModule } from 'src/product/categories/categories.module';
import { MaterialsModule } from 'src/product/materials/materials.module';
import { StylesModule } from 'src/product/styles/styles.module';
import { CollectionsModule } from 'src/product/collections/collections.module';
import { TagsModule } from 'src/product/tags/tags.module';
import { ColorsModule } from 'src/product/colors/colors.module';
import { SizesModule } from 'src/product/sizes/sizes.module';
import { VariantsModule } from 'src/product/variants/variants.module';
import { ImagesModule } from 'src/media/images/images.module';

@Module({
  imports: [
    // Enable query result caching for Product entities
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      Category,
      Material,
      Style,
      Collection,
      Tag,
      Color,
      Size,
    ]),
    CloudinaryModule,
    CategoriesModule,
    MaterialsModule,
    StylesModule,
    forwardRef(() => CollectionsModule),
    TagsModule,
    ColorsModule,
    SizesModule,
    forwardRef(() => VariantsModule),
    ImagesModule
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, AdminProductsService, ProductFilterService],
  exports: [ProductsService, AdminProductsService, TypeOrmModule],
})
export class ProductsModule {}
