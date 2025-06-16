import { ApiProperty } from '@nestjs/swagger';

export class CategoryBreadcrumbDto {
  @ApiProperty({
    description: 'Category unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Áo thun',
  })
  name: string;

  @ApiProperty({
    description: 'Category URL-friendly slug',
    example: 'ao-thun',
  })
  slug: string;

  @ApiProperty({
    description: 'Level in category hierarchy (0 = root level)',
    example: 1,
    minimum: 0,
  })
  level: number;
}
