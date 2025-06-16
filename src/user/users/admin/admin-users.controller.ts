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
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/constants/user-role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { AdminUsersService, PaginatedUsers } from './admin-users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from '../dto';

@ApiTags('Admin - User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiExtraModels(
  BaseResponseDto,
  UserResponseDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách người dùng',
    description: 'Lấy danh sách người dùng với phân trang và bộ lọc',
  })
  @ApiOkResponse({
    description: 'Lấy danh sách người dùng thành công',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Lấy danh sách người dùng thành công',
        },
        data: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/UserResponseDto' },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 100 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 10 },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
  async findAll(
    @Query() queryDto: UserQueryDto,
  ): Promise<BaseResponseDto<PaginatedUsers>> {
    const result = await this.adminUsersService.findAll(queryDto);

    return {
      message: 'Lấy danh sách người dùng thành công',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết người dùng',
    description: 'Lấy thông tin chi tiết của một người dùng theo ID',
  })
  @ApiOkResponse({
    description: 'Lấy thông tin người dùng thành công',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Người dùng không tồn tại' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    const user = await this.adminUsersService.findOne(id);

    return {
      message: 'Lấy thông tin người dùng thành công',
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo người dùng mới',
    description: 'Tạo một người dùng mới trong hệ thống',
  })
  @ApiCreatedResponse({
    description: 'Tạo người dùng thành công',
    type: UserResponseDto,
  })
  @ApiConflictResponse({ description: 'Email hoặc số điện thoại đã tồn tại' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    const user = await this.adminUsersService.create(createUserDto);

    return {
      message: 'Tạo người dùng thành công',
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng',
    description:
      'Cập nhật thông tin của một người dùng, bao gồm vai trò và trạng thái hoạt động',
  })
  @ApiOkResponse({
    description: 'Cập nhật người dùng thành công',
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Người dùng không tồn tại' })
  @ApiConflictResponse({ description: 'Email hoặc số điện thoại đã tồn tại' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    const user = await this.adminUsersService.update(id, updateUserDto);

    return {
      message: 'Cập nhật người dùng thành công',
      data: user,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa người dùng (xóa mềm)',
    description: 'Xóa mềm người dùng bằng cách đặt isActive = false',
  })
  @ApiOkResponse({
    description: 'Xóa người dùng thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Xóa người dùng thành công' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Xóa người dùng thành công' },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Người dùng không tồn tại' })
  @ApiBadRequestResponse({ description: 'Không thể xóa tài khoản admin' })
  @ApiUnauthorizedResponse({ description: 'Chưa đăng nhập' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponseDto<{ message: string }>> {
    const result = await this.adminUsersService.remove(id);

    return {
      message: 'Xóa người dùng thành công',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
