import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}
  @Post()
  @ApiOperation({
    summary:
      'Create a new payment (supports both guest and authenticated users)',
  })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<BaseResponseDto> {
    const payment = await this.paymentsService.create(createPaymentDto);
    return {
      message: 'Payment created successfully',
      data: payment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Post('paypal/create-order')
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
    this.logger.log('Creating PayPal order');
    const result = await this.paymentsService.create({
      orderId: createOrderDto.orderId,
      method: PaymentMethod.PAYPAL,
      amount: createOrderDto.amount,
      note: 'PayPal payment',
    });

    // Check if result has paypalOrderId (PayPal payment) or is regular payment
    if ('paypalOrderId' in result) {
      return {
        message: 'PayPal order created successfully',
        data: {
          paypalOrderId: result.paypalOrderId,
          status: result.status,
          orderId: result.orderId,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      return {
        message: 'Payment created successfully',
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  @Post('paypal/capture-order')
  @ApiOperation({ summary: 'Capture PayPal payment' })
  @ApiResponse({
    status: 200,
    description: 'PayPal payment captured successfully',
  })
  async capturePayPalOrder(
    @Body() captureDto: { paypalOrderId: string; orderId: string },
  ): Promise<BaseResponseDto> {
    this.logger.log('Capturing PayPal payment');
    const payment = await this.paymentsService.handlePayPalCallback(captureDto);
    return {
      message: 'PayPal payment captured successfully',
      data: payment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedResponseDto> {
    const result = await this.paymentsService.findAll(page, limit);
    return {
      message: 'Payments retrieved successfully',
      data: result.data,
      meta: {
        ...result.meta,
        totalPages: Math.ceil(result.meta.total / result.meta.limit),
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  async findOne(@Param('id') id: string): Promise<BaseResponseDto> {
    const payment = await this.paymentsService.findOne(id);
    return {
      message: 'Payment found successfully',
      data: payment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
