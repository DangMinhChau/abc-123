import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './user-response.dto';

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Access token JWT mới',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token mới',
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

  @ApiProperty({
    description: 'Thông tin người dùng',
    type: AuthUserResponseDto,
  })
  user: AuthUserResponseDto;
}
