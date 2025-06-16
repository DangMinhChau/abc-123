import { ApiProperty } from '@nestjs/swagger';
import { ShippingStatus } from 'src/common/constants/shipping-status.enum';

export class OrderTrackingHistoryDto {
  @ApiProperty({ description: 'Trạng thái', example: 'PICKED_UP' })
  status: string;

  @ApiProperty({ description: 'Vị trí', example: 'Kho trung tâm TP.HCM' })
  location: string;

  @ApiProperty({
    description: 'Thời gian',
    example: '2024-01-01T08:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({ description: 'Mô tả', example: 'Đơn hàng đã được lấy từ kho' })
  description: string;
}

export class OrderTrackingDto {
  @ApiProperty({ description: 'Mã theo dõi', example: 'SH2024010100001' })
  trackingNumber: string;

  @ApiProperty({
    description: 'Trạng thái hiện tại',
    enum: ShippingStatus,
    example: ShippingStatus.IN_TRANSIT,
  })
  currentStatus: ShippingStatus;

  @ApiProperty({
    description: 'Ngày giao hàng ước tính',
    example: '2024-01-03T00:00:00.000Z',
  })
  estimatedDelivery: string;

  @ApiProperty({
    description: 'Lịch sử theo dõi',
    type: [OrderTrackingHistoryDto],
  })
  trackingHistory: OrderTrackingHistoryDto[];

  @ApiProperty({ description: 'Đơn vị vận chuyển', example: 'Giao Hàng Nhanh' })
  carrier: string;

  @ApiProperty({ description: 'Phương thức vận chuyển', example: 'STANDARD' })
  shippingMethod: string;
}

export class OrderTrackingResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Thông báo',
    example: 'Order tracking information retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Thông tin theo dõi đơn hàng',
    type: OrderTrackingDto,
  })
  data: OrderTrackingDto;
}
