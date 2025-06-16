import { Module } from '@nestjs/common';
import { StylesService } from './styles.service';
import { StylesController } from './styles.controller';
import { AdminStylesController } from './admin/admin-styles.controller';
import { AdminStylesService } from './admin/admin-styles.service';
import { Style } from 'src/product/styles/entities/style.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Style])],
  controllers: [StylesController, AdminStylesController],
  providers: [StylesService, AdminStylesService],
  exports: [StylesService, AdminStylesService, TypeOrmModule],
})
export class StylesModule {}
