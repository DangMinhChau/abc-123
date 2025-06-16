import { ApiProperty } from '@nestjs/swagger';
import { ShippingStatus } from 'src/common/constants/shipping-status.enum';
import { ShippingMethod } from 'src/common/constants/shipping-method.enum';

export class ShippingResponseDto {
  @ApiProperty({
    description: 'ID đơn vận chuyển',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: 'ID đơn hàng',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({ description: 'Tên người nhận', example: 'Nguyễn Văn A' })
  recipientName: string;

  @ApiProperty({
    description: 'Số điện thoại người nhận',
    example: '0123456789',
  })
  recipientPhone: string;

  @ApiProperty({
    description: 'Địa chỉ giao hàng',
    example: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
  })
  address: string;

  @ApiProperty({ description: 'Mã phường/xã', example: '21211' })
  wardCode: string;

  @ApiProperty({ description: 'ID quận/huyện', example: 1442 })
  districtId: number;

  @ApiProperty({ description: 'ID tỉnh/thành phố', example: 202 })
  provinceId: number;

  @ApiProperty({ description: 'Tên phường/xã', example: 'Phường Tân Phú' })
  ward: string;

  @ApiProperty({ description: 'Tên quận/huyện', example: 'Quận 7' })
  district: string;

  @ApiProperty({ description: 'Tên tỉnh/thành phố', example: 'Hồ Chí Minh' })
  province: string;

  @ApiProperty({
    description: 'Phương thức vận chuyển',
    enum: ShippingMethod,
    example: ShippingMethod.STANDARD,
  })
  shippingMethod: ShippingMethod;

  @ApiProperty({ description: 'Phí vận chuyển (VND)', example: 30000 })
  shippingFee: number;

  @ApiProperty({ description: 'Mã theo dõi', example: 'SH2024010100001' })
  trackingNumber: string;

  @ApiProperty({
    description: 'Trạng thái vận chuyển',
    enum: ShippingStatus,
    example: ShippingStatus.IN_TRANSIT,
  })
  status: ShippingStatus;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Giao hàng trong giờ hành chính',
  })
  note: string;

  @ApiProperty({ description: 'Số tiền thu hộ COD (VND)', example: 299000 })
  codAmount: number;

  @ApiProperty({ description: 'ID dịch vụ vận chuyển', example: 53320 })
  serviceId: number;

  @ApiProperty({ description: 'Trọng lượng (gram)', example: 1000 })
  weight: number;

  @ApiProperty({ description: 'Chiều dài (cm)', example: 20 })
  length: number;

  @ApiProperty({ description: 'Chiều rộng (cm)', example: 15 })
  width: number;

  @ApiProperty({ description: 'Chiều cao (cm)', example: 10 })
  height: number;

  @ApiProperty({ description: 'Giá trị bảo hiểm (VND)', example: 300000 })
  insuranceValue: number;

  @ApiProperty({ description: 'Ngày tạo', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2024-01-01T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class ShippingListResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Danh sách đơn vận chuyển',
    type: [ShippingResponseDto],
  })
  data: ShippingResponseDto[];

  @ApiProperty({
    description: 'Thông tin phân trang',
    required: false,
  })
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export class TrackingInfoDto {
  @ApiProperty({ description: 'Mã theo dõi', example: 'SH2024010100001' })
  trackingNumber: string;

  @ApiProperty({
    description: 'Trạng thái vận chuyển',
    enum: ShippingStatus,
    example: ShippingStatus.IN_TRANSIT,
  })
  status: ShippingStatus;

  @ApiProperty({
    description: 'Mô tả trạng thái',
    example: 'Đang trên đường giao hàng',
  })
  statusDescription: string;

  @ApiProperty({
    description: 'Lịch sử theo dõi',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        time: { type: 'string', example: '2024-01-02T14:30:00.000Z' },
        description: { type: 'string', example: 'Đang trên đường giao hàng' },
        location: { type: 'string', example: 'Trung tâm phân loại Quận 7' },
      },
    },
  })
  trackingHistory: Array<{
    time: string;
    description: string;
    location: string;
  }>;

  @ApiProperty({
    description: 'Thời gian giao hàng ước tính',
    example: '2-3 ngày',
  })
  estimatedDeliveryTime: string;
}

