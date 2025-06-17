import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
