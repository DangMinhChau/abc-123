import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StyleResponseDto {
  @ApiProperty({
    description: 'Style unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Style name',
    example: 'Casual',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Style slug',
    example: 'casual',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Style description',
    example: 'Comfortable and relaxed clothing style',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Whether style is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;
}
