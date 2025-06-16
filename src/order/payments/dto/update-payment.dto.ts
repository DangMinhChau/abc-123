import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
