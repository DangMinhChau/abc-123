import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from 'src/user/users/entities/user.entity';
import { Order } from 'src/order/orders/entities/order.entity';
import { OrderStatus } from 'src/common/constants/order-status.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    return await this.notificationRepository.save(notification);
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    isRead?: boolean,
  ) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user.id = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }
    const [notifications, total] = await queryBuilder.getManyAndCount();
    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAsRead(id: string) {
    const notification = await this.findOne(id);
    notification.isRead = true;
    notification.readAt = new Date();
    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { success: true, message: 'All notifications marked as read' };
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async remove(id: string) {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
    return { success: true };
  }

  // Các phương thức tạo thông báo theo từng loại sự kiện

  async notifyOrderStatusChange(userId: string, order: Order) {
    let title: string;
    let content: string;
    let type: NotificationType;
    switch (order.status) {
      case OrderStatus.PENDING:
        title = 'Đơn hàng đã được tạo';
        content = `Đơn hàng #${order.orderNumber} của bạn đã được tạo và đang chờ xử lý.`;
        type = NotificationType.ORDER_UPDATED;
        break;
      case OrderStatus.PROCESSING:
        title = 'Đơn hàng đang được xử lý';
        content = `Đơn hàng #${order.orderNumber} của bạn đang được chuẩn bị.`;
        type = NotificationType.ORDER_UPDATED;
        break;
      case OrderStatus.COMPLETED:
        title = 'Đơn hàng đã hoàn thành';
        content = `Đơn hàng #${order.orderNumber} đã được hoàn thành thành công.`;
        type = NotificationType.ORDER_DELIVERED;
        break;
      case OrderStatus.CANCELLED:
        title = 'Đơn hàng đã bị hủy';
        content = `Đơn hàng #${order.orderNumber} của bạn đã bị hủy.`;
        type = NotificationType.ORDER_CANCELLED;
        break;
      default:
        return;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`Unable to send notification: User ${userId} not found`);
      return;
    }

    const notification = this.notificationRepository.create({
      title,
      content,
      type,
      user,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    });

    await this.notificationRepository.save(notification);
    this.logger.log(`Created ${type} notification for user ${userId}`);

    return notification;
  }

  async notifyPaymentStatusChange(
    userId: string,
    orderId: string,
    orderNumber: string,
    status: PaymentStatus,
  ) {
    let title: string;
    let content: string;
    let type: NotificationType;

    if (status === PaymentStatus.PAID) {
      title = 'Thanh toán thành công';
      content = `Thanh toán cho đơn hàng #${orderNumber} của bạn đã được xác nhận.`;
      type = NotificationType.PAYMENT_SUCCESS;
    } else if (status === PaymentStatus.FAILED) {
      title = 'Thanh toán thất bại';
      content = `Thanh toán cho đơn hàng #${orderNumber} của bạn không thành công. Vui lòng thử lại.`;
      type = NotificationType.PAYMENT_FAILED;
    } else {
      return;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`Unable to send notification: User ${userId} not found`);
      return;
    }

    const notification = this.notificationRepository.create({
      title,
      content,
      type,
      user,
      metadata: {
        orderId,
        orderNumber,
        status,
      },
    });

    await this.notificationRepository.save(notification);
    this.logger.log(`Created ${type} notification for user ${userId}`);

    return notification;
  }
}