export class TrackingResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({ description: 'Thông tin theo dõi', type: TrackingInfoDto })
  data: TrackingInfoDto;
}

export class ShippingFeeCalculationDto {
  @ApiProperty({ description: 'ID quận/huyện đích', example: 1442 })
  toDistrictId: number;

  @ApiProperty({ description: 'Mã phường/xã đích', example: '21211' })
  toWardCode: string;

  @ApiProperty({ description: 'Trọng lượng (gram)', example: 1000 })
  weight: number;

  @ApiProperty({
    description: 'Giá trị bảo hiểm (VND)',
    required: false,
    example: 300000,
  })
  insuranceValue?: number;

  @ApiProperty({
    description: 'Số tiền thu hộ COD (VND)',
    required: false,
    example: 299000,
  })
  codAmount?: number;

  @ApiProperty({
    description: 'ID dịch vụ vận chuyển',
    required: false,
    example: 53320,
  })
  serviceId?: number;
}

export class ShippingFeeResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Thông tin phí vận chuyển',
    type: 'object',
    properties: {
      totalFee: { type: 'number', example: 33000 },
      serviceFee: { type: 'number', example: 25000 },
      insuranceFee: { type: 'number', example: 3000 },
      codFee: { type: 'number', example: 5000 },
      estimatedDeliveryTime: { type: 'string', example: '2-3 ngày' },
      currency: { type: 'string', example: 'VND' },
    },
  })
  data: {
    totalFee: number;
    serviceFee: number;
    insuranceFee: number;
    codFee: number;
    estimatedDeliveryTime: string;
    currency: string;
  };
}

export class AvailableServiceDto {
  @ApiProperty({ description: 'ID dịch vụ', example: 53320 })
  serviceId: number;

  @ApiProperty({ description: 'Tên dịch vụ', example: 'Giao hàng tiêu chuẩn' })
  serviceName: string;

  @ApiProperty({ description: 'ID loại dịch vụ', example: 2 })
  serviceTypeId: number;

  @ApiProperty({
    description: 'Thời gian giao hàng ước tính',
    example: '2-3 ngày',
  })
  estimatedDeliveryTime: string;

  @ApiProperty({ description: 'Trạng thái khả dụng', example: true })
  isAvailable: boolean;
}

export class AvailableServicesResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Danh sách dịch vụ khả dụng',
    type: [AvailableServiceDto],
  })
  data: AvailableServiceDto[];
}

export class AddressValidationDto {
  @ApiProperty({ description: 'ID tỉnh/thành phố', example: 202 })
  provinceId: number;

  @ApiProperty({ description: 'ID quận/huyện', example: 1442 })
  districtId: number;

  @ApiProperty({ description: 'Mã phường/xã', example: '21211' })
  wardCode: string;
}

export class AddressValidationResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Kết quả xác thực địa chỉ',
    type: 'object',
    properties: {
      isValid: { type: 'boolean', example: true },
      provinceName: { type: 'string', example: 'Hồ Chí Minh' },
      districtName: { type: 'string', example: 'Quận 7' },
      wardName: { type: 'string', example: 'Phường Tân Phú' },
      fullAddress: {
        type: 'string',
        example: 'Phường Tân Phú, Quận 7, Hồ Chí Minh',
      },
    },
  })
  data: {
    isValid: boolean;
    provinceName: string;
    districtName: string;
    wardName: string;
    fullAddress: string;
  };
}

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Trạng thái vận chuyển',
    enum: ShippingStatus,
    example: ShippingStatus.OUT_FOR_DELIVERY,
  })
  status: ShippingStatus;
}

export class ShippingSuccessResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Thông tin đơn vận chuyển',
    type: ShippingResponseDto,
  })
  data: ShippingResponseDto;
}
