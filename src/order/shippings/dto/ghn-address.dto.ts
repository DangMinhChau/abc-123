import { ApiProperty } from '@nestjs/swagger';

export class ProvinceDto {
  @ApiProperty({
    description: 'ID của tỉnh/thành phố',
    example: 202,
  })
  ProvinceID: number;

  @ApiProperty({
    description: 'Tên tỉnh/thành phố',
    example: 'Hồ Chí Minh',
  })
  ProvinceName: string;

  @ApiProperty({
    description: 'ID quốc gia',
    example: 1,
  })
  CountryID: number;

  @ApiProperty({
    description: 'Mã tỉnh/thành phố',
    example: '79',
  })
  Code: string;
}

export class DistrictDto {
  @ApiProperty({
    description: 'ID của quận/huyện',
    example: 1442,
  })
  DistrictID: number;

  @ApiProperty({
    description: 'ID tỉnh/thành phố',
    example: 202,
  })
  ProvinceID: number;

  @ApiProperty({
    description: 'Tên quận/huyện',
    example: 'Quận 1',
  })
  DistrictName: string;

  @ApiProperty({
    description: 'Mã quận/huyện',
    example: '001',
  })
  Code: string;

  @ApiProperty({
    description: 'Loại quận/huyện',
    example: 1,
  })
  Type: number;

  @ApiProperty({
    description: 'Loại hỗ trợ',
    example: 3,
  })
  SupportType: number;
}

export class WardDto {
  @ApiProperty({
    description: 'Mã phường/xã',
    example: '21211',
  })
  WardCode: string;

  @ApiProperty({
    description: 'ID quận/huyện',
    example: 1442,
  })
  DistrictID: number;

  @ApiProperty({
    description: 'Tên phường/xã',
    example: 'Phường Bến Nghé',
  })
  WardName: string;
}

export class ShippingServiceDto {
  @ApiProperty({
    description: 'ID dịch vụ',
    example: 53320,
  })
  service_id: number;

  @ApiProperty({
    description: 'Tên ngắn dịch vụ',
    example: 'E-commerce Delivery',
  })
  short_name: string;

  @ApiProperty({
    description: 'ID loại dịch vụ',
    example: 2,
  })
  service_type_id: number;
}

export class ShippingFeeDto {
  @ApiProperty({
    description: 'Tổng phí giao hàng',
    example: 25500,
  })
  total: number;

  @ApiProperty({
    description: 'Phí dịch vụ',
    example: 22500,
  })
  service_fee: number;

  @ApiProperty({
    description: 'Phí bảo hiểm',
    example: 3000,
  })
  insurance_fee: number;

  @ApiProperty({
    description: 'Phí trạm lấy hàng',
    example: 0,
  })
  pick_station_fee: number;

  @ApiProperty({
    description: 'Giá trị coupon',
    example: 0,
  })
  coupon_value: number;

  @ApiProperty({
    description: 'Phí trả hàng',
    example: 0,
  })
  r2s_fee: number;

  @ApiProperty({
    description: 'Phí trả lại lần nữa',
    example: 0,
  })
  return_again: number;

  @ApiProperty({
    description: 'Phí trả tài liệu',
    example: 0,
  })
  document_return: number;

  @ApiProperty({
    description: 'Phí kiểm tra kép',
    example: 0,
  })
  double_check: number;

  @ApiProperty({
    description: 'Phí thu hộ',
    example: 0,
  })
  cod_fee: number;

  @ApiProperty({
    description: 'Phí lấy hàng vùng xa',
    example: 0,
  })
  pick_remote_areas_fee: number;

  @ApiProperty({
    description: 'Phí giao hàng vùng xa',
    example: 0,
  })
  deliver_remote_areas_fee: number;

  @ApiProperty({
    description: 'Phí thu hộ thất bại',
    example: 0,
  })
  cod_failed_fee: number;
}

export class AddressValidationResultDto {
  @ApiProperty({
    description: 'Kết quả xác thực địa chỉ',
    example: true,
  })
  valid: boolean;
}

// Response DTOs
export class ProvincesResponseDto {
  @ApiProperty({
    description: 'Danh sách tỉnh/thành phố',
    type: [ProvinceDto],
  })
  data: ProvinceDto[];
}

export class DistrictsResponseDto {
  @ApiProperty({
    description: 'Danh sách quận/huyện',
    type: [DistrictDto],
  })
  data: DistrictDto[];
}

export class WardsResponseDto {
  @ApiProperty({
    description: 'Danh sách phường/xã',
    type: [WardDto],
  })
  data: WardDto[];
}

export class ShippingServicesResponseDto {
  @ApiProperty({
    description: 'Danh sách dịch vụ giao hàng',
    type: [ShippingServiceDto],
  })
  data: ShippingServiceDto[];
}

export class ShippingFeeResponseDto {
  @ApiProperty({
    description: 'Thông tin phí giao hàng',
    type: ShippingFeeDto,
  })
  data: ShippingFeeDto;
}

export class AddressValidationResponseDto {
  @ApiProperty({
    description: 'Kết quả xác thực địa chỉ',
    type: AddressValidationResultDto,
  })
  data: AddressValidationResultDto;
}
