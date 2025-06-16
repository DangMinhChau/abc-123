import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateTokenDto {
  @IsNotEmpty({ message: 'User ID không được để trống' })
  @IsString({ message: 'User ID phải là chuỗi ký tự' })
  userId: string;

  @IsNotEmpty({ message: 'Token không được để trống' })
  @IsString({ message: 'Token phải là chuỗi ký tự' })
  token: string;

  @IsNotEmpty({ message: 'Token type không được để trống' })
  @IsEnum(['REFRESH', 'EMAIL_VERIFICATION', 'PASSWORD_RESET'], {
    message:
      'Token type phải là REFRESH, EMAIL_VERIFICATION hoặc PASSWORD_RESET',
  })
  type: string;

  @IsOptional()
  expiresAt?: Date;
}
