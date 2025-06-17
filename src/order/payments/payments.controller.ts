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
    try {
      this.logger.log('=== Creating PayPal order ===');
      this.logger.log(
        'Request payload:',
        JSON.stringify(createOrderDto, null, 2),
      );

      const result = await this.paymentsService.create({
        orderId: createOrderDto.orderId,
        method: PaymentMethod.PAYPAL,
        amount: createOrderDto.amount,
        note: 'PayPal payment',
      });

      this.logger.log(
        'PaymentsService result:',
        JSON.stringify(result, null, 2),
      );

      // Check if result has paypalOrderId (PayPal payment) or is regular payment
      if ('paypalOrderId' in result) {
        this.logger.log('✅ PayPal order created successfully');
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
        this.logger.log('✅ Regular payment created successfully');
        return {
          message: 'Payment created successfully',
          data: result,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      this.logger.error('❌ Error in createPayPalOrder:');
      this.logger.error('Error name:', error.name);
      this.logger.error('Error message:', error.message);
      this.logger.error('Error stack:', error.stack);
      throw error;
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

  @Get('paypal/test')
  @ApiOperation({ summary: 'Test PayPal service and credentials' })
  async testPayPal(): Promise<BaseResponseDto> {
    try {
      this.logger.log('=== Testing PayPal Service ===');

      // Test basic PayPal service initialization
      const testResult = await this.paymentsService.testPayPalService();

      return {
        message: 'PayPal service test completed',
        data: testResult,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('❌ PayPal test failed:', error);
      throw error;
    }
  }
}
