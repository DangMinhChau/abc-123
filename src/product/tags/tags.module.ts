import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { AdminTagsController } from './admin/admin-tags.controller';
import { AdminTagsService } from './admin/admin-tags.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  controllers: [TagsController, AdminTagsController],
  providers: [TagsService, AdminTagsService],
  exports: [TagsService, AdminTagsService, TypeOrmModule],
})
export class TagsModule {}
