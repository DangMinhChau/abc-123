import { ApiProperty } from '@nestjs/swagger';

export class ReviewStatsDto {
  @ApiProperty({
    description: 'Total number of reviews',
    example: 150,
  })
  totalReviews: number;

  @ApiProperty({
    description: 'Average rating score',
    example: 4.3,
    minimum: 0,
    maximum: 5,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Rating distribution by star count',
    example: {
      5: 60,
      4: 40,
      3: 30,
      2: 15,
      1: 5,
    },
  })
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  @ApiProperty({
    description: 'Percentage of verified reviews',
    example: 80,
    minimum: 0,
    maximum: 100,
  })
  verifiedPercentage?: number;
}
