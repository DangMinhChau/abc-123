import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards';
import { GetUserId } from 'src/common/decorators';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { UpdateProfileDto } from './dto/requests/update-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: BaseResponseDto,
  })
  async getProfile(@GetUserId() userId: string) {
    const user = await this.usersService.findById(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin người dùng thành công',
      data: user,
      timestamp: new Date().toISOString(),
      path: '/users/profile',
    };
  }
  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({
    description: 'User profile updated successfully',
    type: BaseResponseDto,
  })
  async updateProfile(
    @GetUserId() userId: string,
    @Body() updateData: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      userId,
      updateData,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thông tin người dùng thành công',
      data: updatedUser,
      timestamp: new Date().toISOString(),
      path: '/users/profile',
    };
  }
}
