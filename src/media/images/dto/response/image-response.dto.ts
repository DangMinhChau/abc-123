import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the image',
    example: '12345',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'URL of the image',
    example: 'https://example.com/image.jpg',
  })
  @Expose()
  imageUrl: string;

  @ApiProperty({
    description: 'Indicates if the image is the primary image for the variant',
    example: true,
  })
  @Expose()
  isPrimary: boolean;

  @ApiProperty({
    description: 'Alternative text for the image',
    example: 'A beautiful sunset over the mountains',
  })
  @Expose()
  altText?: string;

  @ApiProperty({
    description: 'Public ID of the image in the storage service',
    example: 'public_id_12345',
  })
  publicId: string;

  @ApiProperty({
    description: 'Sort order of the image',
    example: 1,
  })
  @Expose()
  sortOrder: number;

  @ApiProperty({
    description: 'Creation date of the image',
    example: '2023-10-01T12:00:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date of the image',
    example: '2023-10-01T12:00:00Z',
  })
  @Expose()
  updatedAt: Date;
}
