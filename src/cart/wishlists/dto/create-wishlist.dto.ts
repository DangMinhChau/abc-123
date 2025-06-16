import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateWishlistDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
