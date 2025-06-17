import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { JwtAuthGuard } from '../../common/guards';
import { GetUser } from '../../common/decorators';
import { User } from '../../user/users/entities/user.entity';
import { OrderItemsService } from './order-items.service';
import {
  CreateOrderItemDto,
  UpdateOrderItemDto,
  OrderItemQueryDto,
  OrderItemResponseDto,
} from './dto';

@ApiTags('Order Items')
@Controller('order-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order item' })
  @ApiResponse({
    status: 201,
    description: 'Order item created successfully',
    type: OrderItemResponseDto,
  })
  async create(
    @Body() createOrderItemDto: CreateOrderItemDto,
    @GetUser() user: User,
  ): Promise<OrderItemResponseDto> {
    return this.orderItemsService.create(createOrderItemDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all order items with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'Order items retrieved successfully',
    type: [OrderItemResponseDto],
  })
  async findAll(
    @Query() query: OrderItemQueryDto,
    @GetUser() user: User,
  ): Promise<OrderItemResponseDto[]> {
    return this.orderItemsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order item retrieved successfully',
    type: OrderItemResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<OrderItemResponseDto> {
    return this.orderItemsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order item updated successfully',
    type: OrderItemResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
    @GetUser() user: User,
  ): Promise<OrderItemResponseDto> {
    return this.orderItemsService.update(id, updateOrderItemDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order item deleted successfully',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.orderItemsService.remove(id, user);
  }
}
