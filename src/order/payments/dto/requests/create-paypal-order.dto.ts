import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidVNDAmount } from 'src/common/decorators/is-valid-vnd-amount.decorator';

export class CreatePayPalOrderDto {
  @IsUUID()
  orderId: string;

  @IsNumber({ maxDecimalPlaces: 3 }) // Allow 3 decimal places for VND
  @IsValidVNDAmount({
    message: 'Số tiền phải từ 1,000 VND đến 1,000,000,000 VND',
  })
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'VND'; // Default to VND for Vietnamese market
}
