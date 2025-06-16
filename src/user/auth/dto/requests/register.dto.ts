import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsStrongPassword,
  IsPhoneNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({
    description: 'Họ tên đầy đủ của người dùng',
    example: 'Nguyễn Văn A',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName: string;

  @ApiProperty({
    description: 'Địa chỉ email của người dùng',
    example: 'user@example.com',
    format: 'email',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email: string;

  @ApiProperty({
    description: 'Mật khẩu mạnh cho tài khoản',
    example: 'StrongPassword123!',
    format: 'password',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
    },
  )
  password: string;
  @ApiProperty({
    description: 'Số điện thoại của người dùng',
    example: '+84987654321',
    format: 'phone',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phoneNumber: string;
}
