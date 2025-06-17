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
import { BaseResponseDto, PaginatedResponseDto } from '../../common/dto';
import { ShippingService } from './shipping.service';
import {
  CreateShippingDto,
  UpdateShippingDto,
  ShippingQueryDto,
  ShippingResponseDto,
} from './dto';

@ApiTags('Shippings')
@Controller('shippings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipping record' })
  @ApiResponse({
    status: 201,
    description: 'Shipping record created successfully',
    type: BaseResponseDto<ShippingResponseDto>,
  })
  async create(
    @Body() createShippingDto: CreateShippingDto,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<ShippingResponseDto>> {
    const shipping = await this.shippingService.create(createShippingDto, user);

    return {
      message: 'Tạo thông tin giao hàng thành công',
      data: shipping,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipping records with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'Shipping records retrieved successfully',
    type: PaginatedResponseDto<ShippingResponseDto>,
  })
  async findAll(
    @Query() query: ShippingQueryDto,
    @GetUser() user: User,
  ): Promise<PaginatedResponseDto<ShippingResponseDto>> {
    const shippings = await this.shippingService.findAll(query, user);

    // In a real implementation, you would get pagination info from the service
    const page = query.page || 1;
    const limit = query.limit || 20;

    return {
      message: 'Lấy danh sách thông tin giao hàng thành công',
      data: shippings,
      meta: {
        timestamp: new Date().toISOString(),
        page,
        limit,
        total: shippings.length, // This should come from the service
        totalPages: Math.ceil(shippings.length / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping record retrieved successfully',
    type: BaseResponseDto<ShippingResponseDto>,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<ShippingResponseDto>> {
    const shipping = await this.shippingService.findOne(id, user);

    return {
      message: 'Lấy thông tin giao hàng thành công',
      data: shipping,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping record updated successfully',
    type: BaseResponseDto<ShippingResponseDto>,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShippingDto: UpdateShippingDto,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<ShippingResponseDto>> {
    const shipping = await this.shippingService.update(
      id,
      updateShippingDto,
      user,
    );

    return {
      message: 'Cập nhật thông tin giao hàng thành công',
      data: shipping,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipping record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping record deleted successfully',
    type: BaseResponseDto<null>,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<null>> {
    await this.shippingService.remove(id, user);

    return {
      message: 'Xóa thông tin giao hàng thành công',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
