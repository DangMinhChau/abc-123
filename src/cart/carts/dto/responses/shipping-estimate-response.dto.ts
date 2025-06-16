import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ShippingMethodDto {
  @ApiProperty({
    description: 'Shipping method name',
    example: 'Standard',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Shipping cost in VND',
    example: 30000,
  })
  @Expose()
  cost: number;

  @ApiProperty({
    description: 'Estimated delivery days',
    example: 3,
  })
  @Expose()
  days: number;
}

export class ShippingEstimateResponseDto {
  @ApiProperty({
    description: 'Estimated shipping cost in VND',
    example: 30000,
  })
  @Expose()
  estimatedCost: number;

  @ApiProperty({
    description: 'Estimated delivery days',
    example: 3,
  })
  @Expose()
  estimatedDeliveryDays: number;

  @ApiProperty({
    description: 'Available shipping methods',
    type: [ShippingMethodDto],
  })
  @Expose()
  availableShippingMethods: ShippingMethodDto[];
}
