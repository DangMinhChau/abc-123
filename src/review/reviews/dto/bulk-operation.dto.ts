import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationResultDto {
  @ApiProperty({
    description: 'Number of successfully processed items',
    example: 5,
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed processing items',
    example: 0,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Total number of items processed',
    example: 5,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Detailed results for each item',
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        success: true,
        message: 'Xác thực thành công',
      },
    ],
    isArray: true,
  })
  results: Array<{
    id: string;
    success: boolean;
    message: string;
  }>;
}

export class CanReviewResponseDto {
  @ApiProperty({
    description: 'Whether the user can review the product',
    example: true,
  })
  canReview: boolean;
}

export class BulkReviewIdsDto {
  @ApiProperty({
    description: 'Array of review IDs to process',
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  reviewIds: string[];
}

export class DeleteResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Xóa đánh giá thành công',
  })
  message: string;
}
