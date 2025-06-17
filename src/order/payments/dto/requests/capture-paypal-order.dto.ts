import { IsString } from 'class-validator';

export class CapturePayPalOrderDto {
  @IsString()
  paypalOrderId: string;

  @IsString()
  payerId: string;
}
