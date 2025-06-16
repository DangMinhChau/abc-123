import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddToWishlistDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
