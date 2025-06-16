import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  id: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Đơn hàng của bạn đã được xác nhận',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'Đơn hàng #ORD-001 đã được xác nhận và đang được chuẩn bị',
  })
  message: string;

  @ApiProperty({
    description: 'Notification type',
    enum: ['ORDER', 'PROMOTION', 'SYSTEM', 'GENERAL'],
    example: 'ORDER',
  })
  type: string;

  @ApiProperty({
    description: 'Whether the notification is read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Additional metadata',
    example: {
      orderId: '123e4567-e89b-12d3-a456-426614174001',
    },
  })
  metadata: object;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
