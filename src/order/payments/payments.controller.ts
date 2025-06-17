import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PayPalService } from './services/paypal.service';
import { OptionalJwtAuthGuard } from '../../common/guards';
import { BaseResponseDto } from '../../common/dto';
import {
  CreatePayPalOrderDto,
  CapturePayPalOrderDto,
  PaymentResponseDto,
} from './dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paypalService: PayPalService,
  ) {}

  @Post('paypal/create-order')
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  @ApiOperation({ summary: 'Create PayPal order' })
  @ApiResponse({
    status: 201,
    description: 'PayPal order created successfully',
    type: BaseResponseDto,
  })
  async createPayPalOrder(
    @Body() createPayPalOrderDto: CreatePayPalOrderDto,
  ): Promise<BaseResponseDto<any>> {
    const { orderId, amount, currency = 'VND' } = createPayPalOrderDto;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Số tiền không hợp lệ');
    }

    // Create PayPal order
    const paypalOrder = await this.paypalService.createOrder(
      amount,
      currency,
      orderId,
    );

    // Update payment record in database
    await this.paymentsService.updatePaymentWithPayPalOrder(
      orderId,
      paypalOrder.id,
      amount,
    );

    return {
      message: 'Đã tạo đơn thanh toán PayPal thành công',
      data: {
        paypalOrderId: paypalOrder.id,
        status: paypalOrder.status,
        orderId,
        approvalLinks:
          paypalOrder.links?.filter((link) => link.rel === 'approve') || [],
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('paypal/capture-order')
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  @ApiOperation({ summary: 'Capture PayPal order' })
  @ApiResponse({
    status: 200,
    description: 'PayPal order captured successfully',
    type: BaseResponseDto,
  })
  async capturePayPalOrder(
    @Body() capturePayPalOrderDto: CapturePayPalOrderDto,
  ): Promise<BaseResponseDto<any>> {
    try {
      const { paypalOrderId, orderId } = capturePayPalOrderDto;

      // Capture payment with PayPal
      const captureResult =
        await this.paypalService.captureOrder(paypalOrderId);

      // Update payment status in database
      await this.paymentsService.updatePaymentAfterCapture(
        orderId,
        paypalOrderId,
        captureResult,
      );

      return {
        message: 'Thanh toán PayPal thành công',
        data: {
          status: captureResult.status,
          paypalOrderId: captureResult.id,
          orderId,
          captureId:
            captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('PayPal capture failed:', error);

      // Update payment status to failed
      try {
        await this.paymentsService.updatePaymentStatus(
          capturePayPalOrderDto.orderId,
          'FAILED',
        );
      } catch (updateError) {
        console.error('Failed to update payment status:', updateError);
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Thanh toán PayPal thất bại: ${errorMessage}`);
    }
  }

  @Get('paypal/order/:paypalOrderId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get PayPal order details' })
  @ApiResponse({
    status: 200,
    description: 'PayPal order details retrieved successfully',
    type: BaseResponseDto,
  })
  async getPayPalOrderDetails(
    @Param('paypalOrderId') paypalOrderId: string,
  ): Promise<BaseResponseDto<any>> {
    const orderDetails =
      await this.paypalService.getOrderDetails(paypalOrderId);

    return {
      message: 'Lấy thông tin đơn thanh toán thành công',
      data: orderDetails,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('paypal/status')
  @ApiOperation({ summary: 'Get PayPal service status' })
  @ApiResponse({
    status: 200,
    description: 'PayPal service status retrieved successfully',
    type: BaseResponseDto,
  })
  getPayPalStatus(): BaseResponseDto<any> {
    return {
      message: 'Trạng thái dịch vụ PayPal',
      data: {
        configured: this.paypalService.isConfigured(),
        available: this.paypalService.isConfigured(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
