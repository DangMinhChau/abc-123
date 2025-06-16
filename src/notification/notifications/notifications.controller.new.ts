import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUserId } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { NotificationDto } from './dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @GetUserId() userId: string,
  ) {
    this.logger.log(`Creating notification for user: ${userId}`);
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Query() queryDto: NotificationQueryDto,
    @GetUserId() userId: string,
  ) {
    this.logger.log(`Fetching notifications for user: ${userId}`);
    return this.notificationsService.findAll(
      userId,
      queryDto.page,
      queryDto.limit,
      queryDto.isRead,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@GetUserId() userId: string) {
    this.logger.log(`Fetching unread notification count for user: ${userId}`);
    const result = await this.notificationsService.findAll(userId, 1, 1, false);
    return result.meta.total;
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUserId() userId: string) {
    this.logger.log(`Fetching notification ${id} for user: ${userId}`);
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/mark-as-read')
  markAsRead(@Param('id') id: string, @GetUserId() userId: string) {
    this.logger.log(`Marking notification ${id} as read for user: ${userId}`);
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-as-read')
  markAllAsRead(@GetUserId() userId: string) {
    this.logger.log(`Marking all notifications as read for user: ${userId}`);
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @GetUserId() userId: string,
  ) {
    this.logger.log(`Updating notification ${id} for user: ${userId}`);
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @GetUserId() userId: string) {
    this.logger.log(`Removing notification ${id} for user: ${userId}`);
    await this.notificationsService.remove(id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllForAdmin(@Query() queryDto: NotificationQueryDto) {
    this.logger.log('Admin fetching all notifications');
    return this.notificationsService.findAll(
      '', // empty string instead of null
      queryDto.page,
      queryDto.limit,
      queryDto.isRead,
    );
  }
}
