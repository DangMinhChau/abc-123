import { IsInt, IsNumber, IsUUID, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  @Transform(
    ({ value }) => (value === '' ? undefined : value) as string | undefined,
  )
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
