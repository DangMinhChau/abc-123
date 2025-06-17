import { IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by variant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
