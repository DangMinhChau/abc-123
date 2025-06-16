import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Color } from 'src/product/colors/entities/color.entity';
import { ColorsService } from './colors.service';
import { AdminColorsService } from './admin/admin-colors.service';
import { ColorsController } from './colors.controller';
import { AdminColorsController } from './admin/admin-colors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Color])],
  controllers: [
    ColorsController, // Public controller
    AdminColorsController, // Admin controller
  ],
  providers: [ColorsService, AdminColorsService],
  exports: [TypeOrmModule, ColorsService, AdminColorsService],
})
export class ColorsModule {}
