import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TagResponseDto {
  @ApiProperty({
    description: 'Tag ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Tag name',
    example: 'Casual',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Tag slug',
    example: 'casual',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Whether the tag is active',
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
