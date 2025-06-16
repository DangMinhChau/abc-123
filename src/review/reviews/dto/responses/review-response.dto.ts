import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Review rating',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @Expose()
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Sản phẩm chất lượng tốt, đáng mua!',
  })
  @Expose()
  comment: string;

  @ApiProperty({
    description: 'Whether the review is verified',
    example: true,
  })
  @Expose()
  isVerified: boolean;

  @ApiProperty({
    description: 'Whether the review is active',
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
    description: 'Update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user@example.com',
      fullName: 'John Doe',
    },
  })
  @Expose()
  user: {
    id: string;
    email: string;
    fullName: string;
  };

  @ApiProperty({
    description: 'Product information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Product Name',
      slug: 'product-name',
    },
  })
  @Expose()
  product: {
    id: string;
    name: string;
    slug: string;
  };
}
