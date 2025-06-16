import { forwardRef, Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { AdminCollectionsService } from './admin/admin-collections.service';
import { AdminCollectionController } from './admin/admin-collection.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from 'src/product/collections/entities/collection.entity';
import { Product } from 'src/product/products/entities/product.entity';
import { ProductsModule } from 'src/product/products/products.module';
import { ImagesModule } from 'src/media/images/images.module';
import { CloudinaryModule } from 'src/common/services/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collection, Product]),
    forwardRef(() => ProductsModule),
    ImagesModule,
    CloudinaryModule,
  ],
  controllers: [CollectionsController, AdminCollectionController],
  providers: [CollectionsService, AdminCollectionsService],
  exports: [TypeOrmModule, CollectionsService, AdminCollectionsService],
})
export class CollectionsModule {}
