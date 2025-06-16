import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
  Min,
  Max,
  Length,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from 'src/common/constants/discount-type.enum';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 255)
  description: string;
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ValidateIf((o: CreateVoucherDto) => o.discountType === DiscountType.AMOUNT)
  @IsNumber()
  @Min(0.01)
  discountAmount?: number;

  @ValidateIf((o: CreateVoucherDto) => o.discountType === DiscountType.PERCENT)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @Type(() => Date)
  @IsDate()
  expireAt: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;
}
