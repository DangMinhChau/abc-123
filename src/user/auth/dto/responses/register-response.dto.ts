import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './user-response.dto';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Thông tin người dùng',
    type: AuthUserResponseDto,
  })
  user: AuthUserResponseDto;

  @ApiProperty({
    description: 'Access token JWT (null nếu chưa verify email)',
    example: null,
    nullable: true,
  })
  accessToken: string | null;

  @ApiProperty({
    description:
      'Refresh token để gia hạn phiên đăng nhập (null nếu chưa verify email)',
    example: null,
    nullable: true,
  })
  refreshToken: string | null;

  @ApiProperty({
    description: 'Thời gian hết hạn access token (0 nếu chưa verify email)',
    example: 0,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Loại token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Có yêu cầu xác minh email hay không',
    example: true,
  })
  requiresEmailVerification: boolean;
}
