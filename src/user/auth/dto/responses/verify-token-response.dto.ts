import { ApiProperty } from '@nestjs/swagger';

export class VerifyTokenResponseDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: 'uuid-string',
  })
  userId: string;

  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Vai trò của người dùng',
    example: 'customer',
  })
  role: string;

  @ApiProperty({
    description: 'Trạng thái token',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Thời gian hết hạn token',
    example: 1735689000,
  })
  expiresAt: number;
}
