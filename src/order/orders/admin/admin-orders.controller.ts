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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from '../orders.service';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { OrderStatus } from 'src/common/constants/order-status.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';

@ApiTags('Admin - Orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders (Admin)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PaginatedResponseDto> {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const result = await this.ordersService.findAllForAdmin({
      page: pageNum,
      limit: limitNum,
      status,
      paymentStatus,
      search,
      sortBy,
      sortOrder,
    });

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

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
  })
  async getStats(): Promise<BaseResponseDto> {
    const stats = await this.ordersService.getOrderStats();
    return {
      message: 'Order statistics retrieved successfully',
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get order statistics (Admin) - Alternative endpoint',
  })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
  })
  async getStatistics(): Promise<BaseResponseDto> {
    const stats = await this.ordersService.getOrderStats();
    return {
      message: 'Order statistics retrieved successfully',
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Order found successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string): Promise<BaseResponseDto> {
    const order = await this.ordersService.findOneForAdmin(id);
    return {
      message: 'Order found successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order (Admin)' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
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
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; note?: string },
  ): Promise<BaseResponseDto> {
    const order = await this.ordersService.updateOrderStatus(id, body.status);

    // Add note if provided
    if (body.note) {
      await this.ordersService.update(id, { note: body.note });
    }

    return {
      message: 'Order status updated successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order (Admin)' })
  @ApiResponse({ status: 204, description: 'Order deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.ordersService.remove(id);
  }
  @Post('export')
  @ApiOperation({ summary: 'Export orders to CSV (Admin)' })
  @ApiResponse({ status: 200, description: 'Orders exported successfully' })
  async exportOrders(
    @Body()
    filters: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      dateFrom?: string;
      dateTo?: string;
    },
  ): Promise<BaseResponseDto> {
    const csvData = await this.ordersService.exportOrders(filters);
    return {
      message: 'Orders exported successfully',
      data: { csvData },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export orders to CSV via GET (Admin)' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportOrdersGet(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const csvData = await this.ordersService.exportOrders({
      status,
      paymentStatus,
      dateFrom,
      dateTo,
    });

    const response = {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=orders-export-${new Date().toISOString().split('T')[0]}.csv`,
      },
      body: csvData,
    };

    return response;
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (Admin)' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<BaseResponseDto> {
    const order = await this.ordersService.cancelOrderForAdmin(id, body.reason);
    return {
      message: 'Order cancelled successfully',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch('bulk-update')
  @ApiOperation({ summary: 'Bulk update orders (Admin)' })
  @ApiResponse({ status: 200, description: 'Orders updated successfully' })
  async bulkUpdateOrders(
    @Body()
    updateData: {
      orderIds: string[];
      updateData: { status?: OrderStatus; note?: string };
    },
  ): Promise<BaseResponseDto> {
    const result = await this.ordersService.bulkUpdateOrders(
      updateData.orderIds,
      updateData.updateData,
    );
    return {
      message: 'Orders updated successfully',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
