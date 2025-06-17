import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping } from './entities/shipping.entity';
import { User } from '../../user/users/entities/user.entity';
import { ShippingStatus } from '../../common/constants/shipping-status.enum';
import {
  CreateShippingDto,
  UpdateShippingDto,
  ShippingQueryDto,
  ShippingResponseDto,
} from './dto';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Shipping)
    private readonly shippingRepository: Repository<Shipping>,
  ) {}

  async create(
    createShippingDto: CreateShippingDto,
    _user: User,
  ): Promise<ShippingResponseDto> {
    // Note: In practice, this would include additional validation
    // such as checking permissions, order existence, etc.
    const shipping = this.shippingRepository.create({
      recipientName: createShippingDto.recipientName,
      recipientPhone: createShippingDto.recipientPhone,
      address: createShippingDto.address,
      shippingFee: createShippingDto.cost,
      note: createShippingDto.instructions,
      trackingNumber: createShippingDto.trackingNumber,
      // Set default values for required fields
      wardCode: '',
      districtId: 0,
      provinceId: 0,
      ward: '',
      district: '',
      province: '',
      status: ShippingStatus.PENDING,
    });

    const savedShipping = await this.shippingRepository.save(shipping);
    return new ShippingResponseDto({
      ...savedShipping,
      orderId: savedShipping.order?.id,
      method: savedShipping.shippingMethod,
      cost: savedShipping.shippingFee,
      instructions: savedShipping.note,
      estimatedDeliveryDate: savedShipping.expectedDeliveryDate?.toISOString(),
      actualDeliveryDate: savedShipping.deliveredAt,
    });
  }

  async findAll(
    query: ShippingQueryDto,
    _user: User,
  ): Promise<ShippingResponseDto[]> {
    const queryBuilder = this.shippingRepository.createQueryBuilder('shipping');

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('shipping.status = :status', {
        status: query.status,
      });
    }

    if (query.trackingNumber) {
      queryBuilder.andWhere('shipping.trackingNumber = :trackingNumber', {
        trackingNumber: query.trackingNumber,
      });
    }

    if (query.recipientName) {
      queryBuilder.andWhere('shipping.recipientName ILIKE :recipientName', {
        recipientName: `%${query.recipientName}%`,
      });
    }

    // Add pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    queryBuilder.skip((page - 1) * limit).take(limit);

    const shippings = await queryBuilder.getMany();
    return shippings.map(
      (shipping) =>
        new ShippingResponseDto({
          ...shipping,
          orderId: shipping.order?.id,
          method: shipping.shippingMethod,
          cost: shipping.shippingFee,
          instructions: shipping.note,
          estimatedDeliveryDate: shipping.expectedDeliveryDate?.toISOString(),
          actualDeliveryDate: shipping.deliveredAt,
        }),
    );
  }

  async findOne(id: string, _user: User): Promise<ShippingResponseDto> {
    const shipping = await this.shippingRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(`Shipping record with ID ${id} not found`);
    }

    // Note: Add proper permission checks here based on your business logic

    return new ShippingResponseDto({
      ...shipping,
      orderId: shipping.order?.id,
      method: shipping.shippingMethod,
      cost: shipping.shippingFee,
      instructions: shipping.note,
      estimatedDeliveryDate: shipping.expectedDeliveryDate?.toISOString(),
      actualDeliveryDate: shipping.deliveredAt,
    });
  }

  async update(
    id: string,
    updateShippingDto: UpdateShippingDto,
    _user: User,
  ): Promise<ShippingResponseDto> {
    const shipping = await this.shippingRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(`Shipping record with ID ${id} not found`);
    }

    // Update the entity
    const updatedData: Partial<Shipping> = {};
    if (updateShippingDto.recipientName !== undefined) {
      updatedData.recipientName = updateShippingDto.recipientName;
    }
    if (updateShippingDto.recipientPhone !== undefined) {
      updatedData.recipientPhone = updateShippingDto.recipientPhone;
    }
    if (updateShippingDto.address !== undefined) {
      updatedData.address = updateShippingDto.address;
    }
    if (updateShippingDto.cost !== undefined) {
      updatedData.shippingFee = updateShippingDto.cost;
    }
    if (updateShippingDto.instructions !== undefined) {
      updatedData.note = updateShippingDto.instructions;
    }
    if (updateShippingDto.trackingNumber !== undefined) {
      updatedData.trackingNumber = updateShippingDto.trackingNumber;
    }

    await this.shippingRepository.update(id, updatedData);

    const updatedShipping = await this.shippingRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!updatedShipping) {
      throw new NotFoundException(
        `Shipping record with ID ${id} not found after update`,
      );
    }

    return new ShippingResponseDto({
      ...updatedShipping,
      orderId: updatedShipping.order?.id,
      method: updatedShipping.shippingMethod,
      cost: updatedShipping.shippingFee,
      instructions: updatedShipping.note,
      estimatedDeliveryDate:
        updatedShipping.expectedDeliveryDate?.toISOString(),
      actualDeliveryDate: updatedShipping.deliveredAt,
    });
  }

  async remove(id: string, _user: User): Promise<void> {
    const shipping = await this.shippingRepository.findOne({
      where: { id },
    });

    if (!shipping) {
      throw new NotFoundException(`Shipping record with ID ${id} not found`);
    }

    await this.shippingRepository.remove(shipping);
  }
}
