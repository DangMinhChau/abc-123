import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum ShippingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export class ShippingQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by shipping status',
    enum: ShippingStatus,
    example: ShippingStatus.SHIPPED,
  })
  @IsOptional()
  @IsEnum(ShippingStatus)
  status?: ShippingStatus;

  @ApiPropertyOptional({
    description: 'Filter by tracking number',
    example: 'VN123456789',
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by recipient name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  recipientName?: string;

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
