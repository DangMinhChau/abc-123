import { ApiProperty } from '@nestjs/swagger';

export class MaterialResponseDto {
  @ApiProperty({
    description: 'Material ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Material name',
    example: 'Cotton',
  })
  name: string;

  @ApiProperty({
    description: 'Material slug for URL',
    example: 'cotton',
  })
  slug: string;

  @ApiProperty({
    description: 'Material description',
    example: 'High-quality cotton fabric, soft and breathable',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Care instructions for the material',
    example: 'Machine wash cold, tumble dry low',
    required: false,
  })
  careinstructions?: string;

  @ApiProperty({
    description: 'Whether material is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
