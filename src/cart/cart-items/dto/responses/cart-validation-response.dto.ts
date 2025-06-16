import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CartValidationIssueDto {
  @ApiProperty({
    description: 'Cart item ID with issue',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  itemId: string;

  @ApiProperty({
    description: 'Issue description',
    example: 'Product is out of stock',
  })
  @Expose()
  issue: string;

  @ApiProperty({
    description: 'Variant information',
    required: false,
  })
  @Expose()
  variant?: any;
}

export class CartValidationSummaryDto {
  @ApiProperty({
    description: 'Number of valid items',
    example: 3,
  })
  @Expose()
  totalValidItems: number;

  @ApiProperty({
    description: 'Number of invalid items',
    example: 1,
  })
  @Expose()
  totalInvalidItems: number;
}

export class CartValidationResponseDto {
  @ApiProperty({
    description: 'Whether the cart is valid',
    example: false,
  })
  @Expose()
  valid: boolean;

  @ApiProperty({
    description: 'List of validation issues',
    type: [CartValidationIssueDto],
  })
  @Expose()
  issues: CartValidationIssueDto[];

  @ApiProperty({
    description: 'Validation summary',
    type: CartValidationSummaryDto,
  })
  @Expose()
  summary: CartValidationSummaryDto;
}
