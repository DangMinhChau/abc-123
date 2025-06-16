import { ApiProperty } from '@nestjs/swagger';
import { ShippingStatus } from 'src/common/constants/shipping-status.enum';

export class TrackingHistoryItemDto {
  @ApiProperty({ description: 'Trạng thái', example: 'IN_TRANSIT' })
  status: string;

  @ApiProperty({ description: 'Vị trí', example: 'Trung tâm phân loại Quận 7' })
  location: string;

  @ApiProperty({
    description: 'Thời gian',
    example: '2024-01-02T14:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({ description: 'Mô tả', example: 'Đang trên đường giao hàng' })
  description: string;
}

export class DetailedTrackingDto {
  @ApiProperty({ description: 'Mã theo dõi', example: 'SH2024010100001' })
  trackingNumber: string;

  @ApiProperty({
    description: 'Trạng thái hiện tại',
    enum: ShippingStatus,
    example: ShippingStatus.IN_TRANSIT,
  })
  currentStatus: ShippingStatus;

  @ApiProperty({
    description: 'Cập nhật lần cuối',
    example: '2024-01-02T14:30:00.000Z',
  })
  lastUpdate: string;

  @ApiProperty({
    description: 'Lịch sử theo dõi',
    type: [TrackingHistoryItemDto],
  })
  trackingHistory: TrackingHistoryItemDto[];

  @ApiProperty({
    description: 'Ngày giao hàng ước tính',
    example: '2024-01-03T18:00:00.000Z',
  })
  estimatedDelivery: string;
}

export class DetailedTrackingResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Thông báo',
    example: 'Tracking information retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Thông tin theo dõi chi tiết',
    type: DetailedTrackingDto,
  })
  data: DetailedTrackingDto;
}
