import { ApiProperty } from '@nestjs/swagger';

export class UploadImagesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Mảng các file ảnh cần upload',
    required: true,
  })
  images: Express.Multer.File[];
}
