import { Module } from '@nestjs/common';
import { CategoryClientService } from './category.service';
import { CategoryAdminService } from './admin/category-admin.service';
import { CategoryController } from './category.controller';
import { AdminCategoryController } from './admin/admin-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/product/categories/entities/category.entity';
import { Product } from 'src/product/products/entities/product.entity';
import { SizesModule } from '../sizes/sizes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Product]), SizesModule],
  controllers: [
    CategoryController, // Public controller
    AdminCategoryController, // Admin controller
  ],
  providers: [CategoryClientService, CategoryAdminService],
  exports: [CategoryClientService, CategoryAdminService, TypeOrmModule],
})
export class CategoriesModule {}
