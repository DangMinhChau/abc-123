import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token xác thực email nhận được từ email',
    example: 'abcd1234-5678-90ef-ghij-klmnopqrstuv',
  })
  @IsNotEmpty({ message: 'Token xác thực không được để trống' })
  @IsString({ message: 'Token xác thực phải là chuỗi ký tự' })
  token: string;
}
