import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/requests/create-order.dto';
import { OptionalJwtAuthGuard, JwtAuthGuard } from '../../common/guards';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../user/users/entities/user.entity';
import { BaseResponseDto, PaginatedResponseDto } from '../../common/dto';
import { OrderResponseDto } from './dto/responses';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: BaseResponseDto<OrderResponseDto>,
  })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<OrderResponseDto>> {
    try {
      // Set userId from JWT if authenticated
      if (user && !createOrderDto.userId) {
        createOrderDto.userId = user.id;
      }

      const order = await this.ordersService.createOrder(createOrderDto);

      return {
        message: 'Đã tạo đơn hàng thành công',
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Không thể tạo đơn hàng: ${errorMessage}`);
    }
  }
  @Post('paypal')
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  @ApiOperation({ summary: 'Create a new order with PayPal payment' })
  @ApiResponse({
    status: 201,
    description: 'PayPal order created successfully',
    type: BaseResponseDto<{ orderId: string; approvalUrl: string }>,
  })
  async createPayPalOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<{ orderId: string; approvalUrl: string }>> {
    try {
      console.log('=== PayPal Order Creation Started ===');
      console.log('Raw request body:', JSON.stringify(createOrderDto, null, 2));
      console.log(
        'User from JWT:',
        user ? `ID: ${user.id}, Email: ${user.email}` : 'Guest user',
      );

      // Check PayPal configuration first
      const configService =
        this.ordersService['configService'] ||
        this.ordersService['paypalService']['configService'];
      const paypalClientId = configService?.get('PAYPAL_CLIENT_ID');
      const paypalClientSecret = configService?.get('PAYPAL_CLIENT_SECRET');
      console.log('PayPal Config Check:', {
        clientIdExists: !!paypalClientId,
        clientSecretExists: !!paypalClientSecret,
        environment: configService?.get('PAYPAL_ENVIRONMENT') || 'not set',
      });

      // Set userId from JWT if authenticated
      if (user && !createOrderDto.userId) {
        createOrderDto.userId = user.id;
        console.log('UserId set from JWT:', user.id);
      }

      // Validate required fields
      console.log('Validating request data...');
      if (!createOrderDto.items || createOrderDto.items.length === 0) {
        throw new Error('No items in order');
      }

      if (!createOrderDto.customerName || !createOrderDto.customerEmail) {
        throw new Error('Missing customer information');
      }

      if (
        !createOrderDto.paymentMethod ||
        createOrderDto.paymentMethod !== 'PAYPAL'
      ) {
        throw new Error('Invalid payment method for PayPal order');
      }

      console.log('Basic validation passed');

      console.log(
        'Final DTO before service call:',
        JSON.stringify(createOrderDto, null, 2),
      );

      const result =
        await this.ordersService.createOrderWithPayPal(createOrderDto);

      console.log('Service result:', {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        approvalUrl: result.approvalUrl,
      });

      return {
        message: 'Đã tạo đơn hàng PayPal thành công',
        data: {
          orderId: result.order.id,
          approvalUrl: result.approvalUrl,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('=== PayPal Order Creation Failed ===');
      console.error('Error details:', {
        name: error?.constructor?.name,
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 5),
      });

      // Re-throw the original error to preserve stack trace
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: BaseResponseDto<OrderResponseDto>,
  })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<OrderResponseDto>> {
    const order = await this.ordersService.findOrderById(id);

    // Check if user has permission to view this order
    if (order.user && user && order.user.id !== user.id) {
      throw new Error('Bạn không có quyền xem đơn hàng này');
    }

    return {
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('number/:orderNumber')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: BaseResponseDto<OrderResponseDto>,
  })
  async getOrderByNumber(
    @Param('orderNumber') orderNumber: string,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<OrderResponseDto>> {
    const order = await this.ordersService.findOrderByNumber(orderNumber);

    // Check if user has permission to view this order
    if (order.user && user && order.user.id !== user.id) {
      throw new Error('Bạn không có quyền xem đơn hàng này');
    }

    return {
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard) // Require authentication
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: PaginatedResponseDto<OrderResponseDto>,
  })
  async getMyOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @GetUser() user: User,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const result = await this.ordersService.findOrdersByUser(
      user.id,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Lấy danh sách đơn hàng thành công',
      data: result.orders,
      meta: {
        timestamp: new Date().toISOString(),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('debug/paypal-config')
  @ApiOperation({ summary: 'Debug PayPal configuration' })
  async debugPayPalConfig(): Promise<any> {
    try {
      // Try to get PayPal service through the orders service
      const paypalService = this.ordersService['paypalService'];

      return {
        message: 'PayPal configuration debug',
        data: {
          paypalServiceExists: !!paypalService,
          paypalConfigured: paypalService?.isConfigured?.(),
          environment: process.env.PAYPAL_ENVIRONMENT,
          clientIdExists: !!process.env.PAYPAL_CLIENT_ID,
          clientSecretExists: !!process.env.PAYPAL_CLIENT_SECRET,
          frontendUrl: process.env.FRONTEND_URL,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        message: 'PayPal configuration debug failed',
        error: error?.message || 'Unknown error',
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
  @Post('test-order-creation')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Test order creation (debug)' })
  async testOrderCreation(
    @Body() createOrderDto: CreateOrderDto, // Bypass validation to debug
    @GetUser() user: User | null,
  ): Promise<any> {
    console.log('=== TEST ORDER CREATION DEBUG ===');
    console.log('Raw request body:', JSON.stringify(createOrderDto, null, 2));

    // Log each field individually to see what's causing validation issues
    console.log('userId:', createOrderDto.userId, typeof createOrderDto.userId);
    console.log(
      'voucherId:',
      createOrderDto.voucherId,
      typeof createOrderDto.voucherId,
    );
    console.log('items:', createOrderDto.items);

    if (createOrderDto.items) {
      createOrderDto.items.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          variantId: item.variantId,
          variantIdType: typeof item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      });
    }

    try {
      // Set userId if authenticated
      if (user && !createOrderDto.userId) {
        createOrderDto.userId = user.id;
      }

      // Test step 1: Create regular order
      console.log('4. Testing regular order creation...');
      const order = await this.ordersService.createOrder(createOrderDto);
      console.log('5. Order created successfully:', {
        id: order.id,
        orderNumber: order.orderNumber,
      });

      return {
        message: 'Test order creation successful',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalPrice: order.totalPrice,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('=== DEBUG: Test Order Creation Failed ===');
      console.error('Error:', {
        name: error?.constructor?.name,
        message: error?.message,
        stack: error?.stack?.split('\n').slice(0, 3),
      });

      return {
        message: 'Test order creation failed',
        error: error?.message || 'Unknown error',
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  @Get('debug/validate-variant/:variantId')
  @ApiOperation({ summary: 'Debug endpoint to validate variant' })
  async validateVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    try {
      // Check if variant exists
      const variant = await this.ordersService['variantRepository'].findOne({
        where: { id: variantId },
        relations: ['product', 'color', 'size'],
      });

      return {
        message: 'Variant validation result',
        data: {
          variantId,
          exists: !!variant,
          variant: variant
            ? {
                id: variant.id,
                productId: variant.product?.id,
                colorName: variant.color?.name,
                sizeName: variant.size?.name,
                stockQuantity: variant.stockQuantity,
              }
            : null,
        },
      };
    } catch (error) {
      return {
        message: 'Variant validation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { variantId, exists: false },
      };
    }
  }
}
