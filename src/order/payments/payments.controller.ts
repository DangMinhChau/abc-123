import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PayPalService } from './services/paypal.service';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

export class CreatePayPalOrderDto {
  orderId: string;
  amount: number;
  currency?: string;
}

export class CapturePayPalOrderDto {
  paypalOrderId: string;
  orderId: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paypalService: PayPalService,
  ) {}

  @Post('paypal/create-order')
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  async createPayPalOrder(@Body() createPayPalOrderDto: CreatePayPalOrderDto) {
    try {
      const { orderId, amount, currency = 'VND' } = createPayPalOrderDto;

      // Validate amount
      if (!amount || amount <= 0) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Số tiền không hợp lệ',
          data: null,
        };
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
        statusCode: HttpStatus.CREATED,
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
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Không thể tạo đơn thanh toán PayPal',
        data: null,
        error: errorMessage,
      };
    }
  }

  @Post('paypal/capture-order')
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  async capturePayPalOrder(
    @Body() capturePayPalOrderDto: CapturePayPalOrderDto,
  ) {
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
        statusCode: HttpStatus.OK,
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
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Thanh toán PayPal thất bại',
        data: null,
        error: errorMessage,
      };
    }
  }

  @Get('paypal/order/:paypalOrderId')
  @UseGuards(OptionalJwtAuthGuard)
  async getPayPalOrderDetails(@Param('paypalOrderId') paypalOrderId: string) {
    try {
      const orderDetails =
        await this.paypalService.getOrderDetails(paypalOrderId);

      return {
        statusCode: HttpStatus.OK,
        message: 'Lấy thông tin đơn thanh toán thành công',
        data: orderDetails,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể lấy thông tin đơn thanh toán',
        data: null,
        error: errorMessage,
      };
    }
  }

  @Get('paypal/status')
  getPayPalStatus() {
    return {
      statusCode: HttpStatus.OK,
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
