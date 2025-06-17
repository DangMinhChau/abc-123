import { IsInt, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  unitPrice: number;
}
