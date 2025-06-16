import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Thông tin người dùng',
    type: AuthUserResponseDto,
  })
  user: AuthUserResponseDto;

  @ApiProperty({
    description: 'Access token JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token để gia hạn phiên đăng nhập',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Thời gian hết hạn access token (giây)',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Loại token',
    example: 'Bearer',
  })
  tokenType: string;
}
