import { IsArray, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GuestCartItemDto {
  @ApiProperty({
    description: 'Product variant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @Expose()
  variantId: string;

  @ApiProperty({
    description: 'Quantity of the item',
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Expose()
  quantity: number;
}

export class MergeGuestCartDto {
  @ApiProperty({
    description: 'Guest cart items to merge with user cart',
    type: [GuestCartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  @Expose()
  items: GuestCartItemDto[];
}
