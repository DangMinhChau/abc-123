import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Size } from './entities/size.entity';
import { Category } from '../categories/entities/category.entity';
import { SizesService } from './sizes.service';
import { AdminSizesService } from './admin/admin-sizes.service';
import { SizesController } from './sizes.controller';
import { AdminSizesController } from './admin/admin-sizes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Size, Category])],
  controllers: [
    SizesController, // Public controller
    AdminSizesController, // Admin controller
  ],
  providers: [SizesService, AdminSizesService],
  exports: [SizesService, AdminSizesService, TypeOrmModule],
})
export class SizesModule {}
