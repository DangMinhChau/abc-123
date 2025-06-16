import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderDto } from './create-order.dto';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { ShippingMethod } from 'src/common/constants/shipping-method.enum';

export class ShippingInfoDto {
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  streetAddress: string;

  @IsNotEmpty()
  @IsString()
  ward: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsString()
  wardCode: string;

  @IsNumber()
  districtId: number;

  @IsNumber()
  provinceId: number;

  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @IsNumber()
  @Min(0)
  shippingFee: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CompleteOrderDto extends CreateOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo: ShippingInfoDto;

  @IsOptional()
  @IsUrl()
  paymentReturnUrl?: string;
}
