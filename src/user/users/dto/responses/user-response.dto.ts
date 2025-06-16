import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserRole } from 'src/common/constants/user-role.enum';
import { ReviewResponse } from './../../../../review/reviews/interfaces/review.interface';
import { IsArray } from 'class-validator';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Nguyễn Văn A',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+84987654321',
  })
  @Expose()
  phoneNumber: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: true,
  })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'User creation date',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  // @ApiProperty({
  //   description: 'List of user reviews',
  //   type: [ReviewResponseDto],
  // })
  // @Expose()
  // @Type(() => ReviewResponseDto)
  // @IsArray()
  // reviews: ReviewResponseDto[];

  @ApiProperty({
    description: 'User last update date',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;
}
