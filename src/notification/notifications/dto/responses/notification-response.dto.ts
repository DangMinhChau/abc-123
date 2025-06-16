import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Đơn hàng của bạn đã được xác nhận',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Đơn hàng #ORD-001 đã được xác nhận và đang được chuẩn bị',
  })
  @Expose()
  message: string;

  @ApiProperty({
    description: 'Notification type',
    enum: ['ORDER', 'PROMOTION', 'SYSTEM', 'GENERAL'],
    example: 'ORDER',
  })
  @Expose()
  type: string;

  @ApiProperty({
    description: 'Whether the notification is read',
    example: false,
  })
  @Expose()
  isRead: boolean;

  @ApiProperty({
    description: 'User ID who receives the notification',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Notification creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Notification last update timestamp',
    example: '2024-01-15T11:45:00Z',
  })
  @Expose()
  updatedAt: Date;
}
