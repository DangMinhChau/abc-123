import { IsUUID, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class MoveToCartDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsUUID()
  @IsOptional()
  variantId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number = 1;
}
