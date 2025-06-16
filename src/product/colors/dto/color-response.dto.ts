import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ColorResponseDto {
  @ApiProperty({
    description: 'Color unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Color name',
    example: 'Đỏ',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Color code',
    example: 'RED',
  })
  @Expose()
  code: string;

  @ApiProperty({
    description: 'Color hex code',
    example: '#FF0000',
  })
  @Expose()
  hexCode: string;

  @ApiProperty({
    description: 'Whether color is active',
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
