import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { Shipping } from './entities/shipping.entity';
import { ShippingStatus } from 'src/common/constants/shipping-status.enum';
import { GHNService } from './services/ghn.service';
import {
  GHNCreateOrderRequest,
  GHNOrderItem,
} from './interfaces/ghn.interface';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
    private readonly ghnService: GHNService,
  ) {}

  async create(createShippingDto: CreateShippingDto): Promise<Shipping> {
    const shipping = this.shippingRepository.create({
      ...createShippingDto,
      status: ShippingStatus.PENDING,
    });
    return await this.shippingRepository.save(shipping);
  }

  /**
   * Create shipping with GHN integration
   */
  async createWithGHN(
    createShippingDto: CreateShippingDto,
    order: Order,
  ): Promise<Shipping> {
    try {
      // First, validate the address
      const isValidAddress = await this.ghnService.validateAddress(
        createShippingDto.province,
        createShippingDto.district,
        createShippingDto.ward,
      );

      if (!isValidAddress) {
        throw new Error('Invalid shipping address');
      } // Calculate shipping fee
      const feeCalculation = await this.ghnService.calculateFee({
        from_district_id: parseInt(process.env.GHN_FROM_DISTRICT_ID || '1454'), // Shop's district
        from_ward_code: process.env.GHN_FROM_WARD_CODE || '21211', // Shop's ward
        to_district_id: createShippingDto.districtId,
        to_ward_code: createShippingDto.wardCode,
        height: 10, // Default package dimensions
        length: 20,
        width: 15,
        weight:
          order.items && order.items.length > 0
            ? order.items.length * 500 // Default weight per item
            : 1000,
        insurance_value: order.totalPrice,
        cod_amount: createShippingDto.codAmount || 0,
        service_id: createShippingDto.serviceId || 53320, // Standard service
        service_type_id: 2, // E-commerce
      });

      // Prepare GHN order data
      const ghnOrderData: GHNCreateOrderRequest = {
        payment_type_id: (createShippingDto.codAmount || 0) > 0 ? 2 : 1, // COD or prepaid
        note: createShippingDto.note || '',
        required_note: 'CHOXEMHANGKHONGTHU', // Allow inspection, no try-on
        return_phone: process.env.GHN_RETURN_PHONE || '0123456789',
        return_address: process.env.GHN_RETURN_ADDRESS || 'Shop Address',
        return_district_id: parseInt(
          process.env.GHN_FROM_DISTRICT_ID || '1454',
        ),
        return_ward_code: process.env.GHN_FROM_WARD_CODE || '21211',
        client_order_code: order.id,
        to_name: createShippingDto.recipientName,
        to_phone: createShippingDto.recipientPhone,
        to_address: createShippingDto.address,
        to_ward_code: createShippingDto.wardCode,
        to_district_id: createShippingDto.districtId,
        cod_amount: createShippingDto.codAmount || 0,
        content: `Order ${order.id} - Fashion items`,
        weight:
          order.items && order.items.length > 0
            ? order.items.length * 500 // Default weight per item
            : 1000,
        length: 20,
        width: 15,
        height: 10,
        insurance_value: order.totalPrice,
        service_id: createShippingDto.serviceId || 53320,
        service_type_id: 2,
        items:
          order.items?.map(
            (item) =>
              ({
                name: item.productName || 'Fashion Item',
                quantity: item.quantity,
                price: item.unitPrice,
                weight: 500, // Default weight
              }) as GHNOrderItem,
          ) || [],
      };

      // Create order in GHN
      const ghnResponse = await this.ghnService.createOrder(ghnOrderData);

      // Create shipping record with GHN data
      const shipping = this.shippingRepository.create({
        ...createShippingDto,
        order: order,
        status: ShippingStatus.PENDING,
        trackingNumber: ghnResponse.data.order_code,
        shippingFee: feeCalculation.data.total,
        expectedDeliveryDate: new Date(ghnResponse.data.expected_delivery_time),
        ghnOrderCode: ghnResponse.data.order_code,
        ghnSortCode: ghnResponse.data.sort_code,
        ghnTransType: ghnResponse.data.trans_type,
      });

      const savedShipping = await this.shippingRepository.save(shipping);

      this.logger.log(
        `Shipping created with GHN order code: ${ghnResponse.data.order_code}`,
      );
      return savedShipping;
    } catch (error) {
      this.logger.error(
        `Failed to create shipping with GHN: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Calculate shipping fee using GHN
   */
  async calculateShippingFee(
    toDistrictId: number,
    toWardCode: string,
    weight: number,
    insuranceValue: number = 0,
    codAmount: number = 0,
    serviceId: number = 53320,
  ): Promise<number> {
    try {
      const response = await this.ghnService.calculateFee({
        from_district_id: parseInt(process.env.GHN_FROM_DISTRICT_ID || '1454'),
        from_ward_code: process.env.GHN_FROM_WARD_CODE || '21211',
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        height: 10,
        length: 20,
        width: 15,
        weight: weight,
        insurance_value: insuranceValue,
        cod_amount: codAmount,
        service_id: serviceId,
        service_type_id: 2,
      });

      return response.data.total;
    } catch (error) {
      this.logger.error(
        `Failed to calculate shipping fee: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async findAll(): Promise<Shipping[]> {
    return await this.shippingRepository.find({
      relations: ['order'],
    });
  }

  async findOne(id: string): Promise<Shipping> {
    const shipping = await this.shippingRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(`Shipping with ID ${id} not found`);
    }

    return shipping;
  }

  async findByOrderId(orderId: string): Promise<Shipping> {
    const shipping = await this.shippingRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order'],
    });

    if (!shipping) {
      throw new NotFoundException(`Shipping for order ${orderId} not found`);
    }

    return shipping;
  }

  async update(
    id: string,
    updateShippingDto: UpdateShippingDto,
  ): Promise<Shipping> {
    const shipping = await this.findOne(id);
    Object.assign(shipping, updateShippingDto);
    return await this.shippingRepository.save(shipping);
  }

  async updateStatus(id: string, status: ShippingStatus): Promise<Shipping> {
    const shipping = await this.findOne(id);
    shipping.status = status;

    // Update timestamp accordingly
    switch (status) {
      case ShippingStatus.SHIPPED:
        shipping.shippedAt = new Date();
        break;
      case ShippingStatus.DELIVERED:
        shipping.deliveredAt = new Date();
        break;
    }

    return await this.shippingRepository.save(shipping);
  }

  async remove(id: string): Promise<void> {
    const shipping = await this.findOne(id);
    await this.shippingRepository.remove(shipping);
  }

  /**
   * Update shipping status from GHN tracking
   */
  async updateFromGHNTracking(orderCode: string): Promise<Shipping> {
    try {
      const tracking = await this.ghnService.trackOrder(orderCode);
      const shipping = await this.shippingRepository.findOne({
        where: { ghnOrderCode: orderCode },
        relations: ['order'],
      });

      if (!shipping) {
        throw new NotFoundException(
          `Shipping with GHN order code ${orderCode} not found`,
        );
      }

      const newStatusString = this.ghnService.mapGHNStatusToShippingStatus(
        tracking.data.status,
      );
      const newStatus = newStatusString as ShippingStatus;
      const currentStatus = shipping.status;

      // Only update if status has changed
      if (currentStatus !== newStatus) {
        shipping.status = newStatus;

        // Update timestamps based on status
        switch (newStatus) {
          case ShippingStatus.SHIPPED:
            if (!shipping.shippedAt) {
              shipping.shippedAt = new Date();
            }
            break;
          case ShippingStatus.DELIVERED:
            if (!shipping.deliveredAt) {
              shipping.deliveredAt = new Date();
            }
            break;
        }

        const updatedShipping = await this.shippingRepository.save(shipping);
        this.logger.log(
          `Updated shipping ${shipping.id} status from ${currentStatus} to ${newStatus}`,
        );
        return updatedShipping;
      }

      return shipping;
    } catch (error) {
      const errorMessage = (error as Error).message;
      const errorStack = (error as Error).stack;
      this.logger.error(
        `Failed to update shipping from GHN tracking: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Get shipping tracking information
   */
  async getTrackingInfo(id: string): Promise<any> {
    try {
      const shipping = await this.findOne(id);

      if (!shipping.ghnOrderCode) {
        return {
          status: shipping.status,
          trackingNumber: shipping.trackingNumber,
          logs: [],
        };
      }

      const tracking = await this.ghnService.trackOrder(shipping.ghnOrderCode);
      return {
        status: shipping.status,
        trackingNumber: shipping.trackingNumber,
        ghnStatus: tracking.data.status,
        expectedDeliveryTime: tracking.data.expected_delivery_time,
        logs: tracking.data.logs,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(`Failed to get tracking info: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Cancel shipping order in GHN
   */
  async cancelShipping(id: string): Promise<Shipping> {
    try {
      const shipping = await this.findOne(id);

      if (shipping.ghnOrderCode) {
        await this.ghnService.cancelOrder([shipping.ghnOrderCode]);
        this.logger.log(`Canceled GHN order: ${shipping.ghnOrderCode}`);
      }

      shipping.status = ShippingStatus.CANCELLED;
      return await this.shippingRepository.save(shipping);
    } catch (error) {
      const errorMessage = (error as Error).message;
      const errorStack = (error as Error).stack;
      this.logger.error(
        `Failed to cancel shipping: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Get available shipping services for an address
   */
  async getAvailableServices(toDistrictId: number): Promise<any> {
    try {
      const fromDistrictId = parseInt(
        process.env.GHN_FROM_DISTRICT_ID || '1454',
      );
      return await this.ghnService.getServices(fromDistrictId, toDistrictId);
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(`Failed to get available services: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get tracking information by order ID
   */
  async getTrackingByOrderId(orderId: string): Promise<any> {
    try {
      const shipping = await this.findByOrderId(orderId);
      return await this.getTrackingInfo(shipping.id);
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(
        `Failed to get tracking info for order ${orderId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Validate shipping address using GHN
   */
  async validateAddress(
    provinceId: number,
    districtId: number,
    wardCode: string,
  ): Promise<boolean> {
    try {
      return await this.ghnService.validateAddress(
        provinceId.toString(),
        districtId.toString(),
        wardCode,
      );
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(`Failed to validate address: ${errorMessage}`);
      return false;
    }
  }
}
