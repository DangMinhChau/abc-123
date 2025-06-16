import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsStrongPassword,
  IsPhoneNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from 'src/common/constants/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Nguyễn Văn A',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được quá 100 ký tự' })
  @Transform(({ value }) => value?.trim())
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'Password123!',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsStrongPassword(
    {
      minLength: 6,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 0,
    },
    {
      message: 'Mật khẩu phải có ít nhất 6 ký tự, 1 chữ hoa và 1 số',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+84987654321',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không đúng định dạng' })
  @MaxLength(100, { message: 'Số điện thoại không được quá 100 ký tự' })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.CUSTOMER,
    default: UserRole.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  role?: UserRole = UserRole.CUSTOMER;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Trạng thái xác thực email phải là boolean' })
  isEmailVerified?: boolean = false;
}
