import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CalculateShippingFeeDto {
  @ApiProperty({ description: 'ID quận/huyện đích', example: 1442 })
  @IsNumber()
  toDistrictId: number;

  @ApiProperty({ description: 'Mã phường/xã đích', example: '21211' })
  @IsString()
  toWardCode: string;

  @ApiProperty({ description: 'Trọng lượng (gram)', example: 1000 })
  @IsNumber()
  weight: number;

  @ApiProperty({
    description: 'Giá trị bảo hiểm (VND)',
    required: false,
    example: 300000,
  })
  @IsOptional()
  @IsNumber()
  insuranceValue?: number;

  @ApiProperty({
    description: 'Số tiền thu hộ COD (VND)',
    required: false,
    example: 299000,
  })
  @IsOptional()
  @IsNumber()
  codAmount?: number;

  @ApiProperty({
    description: 'ID dịch vụ vận chuyển',
    required: false,
    example: 53320,
  })
  @IsOptional()
  @IsNumber()
  serviceId?: number;
}

export class ShippingFeeResultDto {
  @ApiProperty({ description: 'Tổng phí vận chuyển (VND)', example: 33000 })
  totalFee: number;

  @ApiProperty({ description: 'Phí dịch vụ (VND)', example: 25000 })
  serviceFee: number;

  @ApiProperty({ description: 'Phí bảo hiểm (VND)', example: 3000 })
  insuranceFee: number;

  @ApiProperty({ description: 'Phí COD (VND)', example: 5000 })
  codFee: number;

  @ApiProperty({
    description: 'Thời gian giao hàng ước tính',
    example: '2-3 ngày',
  })
  estimatedDeliveryTime: string;

  @ApiProperty({ description: 'Đơn vị tiền tệ', example: 'VND' })
  currency: string;
}

export class CalculateShippingFeeResponseDto {
  @ApiProperty({ description: 'Trạng thái thành công', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Thông báo',
    example: 'Shipping fee calculated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Thông tin phí vận chuyển',
    type: ShippingFeeResultDto,
  })
  data: ShippingFeeResultDto;
}
