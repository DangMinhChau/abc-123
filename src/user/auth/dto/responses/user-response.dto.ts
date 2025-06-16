import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from 'src/common/constants/user-role.enum';

export class AuthUserResponseDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: 'uuid-string',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Họ tên đầy đủ',
    example: 'Nguyễn Văn A',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    description: 'Địa chỉ email',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '+84987654321',
  })
  @Expose()
  phoneNumber: string;

  @ApiProperty({
    description: 'Vai trò của người dùng',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'Trạng thái hoạt động',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Trạng thái xác thực email',
    example: false,
  })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Thời gian tạo tài khoản',
    example: '2025-06-11T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật cuối',
    example: '2025-06-11T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;

  // Ẩn mật khẩu và các thông tin nhạy cảm
  @Exclude()
  password: string;
}
