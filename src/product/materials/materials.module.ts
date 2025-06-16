import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { MaterialsService } from './materials.service';
import { AdminMaterialsService } from './admin/admin-materials.service';
import { MaterialsController } from './materials.controller';
import { AdminMaterialsController } from './admin/admin-materials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  controllers: [
    MaterialsController, // Public controller
    AdminMaterialsController, // Admin controller
  ],
  providers: [MaterialsService, AdminMaterialsService],
  exports: [MaterialsService, AdminMaterialsService, TypeOrmModule],
})
export class MaterialsModule {}
