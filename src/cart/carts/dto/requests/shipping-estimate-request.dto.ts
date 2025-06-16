import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingEstimateRequestDto {
  @ApiProperty({
    description: 'Shipping address province',
    example: 'Hồ Chí Minh',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  province: string;

  @ApiProperty({
    description: 'Shipping address district',
    example: 'Quận 1',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  district: string;

  @ApiProperty({
    description: 'Shipping address ward',
    example: 'Phường Bến Nghé',
  })
  @IsString()
  @IsNotEmpty()
  @Expose()
  ward: string;

  @ApiPropertyOptional({
    description: 'Detailed address',
    example: '123 Nguyễn Huệ',
  })
  @IsOptional()
  @IsString()
  @Expose()
  address?: string;

  @ApiPropertyOptional({
    description: 'Shipping method preference',
    example: 'standard',
    enum: ['standard', 'express', 'same-day'],
  })
  @IsOptional()
  @IsString()
  @Expose()
  shippingMethod?: 'standard' | 'express' | 'same-day';
}
