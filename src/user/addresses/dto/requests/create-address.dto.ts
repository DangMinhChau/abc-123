import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Name of the recipient',
    example: 'Nguyễn Văn A',
    maxLength: 100,
  })
  @IsString({ message: 'Tên người nhận phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @MaxLength(100, { message: 'Tên người nhận không được vượt quá 100 ký tự' })
  @Transform(({ value }) => value?.trim())
  recipientName: string;

  @ApiProperty({
    description: 'Phone number of the recipient',
    example: '0123456789',
    maxLength: 15,
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @MaxLength(15, { message: 'Số điện thoại không được vượt quá 15 ký tự' })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({
    description: 'Street address including house number and street name',
    example: '123 Đường ABC, Phường XYZ',
    maxLength: 255,
  })
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @MaxLength(255, { message: 'Địa chỉ không được vượt quá 255 ký tự' })
  @Transform(({ value }) => value?.trim())
  streetAddress: string;

  @ApiProperty({
    description: 'Ward name',
    example: 'Phường Tân Phú',
    maxLength: 50,
  })
  @IsString({ message: 'Phường/xã phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Phường/xã không được để trống' })
  @MaxLength(50, { message: 'Phường/xã không được vượt quá 50 ký tự' })
  @Transform(({ value }) => value?.trim())
  ward: string;

  @ApiProperty({
    description: 'District name',
    example: 'Quận 7',
    maxLength: 50,
  })
  @IsString({ message: 'Quận/huyện phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Quận/huyện không được để trống' })
  @MaxLength(50, { message: 'Quận/huyện không được vượt quá 50 ký tự' })
  @Transform(({ value }) => value?.trim())
  district: string;

  @ApiProperty({
    description: 'Province name',
    example: 'TP. Hồ Chí Minh',
    maxLength: 50,
  })
  @IsString({ message: 'Tỉnh/thành phố phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tỉnh/thành phố không được để trống' })
  @MaxLength(50, { message: 'Tỉnh/thành phố không được vượt quá 50 ký tự' })
  @Transform(({ value }) => value?.trim())
  province: string;

  @ApiProperty({
    description: 'Whether this address should be set as default',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Địa chỉ mặc định phải là true hoặc false' })
  isDefault?: boolean = false;
}
