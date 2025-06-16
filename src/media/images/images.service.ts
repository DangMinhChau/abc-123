import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/common/services/cloudinary/cloudinary.service';
import { Image } from 'src/media/images/entities/image.entity';
import { Repository } from 'typeorm';
@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(file: Express.Multer.File, altText: string, sortOrder?: number) {
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    if (!uploadResult) {
      throw new BadRequestException('Failed to upload image');
    }
    const image = this.imageRepository.create({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      isPrimary: false,
      altText: altText || '',
      sortOrder: sortOrder || 0,
    });
    return await this.imageRepository.save(image);
  }

  async createMultiple(files: Express.Multer.File[], altTexts?: string) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload');
    }
    const results = await Promise.all(
      await this.cloudinaryService.uploadMultipleFiles(files),
    );
    let sortOrder = 1;
    const images = results.map((uploadResult) => {
      if (!uploadResult) {
        throw new BadRequestException('Failed to upload images');
      }
      return this.imageRepository.create({
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        isPrimary: false,
        altText: altTexts ? '' + altTexts + ' - ' + sortOrder : '',
        sortOrder: sortOrder++,
      });
    });
    return await this.imageRepository.save(images);
  }

  async delete(imageId: string) {
    const image = await this.imageRepository.findOneBy({ id: imageId });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    await this.cloudinaryService.deleteFile(image.publicId);
    return await this.imageRepository.remove(image);
  }

  async replace(imageId: string, newFile: Express.Multer.File) {
    const image = await this.imageRepository.findOneBy({ id: imageId });
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    await this.cloudinaryService.deleteFile(image.publicId);
    const uploadResult = await this.cloudinaryService.uploadFile(newFile);
    if (!uploadResult) {
      throw new BadRequestException('Failed to upload new image');
    }
    image.imageUrl = uploadResult.secure_url;
    image.publicId = uploadResult.public_id;
    return await this.imageRepository.save(image);
  }
}
