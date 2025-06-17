import {
  Controller,
  Post,
  Body,
  Logger,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';

interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  note?: string;
}

interface CapturePayPalDto {
  paypalOrderId: string;
  orderId: string;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard) // Allow both guest and authenticated users
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<BaseResponseDto> {
    try {
      this.logger.log('Creating payment:', createPaymentDto);
      const result = await this.paymentsService.createPayment(createPaymentDto);

      return {
        message: 'Payment created successfully',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error creating payment:', error);
      throw error;
    }
  }

  @Post('paypal/create-order')
  @UseGuards(OptionalJwtAuthGuard) // Allow both guest and authenticated users
  @ApiOperation({ summary: 'Create PayPal order' })
  @ApiResponse({
    status: 201,
    description: 'PayPal order created successfully',
  })
  async createPayPalOrder(
    @Body()
    createOrderDto: {
      orderId: string;
      amount: number;
      currency?: string;
    },
  ): Promise<BaseResponseDto> {
    try {
      this.logger.log('Creating PayPal order:', createOrderDto);
      const result = await this.paymentsService.createPayment({
        orderId: createOrderDto.orderId,
        method: PaymentMethod.PAYPAL,
        amount: createOrderDto.amount,
        note: 'PayPal payment',
      });

      return {
        message: 'PayPal order created successfully',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error creating PayPal order:', error);
      throw error;
    }
  }

  @Post('paypal/capture-order')
  @UseGuards(OptionalJwtAuthGuard) // Allow both guest and authenticated users
  @ApiOperation({ summary: 'Capture PayPal order' })
  @ApiResponse({
    status: 200,
    description: 'PayPal order captured successfully',
  })
  async capturePayPalOrder(
    @Body() captureDto: CapturePayPalDto,
  ): Promise<BaseResponseDto> {
    try {
      this.logger.log('Capturing PayPal order:', captureDto);
      const result = await this.paymentsService.capturePayPalPayment(
        captureDto.paypalOrderId,
        captureDto.orderId,
      );

      return {
        message: 'PayPal order captured successfully',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error capturing PayPal order:', error);
      throw error;
    }
  }

  @Get('order/:orderId')
  @UseGuards(OptionalJwtAuthGuard) // Allow both guest and authenticated users
  @ApiOperation({ summary: 'Get payment by order ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  async getByOrderId(
    @Param('orderId') orderId: string,
  ): Promise<BaseResponseDto> {
    try {
      const payment = await this.paymentsService.findByOrderId(orderId);

      return {
        message: 'Payment retrieved successfully',
        data: payment,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error retrieving payment:', error);
      throw error;
    }
  }
}
