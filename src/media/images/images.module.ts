import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryModule } from 'src/common/services/cloudinary/cloudinary.module';
import { Image } from 'src/media/images/entities/image.entity';
import { ImageService } from 'src/media/images/images.service';

@Module({
  imports: [TypeOrmModule.forFeature([Image]), CloudinaryModule],
  controllers: [],
  providers: [ImageService],
  exports: [TypeOrmModule, ImageService],
})
export class ImagesModule {}
