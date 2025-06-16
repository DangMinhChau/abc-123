import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ImageResponseDto } from 'src/media/images/dto/response/image-response.dto';

export class CollectionResponseDto {
  @ApiProperty({
    description: 'Collection ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Collection name',
    example: 'Summer Vibes 2024',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Collection slug',
    example: 'summer-vibes-2024',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Season',
    example: 'Summer',
  })
  @Expose()
  season: string;

  @ApiProperty({
    description: 'Year',
    example: 2024,
  })
  @Expose()
  year: number;
  @ApiProperty({
    description: 'Collection description',
    example: 'A vibrant collection inspired by summer beaches and sunshine',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Collection images',
    type: [ImageResponseDto],
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        imageUrl: 'https://example.com/image1.jpg',
        altText: 'Summer beach',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        imageUrl: 'https://example.com/image2.jpg',
        altText: 'Sunset view',
        isPrimary: false,
        sortOrder: 2,
      },
    ],
  })
  @Expose()
  @Type(() => ImageResponseDto)
  @Optional()
  images?: ImageResponseDto[];

  @ApiProperty({
    description: 'Whether the collection is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
