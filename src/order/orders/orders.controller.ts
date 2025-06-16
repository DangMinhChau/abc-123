import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new order (supports both guest and authenticated users)',
  })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<BaseResponseDto> {
    // If user is authenticated and userId is not provided, set it from token
    if (req.user && !createOrderDto.userId) {
      createOrderDto.userId = req.user.id;
    }

    const order = await this.ordersService.create(createOrderDto);
    return {
      message: 'Order created successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ): Promise<PaginatedResponseDto> {
    if (!req.user) {
      throw new Error('Authentication required');
    }
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const result = await this.ordersService.findAll(
      pageNum,
      limitNum,
      status,
      req.user.id,
    );
    return {
      message: 'Orders retrieved successfully',
      data: result.data,
      meta: {
        ...result.meta,
        totalPages: Math.ceil(result.meta.total / result.meta.limit),
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders' })
  async getMyOrders(
    @Request() req: AuthenticatedRequest,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<PaginatedResponseDto> {
    if (!req.user) {
      throw new Error('Authentication required');
    }
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const result = await this.ordersService.findUserOrders(
      req.user.id,
      pageNum,
      limitNum,
    );
    return {
      message: 'User orders retrieved successfully',
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
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order found successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<BaseResponseDto> {
    if (!req.user) {
      throw new Error('Authentication required');
    }
    const order = await this.ordersService.findOneForUser(id, req.user.id);
    return {
      message: 'Order found successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update order (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<BaseResponseDto> {
    const order = await this.ordersService.update(id, updateOrderDto);
    return {
      message: 'Order updated successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete order (Admin only)' })
  async remove(@Param('id') id: string) {
    await this.ordersService.remove(id);
  }
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<BaseResponseDto> {
    if (!req.user) {
      throw new Error('Authentication required');
    }
    const order = await this.ordersService.cancelOrderForUser(id, req.user.id);
    return {
      message: 'Order cancelled successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order found successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
  ): Promise<BaseResponseDto> {
    const order = await this.ordersService.findByOrderNumber(orderNumber);
    return {
      message: 'Order found successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
