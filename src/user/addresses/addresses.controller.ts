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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto, AddressResponseDto } from './dto';
import { JwtAuthGuard } from 'src/common/guards';
import { GetUser } from 'src/common/decorators';
import { User } from '../users/entities/user.entity';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

@ApiTags('Addresses (User)')
@ApiExtraModels(AddressResponseDto, BaseResponseDto)
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  /**
   * Create new address for current user - User only
   * POST /addresses
   */ @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new address',
    description: 'Create a new address for the current user.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(AddressResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @GetUser() user: User,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<BaseResponseDto<AddressResponseDto>> {
    const address = await this.addressesService.create(createAddressDto, user);

    return {
      message: 'Address created successfully',
      data: plainToInstance(AddressResponseDto, address),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Get all addresses for current user - User only
   * GET /addresses
   */ @Get()
  @ApiOperation({
    summary: 'Get all addresses',
    description: 'Get all addresses for the current user.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(AddressResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @GetUser() user: User,
  ): Promise<BaseResponseDto<AddressResponseDto[]>> {
    const addresses = await this.addressesService.findAll(user);

    return {
      message: 'Addresses retrieved successfully',
      data: addresses.map((address) =>
        plainToInstance(AddressResponseDto, address),
      ),
      meta: {
        timestamp: new Date().toISOString(),
        total: addresses.length,
      },
    };
  }

  /**
   * Get default address for current user - User only
   * GET /addresses/default
   */
  @Get('default')
  @ApiOperation({
    summary: 'Get default address',
    description: 'Get the default address for the current user.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              oneOf: [
                { $ref: getSchemaPath(AddressResponseDto) },
                { type: 'null' },
              ],
            },
          },
        },
      ],
    },
  })
  async getDefault(
    @GetUser() user: User,
  ): Promise<BaseResponseDto<AddressResponseDto | null>> {
    const address = await this.addressesService.findDefault(user);

    return {
      message: address
        ? 'Default address retrieved successfully'
        : 'No default address found',
      data: address ? plainToInstance(AddressResponseDto, address) : null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get address by ID for current user - User only
   * GET /addresses/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get address by ID',
    description: 'Get a specific address by ID for the current user.',
  })
  @ApiParam({ name: 'id', description: 'Address ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(AddressResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<AddressResponseDto>> {
    const address = await this.addressesService.findOne(id, user);

    return {
      message: 'Address retrieved successfully',
      data: plainToInstance(AddressResponseDto, address),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Update address for current user - User only
   * PATCH /addresses/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update address',
    description:
      'Update a specific address for the current user. Can also set as default by including isDefault: true in the request body.',
  })
  @ApiParam({ name: 'id', description: 'Address ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(AddressResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<AddressResponseDto>> {
    const address = await this.addressesService.update(
      id,
      updateAddressDto,
      user,
    );

    const isDefaultMessage = updateAddressDto.isDefault
      ? ' and set as default'
      : '';

    return {
      message: `Address updated successfully${isDefaultMessage}`,
      data: plainToInstance(AddressResponseDto, address),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Delete address for current user - User only
   * DELETE /addresses/:id
   */ @Delete(':id')
  @ApiOperation({
    summary: 'Delete address',
    description: 'Delete a specific address for the current user.',
  })
  @ApiParam({ name: 'id', description: 'Address ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<null>> {
    await this.addressesService.remove(id, user);
    return {
      message: 'Address deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
