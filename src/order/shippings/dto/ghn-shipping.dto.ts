import {
  IsNumber,
  IsString,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class GhnCalculateShippingFeeDto {
  @IsNumber()
  @IsPositive()
  toDistrictId: number;

  @IsString()
  toWardCode: string;

  @IsNumber()
  @IsPositive()
  weight: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insuranceValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  serviceId?: number;
}

export class ValidateAddressDto {
  @IsNumber()
  @IsPositive()
  provinceId: number;

  @IsNumber()
  @IsPositive()
  districtId: number;

  @IsString()
  wardCode: string;
}

export class UpdateShippingStatusDto {
  @IsString()
  status: string;
}
