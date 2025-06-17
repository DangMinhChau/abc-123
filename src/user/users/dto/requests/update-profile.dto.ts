import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Nguyễn Văn A',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được quá 100 ký tự' })
  @Transform(({ value }) => value?.trim())
  fullName?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+84987654321',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('VN', { message: 'Số điện thoại không đúng định dạng' })
  @MaxLength(100, { message: 'Số điện thoại không được quá 100 ký tự' })
  @Transform(({ value }) => value?.trim())
  phoneNumber?: string;
}
