import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
}

export class CreateShippingDto {
  @ApiProperty({
    description: 'Shipping method',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
  })
  @IsNotEmpty()
  @IsEnum(ShippingMethod)
  method: ShippingMethod;

  @ApiProperty({
    description: 'Shipping address',
    example: '123 Main St, City, Country',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '+84901234567',
  })
  @IsNotEmpty()
  @IsString()
  recipientPhone: string;

  @ApiProperty({
    description: 'Shipping cost in VND',
    example: 30000,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiPropertyOptional({
    description: 'Estimated delivery date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsString()
  estimatedDeliveryDate?: string;

  @ApiPropertyOptional({
    description: 'Tracking number',
    example: 'VN123456789',
  })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({
    description: 'Special delivery instructions',
    example: 'Leave at front door',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}
