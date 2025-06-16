import { ApiProperty } from '@nestjs/swagger';

export class ModerationSummaryDto {
  @ApiProperty({
    description: 'Number of reviews pending moderation',
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
    description: 'Number of flagged reviews requiring attention',
    example: 10,
  })
  flaggedCount: number;

  @ApiProperty({
    description: 'Total number of moderated reviews',
    example: 1275,
  })
  totalModerated: number;
}
