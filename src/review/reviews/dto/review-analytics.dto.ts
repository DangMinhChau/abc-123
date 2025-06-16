import { ApiProperty } from '@nestjs/swagger';
import { ReviewDto } from './review.dto';

export class ReviewStatsDto {
  @ApiProperty({
    description: 'Total number of reviews',
    example: 150,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Average rating',
    example: 4.3,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Rating distribution by stars',
    example: {
      5: 60,
      4: 40,
      3: 30,
      2: 15,
      1: 5,
    },
  })
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };

  @ApiProperty({
    description: 'Percentage of verified reviews',
    example: 80,
  })
  verifiedPercentage?: number;
}

export class ReviewAnalyticsDto {
  @ApiProperty({
    description: 'Total number of reviews',
    example: 1500,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Average rating across all reviews',
    example: 4.2,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Rating distribution by stars',
    example: {
      5: 600,
      4: 400,
      3: 300,
      2: 150,
      1: 50,
    },
  })
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };

  @ApiProperty({
    description: 'Number of reviews this month',
    example: 120,
  })
  reviewsThisMonth: number;

  @ApiProperty({
    description: 'Number of pending reviews',
    example: 25,
  })
  pendingReviews: number;

  @ApiProperty({
    description: 'Number of verified reviews',
    example: 1200,
  })
  verifiedReviews: number;
}

export class ModerationSummaryDto {
  @ApiProperty({
    description: 'Number of pending reviews',
    example: 25,
  })
  pendingCount: number;

  @ApiProperty({
    description: 'Number of approved reviews',
    example: 1200,
  })
  approvedCount: number;

  @ApiProperty({
    description: 'Number of rejected reviews',
    example: 75,
  })
  rejectedCount: number;

  @ApiProperty({
    description: 'Number of flagged reviews',
    example: 10,
  })
  flaggedCount: number;

  @ApiProperty({
    description: 'Total number of moderated reviews',
    example: 1275,
  })
  totalModerated: number;
}

export class ProductReviewSummaryDto {
  @ApiProperty({
    description: 'Review statistics for the product',
    type: ReviewStatsDto,
  })
  stats: ReviewStatsDto;

  @ApiProperty({
    description: 'Recent reviews for the product',
    type: [ReviewDto],
  })
  recentReviews: ReviewDto[];

  @ApiProperty({
    description: 'Top helpful reviews for the product',
    type: [ReviewDto],
  })
  topReviews: ReviewDto[];
}

export class BulkOperationResultDto {
  @ApiProperty({
    description: 'Number of successful operations',
    example: 5,
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed operations',
    example: 0,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Total number of operations attempted',
    example: 5,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Detailed results of each operation',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        success: true,
        message: 'Operation successful',
      },
    ],
  })
  results: Array<{
    id: string;
    success: boolean;
    message: string;
  }>;
}

export class CanReviewDto {
  @ApiProperty({
    description: 'Whether the user can review the product',
    example: true,
  })
  canReview: boolean;
}
