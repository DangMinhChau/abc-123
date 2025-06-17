import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../../user/users/entities/user.entity';
import {
  CreateOrderItemDto,
  UpdateOrderItemDto,
  OrderItemQueryDto,
  OrderItemResponseDto,
} from './dto';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}
  async create(
    createOrderItemDto: CreateOrderItemDto,
    _user: User,
  ): Promise<OrderItemResponseDto> {
    // Note: In practice, this would include additional validation
    // such as checking if the user owns the order, variant exists, etc.
    const orderItem = this.orderItemRepository.create({
      variant: { id: createOrderItemDto.variantId },
      quantity: createOrderItemDto.quantity,
      unitPrice: createOrderItemDto.pricePerUnit,
      // These would be populated from the variant/product data
      productName: '',
      variantSku: '',
      colorName: '',
      sizeName: '',
    });

    const savedOrderItem = await this.orderItemRepository.save(orderItem);
    return new OrderItemResponseDto({
      ...savedOrderItem,
      variantId: createOrderItemDto.variantId,
      orderId: savedOrderItem.order?.id,
      pricePerUnit: savedOrderItem.unitPrice,
      totalPrice: savedOrderItem.getTotalPrice(),
    });
  }
  async findAll(
    query: OrderItemQueryDto,
    _user: User,
  ): Promise<OrderItemResponseDto[]> {
    const queryBuilder =
      this.orderItemRepository.createQueryBuilder('orderItem');

    // Apply filters
    if (query.orderId) {
      queryBuilder.andWhere('orderItem.orderId = :orderId', {
        orderId: query.orderId,
      });
    }

    if (query.variantId) {
      queryBuilder.andWhere('orderItem.variantId = :variantId', {
        variantId: query.variantId,
      });
    }

    // Add pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    queryBuilder.skip((page - 1) * limit).take(limit);

    const orderItems = await queryBuilder.getMany();
    return orderItems.map(
      (item) =>
        new OrderItemResponseDto({
          ...item,
          variantId: item.variant?.id,
          orderId: item.order?.id,
          pricePerUnit: item.unitPrice,
          totalPrice: item.getTotalPrice(),
        }),
    );
  }

  async findOne(id: string, _user: User): Promise<OrderItemResponseDto> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'variant'],
    });

    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }

    // Note: Add proper permission checks here based on your business logic
    // For example, check if user owns the order that contains this item

    return new OrderItemResponseDto({
      ...orderItem,
      variantId: orderItem.variant?.id,
      orderId: orderItem.order?.id,
      pricePerUnit: orderItem.unitPrice,
      totalPrice: orderItem.getTotalPrice(),
    });
  }
  async update(
    id: string,
    updateOrderItemDto: UpdateOrderItemDto,
    _user: User,
  ): Promise<OrderItemResponseDto> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'variant'],
    });

    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }

    // Update the entity
    const updatedData: Partial<OrderItem> = {};
    if (updateOrderItemDto.quantity !== undefined) {
      updatedData.quantity = updateOrderItemDto.quantity;
    }
    if (updateOrderItemDto.pricePerUnit !== undefined) {
      updatedData.unitPrice = updateOrderItemDto.pricePerUnit;
    }

    await this.orderItemRepository.update(id, updatedData);

    const updatedOrderItem = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'variant'],
    });

    if (!updatedOrderItem) {
      throw new NotFoundException(
        `Order item with ID ${id} not found after update`,
      );
    }

    return new OrderItemResponseDto({
      ...updatedOrderItem,
      variantId: updatedOrderItem.variant?.id,
      orderId: updatedOrderItem.order?.id,
      pricePerUnit: updatedOrderItem.unitPrice,
      totalPrice: updatedOrderItem.getTotalPrice(),
    });
  }

  async remove(id: string, _user: User): Promise<void> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id },
    });

    if (!orderItem) {
      throw new NotFoundException(`Order item with ID ${id} not found`);
    }

    await this.orderItemRepository.remove(orderItem);
  }
}
