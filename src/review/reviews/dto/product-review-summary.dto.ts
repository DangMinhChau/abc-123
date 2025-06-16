import { ApiProperty } from '@nestjs/swagger';
import { ReviewDto } from './review.dto';
import { ReviewStatsDto } from './review-analytics.dto';

export class ProductReviewSummaryDto {
  @ApiProperty({
    description: 'Product review statistics',
    type: ReviewStatsDto,
  })
  stats: ReviewStatsDto;

  @ApiProperty({
    description: 'Recent reviews for the product',
    type: [ReviewDto],
    isArray: true,
  })
  recentReviews: ReviewDto[];

  @ApiProperty({
    description: 'Top-rated helpful reviews',
    type: [ReviewDto],
    isArray: true,
  })
  topReviews: ReviewDto[];

  @ApiProperty({
    description: 'Product information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Áo thun nam cao cấp',
      slug: 'ao-thun-nam-cao-cap',
    },
  })
  productInfo?: {
    id: string;
    name: string;
    slug: string;
  };
}
