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
    type: ShippingResponseDto,
  })
  async create(
    @Body() createShippingDto: CreateShippingDto,
    @GetUser() user: User,
  ): Promise<ShippingResponseDto> {
    return this.shippingService.create(createShippingDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipping records with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'Shipping records retrieved successfully',
    type: [ShippingResponseDto],
  })
  async findAll(
    @Query() query: ShippingQueryDto,
    @GetUser() user: User,
  ): Promise<ShippingResponseDto[]> {
    return this.shippingService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shipping record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping record retrieved successfully',
    type: ShippingResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<ShippingResponseDto> {
    return this.shippingService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping record updated successfully',
    type: ShippingResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShippingDto: UpdateShippingDto,
    @GetUser() user: User,
  ): Promise<ShippingResponseDto> {
    return this.shippingService.update(id, updateShippingDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shipping record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping record deleted successfully',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.shippingService.remove(id, user);
  }
}
