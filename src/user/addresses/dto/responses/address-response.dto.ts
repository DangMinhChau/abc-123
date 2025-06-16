import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AddressResponseDto {
  @ApiProperty({
    description: 'Address unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the recipient',
    example: 'Nguyễn Văn A',
  })
  @Expose()
  recipientName: string;

  @ApiProperty({
    description: 'Phone number of the recipient',
    example: '0123456789',
  })
  @Expose()
  phoneNumber: string;

  @ApiProperty({
    description: 'Street address including house number and street name',
    example: '123 Đường ABC, Phường XYZ',
  })
  @Expose()
  streetAddress: string;

  @ApiProperty({
    description: 'Ward name',
    example: 'Phường Tân Phú',
  })
  @Expose()
  ward: string;

  @ApiProperty({
    description: 'District name',
    example: 'Quận 7',
  })
  @Expose()
  district: string;

  @ApiProperty({
    description: 'Province name',
    example: 'TP. Hồ Chí Minh',
  })
  @Expose()
  province: string;

  @ApiProperty({
    description: 'Whether this is the default address',
    example: false,
  })
  @Expose()
  isDefault: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
