import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  IsPhoneNumber,
} from 'class-validator';
import { ShippingMethod } from 'src/common/constants/shipping-method.enum';

export class CreateShippingDto {
    @IsString()
  @IsNotEmpty()
  orderId: string;

    @IsString()
  @IsNotEmpty()
  recipientName: string;

    @IsPhoneNumber('VN')
  recipientPhone: string;

    @IsString()
  @IsNotEmpty()
  address: string;

    @IsString()
  @IsNotEmpty()
  wardCode: string;
    @IsNumber()
  districtId: number;

    @IsNumber()
  provinceId: number;

    @IsString()
  @IsNotEmpty()
  ward: string;

    @IsString()
  @IsNotEmpty()
  district: string;

    @IsString()
  @IsNotEmpty()
  province: string;

    @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;
    @IsNumber()
  @Min(0)
  @IsOptional()
  shippingFee?: number;

    @IsOptional()
  @IsString()
  trackingNumber?: string;

    @IsOptional()
  @IsString()
  note?: string;

  // GHN specific fields
    @IsOptional()
  @IsNumber()
  @Min(0)
  codAmount?: number;

    @IsOptional()
  @IsNumber()
  serviceId?: number;

    @IsOptional()
  @IsNumber()
  @Min(1)
  weight?: number;

    @IsOptional()
  @IsNumber()
  @Min(1)
  length?: number;

    @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

    @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;

    @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceValue?: number;
}
