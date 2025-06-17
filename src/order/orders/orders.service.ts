import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { CreateSimpleOrderDto } from './dto/create-simple-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrderStatus } from 'src/common/constants/order-status.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';
import { ProductsService } from 'src/product/products/products.service';
import { User } from 'src/user/users/entities/user.entity';
import { VouchersService } from 'src/promotion/vouchers/vouchers.service';
import { Voucher } from 'src/promotion/vouchers/entities/voucher.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private readonly productsService: ProductsService,
    private readonly vouchersService: VouchersService,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    try {
      // Validate all order items and check availability
      await this.validateOrderItems(createOrderDto.items); // Validate and apply voucher if provided
      let appliedVoucher: Voucher | null = null;
      if (createOrderDto.voucherId) {
        const voucherValidation = await this.vouchersService.validateVoucher(
          createOrderDto.voucherId,
          createOrderDto.subTotal,
        );

        if (!voucherValidation.isValid) {
          throw new BadRequestException(
            `Voucher validation failed: ${voucherValidation.error}`,
          );
        }

        if (!voucherValidation.voucher) {
          throw new BadRequestException('Voucher not found after validation');
        }

        appliedVoucher = voucherValidation.voucher;

        // Verify discount amount matches
        const expectedDiscount = appliedVoucher.calculateDiscount(
          createOrderDto.subTotal,
        );
        const actualDiscount = createOrderDto.discount || 0;
        if (Math.abs(actualDiscount - expectedDiscount) > 0.01) {
          throw new BadRequestException(
            `Discount amount mismatch. Expected: ${expectedDiscount}, Received: ${actualDiscount}`,
          );
        }
      } // Generate unique order number
      const orderNumber = this.generateOrderNumber(); // Destructure to separate items from order data (items stored in order, stock managed on payment)
      const {
        items: _,
        userId,
        voucherId: __,
        ...orderFields
      } = createOrderDto;

      // Create order with optional user and voucher relations
      const orderData: Partial<Order> = {
        ...orderFields,
        orderNumber,
        status: OrderStatus.PENDING,
      };

      // Only set user relation if userId is provided (authenticated user)
      if (userId) {
        orderData.user = { id: userId } as User;
      } // Set voucher relation if voucher is applied
      if (appliedVoucher) {
        orderData.voucher = appliedVoucher;
      }

      const order = this.orderRepository.create(orderData);
      const savedOrder = await this.orderRepository.save(order);

      // NOTE: Stock quantities will be updated only after successful payment
      // This ensures stock is not lost for failed/abandoned payments

      // If voucher was used, increment its usage count
      if (appliedVoucher && createOrderDto.voucherId) {
        await this.vouchersService.incrementUsage(createOrderDto.voucherId);
      }

      // Simply return the order - payment handling should be done separately via PaymentsController
      return savedOrder;
    } catch (error) {
      throw new BadRequestException(
        'Failed to create order: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }
  } /**
   * Validate all order items for availability and correct pricing
   */
  private async validateOrderItems(items: CreateOrderItemDto[]): Promise<void> {
    for (const item of items) {
      // Get product info from variant ID
      const productData = await this.productsService.getProductFromVariant(
        item.variantId,
      ); // Check availability
      const availability = await this.productsService.checkProductAvailability(
        productData.product.id,
        item.variantId,
        item.quantity,
      );

      if (!availability.available) {
        throw new BadRequestException(
          `Product "${productData.product.name}" is not available. ${availability.message}`,
        );
      }

      // Validate price (optional - ensures frontend hasn't been tampered with)
      if (Math.abs(item.unitPrice - productData.finalPrice) > 0.01) {
        throw new BadRequestException(
          `Price mismatch for product "${productData.product.name}". Expected: ${productData.finalPrice}, Received: ${item.unitPrice}`,
        );
      }
    }
  }

  /**
   * Update stock quantities for all order items
   */
  private async updateStockForOrderItems(
    items: CreateOrderItemDto[],
  ): Promise<void> {
    for (const item of items) {
      // Get product info from variant
      const productData = await this.productsService.getProductFromVariant(
        item.variantId,
      );

      await this.productsService.updateProductStock(
        productData.product.id,
        item.variantId,
        item.quantity,
      );
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    userId?: string,
  ): Promise<{
    data: Order[];
    meta: { total: number; page: number; limit: number };
  }> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    if (userId) {
      query.where('user.id = :userId', { userId });
    }

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'payment', 'voucher'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
  async findByOrderNumber(orderNumber: string) {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'items.product', 'payment', 'voucher'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    Object.assign(order, updateOrderDto);

    return await this.orderRepository.save(order);
  }
  async updateStatus(id: string, status: OrderStatus, notes?: string) {
    const order = await this.findOne(id);

    order.status = status;
    if (notes) {
      order.note = notes;
    }

    return await this.orderRepository.save(order);
  }
  /**
   * Update payment status of an order (internal method for payment processing)
   * @param id Order ID
   * @param isPaid Payment status
   * @param paidAt Payment date (optional, defaults to current date if isPaid is true)
   * @returns Updated order
   */
  async updatePaymentStatus(
    id: string,
    isPaid: boolean,
    paidAt?: Date,
  ): Promise<Order> {
    const order = await this.findOne(id);

    order.isPaid = isPaid;
    if (isPaid && !paidAt) {
      order.paidAt = new Date();
    } else if (paidAt) {
      order.paidAt = paidAt;
    } else if (!isPaid) {
      (order.paidAt as any) = null; // Reset payment timestamp when payment is cancelled
    }

    return await this.orderRepository.save(order);
  }

  /**
   * Update completion timestamp for an order
   * @param id Order ID
   * @returns Updated order
   */
  async updateCompletionTimestamp(id: string): Promise<Order> {
    const order = await this.findOne(id);
    order.completedAt = new Date();
    return await this.orderRepository.save(order);
  }

  /**
   * Update cancellation timestamp for an order
   * @param id Order ID
   * @returns Updated order
   */
  async updateCancellationTimestamp(id: string): Promise<Order> {
    const order = await this.findOne(id);
    order.canceledAt = new Date();
    return await this.orderRepository.save(order);
  }

  async cancelOrder(id: string, reason?: string) {
    const order = await this.findOne(id);

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot cancel this order');
    }

    order.status = OrderStatus.CANCELLED;
    if (reason) {
      order.note = reason;
    }

    // Handle refund if payment was made
    if (order.payment?.status === PaymentStatus.PAID) {
      // Note: This would require a refund method in PaymentsService
      // For now, we'll just log it as this method doesn't exist
      console.log(`Refund needed for payment ${order.payment.id}`);
    }

    return await this.orderRepository.save(order);
  }
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${timestamp.slice(-8)}${random}`;
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    return await this.orderRepository.remove(order);
  }
  async getOrderDetails(id: string) {
    return await this.findOne(id);
  }
  /**
   * Find orders for a specific user with pagination
   */
  async findUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: OrderStatus,
  ): Promise<{
    data: Order[];
    meta: { total: number; page: number; limit: number };
  }> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    const [orders, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Find a single order and verify user ownership
   */ async findOneForUser(id: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['items', 'items.product', 'payment', 'user', 'voucher'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
  /**
   * Cancel order with user verification
   */
  async cancelOrderForUser(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<Order> {
    const order = await this.findOneForUser(id, userId);

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot cancel this order');
    }

    order.status = OrderStatus.CANCELLED;
    order.canceledAt = new Date();
    if (reason) {
      order.note = reason;
    }

    // Handle refund and stock restoration if payment was made
    if (order.payment?.status === PaymentStatus.PAID) {
      // If payment was successful, we need to restore stock when order is cancelled
      this.logger.log(`Restoring stock for cancelled paid order ${order.id}`);
      await this.restoreStockForFailedPayment(order.id);

      // Note: This would require a refund method in PaymentsService
      console.log(`Refund needed for payment ${order.payment.id}`);
    }
    // If order was cancelled before payment completion, no stock restoration needed
    // since stock wasn't decremented yet

    return await this.orderRepository.save(order);
  }
  /**
   * Update stock quantities for order items (called after successful payment)
   */
  async updateStockForSuccessfulPayment(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.variant'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    if (!order.items || order.items.length === 0) {
      throw new BadRequestException(`Order ${orderId} has no items`);
    }

    // Update stock for each order item
    for (const item of order.items) {
      // Get product info from variant
      const productData = await this.productsService.getProductFromVariant(
        item.variant.id,
      );

      await this.productsService.updateProductStock(
        productData.product.id,
        item.variant.id,
        item.quantity,
      );
    }
  }

  /**
   * Restore stock quantities for order items (called when payment fails/cancelled)
   */
  async restoreStockForFailedPayment(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.variant'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    if (!order.items || order.items.length === 0) {
      return; // No items to restore
    }

    // Only restore stock if the order was created but payment failed
    // This prevents double restoration
    if (
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.CANCELLED
    ) {
      // Restore stock for each order item
      for (const item of order.items) {
        const productData = await this.productsService.getProductFromVariant(
          item.variant.id,
        );

        await this.productsService.restoreProductStock(
          productData.product.id,
          item.variant.id,
          item.quantity,
        );
      }
    }
  }

  /**
   * Find all orders for admin with advanced filtering
   */
  async findAllForAdmin(filters: {
    page: number;
    limit: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.shipping', 'shipping')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('order.voucher', 'voucher');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', {
        status: filters.status,
      });
    }

    if (
      filters.paymentStatus &&
      filters.paymentStatus !== PaymentStatus.PENDING
    ) {
      queryBuilder.andWhere('payment.status = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (filters.page - 1) * filters.limit;
    queryBuilder.skip(skip).take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
      },
    };
  }

  /**
   * Find one order for admin (full details)
   */
  async findOneForAdmin(id: string) {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.shipping', 'shipping')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.color', 'color')
      .leftJoinAndSelect('variant.size', 'size')
      .leftJoinAndSelect('order.voucher', 'voucher')
      .where('order.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
  /**
   * Update order status for admin
   */
  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.findOneForAdmin(id);

    order.status = status;
    if (status === OrderStatus.CANCELLED) {
      order.canceledAt = new Date();
    } else if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    return await this.orderRepository.save(order);
  }

  /**
   * Get order statistics for admin dashboard
   */
  async getOrderStats() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total orders
    const totalOrders = await this.orderRepository.count();

    // Orders by status
    const ordersByStatus = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    // Today's orders
    const todayOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startOfDay', { startOfDay })
      .getCount();

    // This week's orders
    const weekOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startOfWeek', { startOfWeek })
      .getCount();

    // This month's orders
    const monthOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startOfMonth', { startOfMonth })
      .getCount();

    // Revenue statistics
    const revenueStats = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'totalRevenue')
      .addSelect('AVG(order.totalAmount)', 'averageOrderValue')
      .where('order.status != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .getRawOne();

    // Monthly revenue
    const monthlyRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt >= :startOfMonth', { startOfMonth })
      .andWhere('order.status != :cancelledStatus', {
        cancelledStatus: OrderStatus.CANCELLED,
      })
      .getRawOne();

    return {
      totalOrders,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      periodStats: {
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
      },
      revenue: {
        total: parseFloat(revenueStats.totalRevenue) || 0,
        average: parseFloat(revenueStats.averageOrderValue) || 0,
        monthly: parseFloat(monthlyRevenue.revenue) || 0,
      },
    };
  }

  /**
   * Export orders to CSV format
   */
  async exportOrders(filters: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('order.shipping', 'shipping');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', {
        status: filters.status,
      });
    }

    if (filters.paymentStatus) {
      queryBuilder.andWhere('payment.status = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('order.createdAt <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }

    const orders = await queryBuilder.getMany();

    // Convert to CSV format
    const headers = [
      'Order Number',
      'Customer Email',
      'Customer Name',
      'Status',
      'Payment Status',
      'Total Amount',
      'Created At',
      'Shipping Address',
    ];
    const rows = orders.map((order) => [
      order.orderNumber,
      order.user?.email || 'Guest',
      order.user ? order.user.fullName : order.customerName,
      order.status,
      order.payment?.status || 'N/A',
      order.totalPrice.toString(),
      order.createdAt.toISOString(),
      order.shipping
        ? `${order.shipping.address}, ${order.shipping.ward}, ${order.shipping.district}, ${order.shipping.province}`
        : 'N/A',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Handle abandoned orders (orders without successful payment after threshold time)
   */
  async handleAbandonedOrders(thresholdMinutes: number = 60): Promise<number> {
    this.logger.log(
      `Checking for abandoned orders older than ${thresholdMinutes} minutes`,
    );

    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - thresholdMinutes);

    // Find pending orders without successful payment older than threshold
    const abandonedOrders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.createdAt < :thresholdDate', { thresholdDate })
      .andWhere('(payment.id IS NULL OR payment.status != :paidStatus)', {
        paidStatus: PaymentStatus.PAID,
      })
      .getMany();

    this.logger.log(`Found ${abandonedOrders.length} abandoned orders`);

    let handled = 0;
    for (const order of abandonedOrders) {
      try {
        // Cancel the order
        order.status = OrderStatus.CANCELLED;
        order.canceledAt = new Date();
        order.note = `Cancelled automatically: Order abandoned for more than ${thresholdMinutes} minutes`;

        await this.orderRepository.save(order);

        // Note: No need to restore stock since we didn't decrement it during order creation
        this.logger.log(`Cancelled abandoned order ${order.id}`);
        handled++;
      } catch (error) {
        this.logger.error(
          `Failed to cancel abandoned order ${order.id}:`,
          error,
        );
      }
    }

    this.logger.log(`Successfully handled ${handled} abandoned orders`);
    return handled;
  }

  /**
   * Cancel order for admin with reason
   */ async cancelOrderForAdmin(id: string, reason?: string): Promise<Order> {
    const order = await this.findOneForAdmin(id);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    const originalStatus = order.status;
    order.status = OrderStatus.CANCELLED;
    order.canceledAt = new Date();
    if (reason) {
      order.note = order.note
        ? `${order.note}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }

    await this.orderRepository.save(order);

    // Restore stock if order was being processed
    if (originalStatus === OrderStatus.PROCESSING) {
      await this.restoreStockForFailedPayment(id);
    }

    return order;
  }

  /**
   * Bulk update orders
   */
  async bulkUpdateOrders(
    orderIds: string[],
    updateData: { status?: OrderStatus; note?: string },
  ): Promise<{ updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const orderId of orderIds) {
      try {
        const order = await this.findOneForAdmin(orderId);

        if (updateData.status) {
          order.status = updateData.status;
        }

        if (updateData.note) {
          order.note = order.note
            ? `${order.note}\n\n${updateData.note}`
            : updateData.note;
        }

        await this.orderRepository.save(order);
        updated++;
      } catch (error) {
        this.logger.error(`Failed to update order ${orderId}:`, error);
        failed.push(orderId);
      }
    }

    return { updated, failed };
  }

  async createSimpleOrder(createOrderDto: CreateSimpleOrderDto) {
    try {
      this.logger.log('Creating simple order:', createOrderDto);

      // Validate order items and check stock
      await this.validateOrderItems(createOrderDto.items);

      // Validate voucher if provided
      let appliedVoucher: Voucher | null = null;
      if (createOrderDto.voucherId) {
        const voucherValidation = await this.vouchersService.validateVoucher(
          createOrderDto.voucherId,
          createOrderDto.subTotal,
        );

        if (!voucherValidation.isValid) {
          throw new BadRequestException(
            `Voucher validation failed: ${voucherValidation.error}`,
          );
        }

        appliedVoucher = voucherValidation.voucher;
      }

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create order entity
      const order = this.orderRepository.create({
        orderNumber,
        user: createOrderDto.userId ? { id: createOrderDto.userId } : null,

        // Customer information
        customerName: createOrderDto.customerName,
        customerEmail: createOrderDto.customerEmail,
        customerPhone: createOrderDto.customerPhone,

        // Simplified shipping - store as single address field
        recipientName: createOrderDto.customerName,
        recipientPhone: createOrderDto.customerPhone,
        streetAddress: createOrderDto.shippingAddress,
        ward: 'N/A',
        district: 'N/A',
        province: 'N/A',
        wardCode: '00000',
        districtId: 0,
        provinceId: 0,

        // Order details
        notes: createOrderDto.note || '',
        subTotal: createOrderDto.subTotal,
        shippingFee: createOrderDto.shippingFee || 0,
        discount: createOrderDto.discount || 0,
        totalPrice: createOrderDto.totalPrice,

        // Status
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        isPaid: false,

        // Voucher
        voucher: appliedVoucher,

        // Order items
        items: createOrderDto.items.map((item) => ({
          variant: { id: item.variantId },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      });

      const savedOrder = await this.orderRepository.save(order);

      // If voucher was applied, mark it as used
      if (appliedVoucher) {
        await this.vouchersService.markVoucherAsUsed(
          appliedVoucher.id,
          savedOrder.id,
        );
      }

      this.logger.log(
        `Simple order created successfully: ${savedOrder.orderNumber}`,
      );
      return savedOrder;
    } catch (error) {
      this.logger.error('Failed to create simple order:', error);
      throw error;
    }
  }

  /**
   * Reserve stock for order items temporarily to prevent overselling
   * This should be called during order creation to lock inventory
   */
  async reserveStockForOrder(items: CreateOrderItemDto[]): Promise<void> {
    this.logger.log('Reserving stock for order items');

    for (const item of items) {
      try {
        // Check if stock is available and reserve it atomically
        const result = await this.variantRepository
          .createQueryBuilder()
          .update('ProductVariant')
          .set({
            stockQuantity: () => `stock_quantity - ${item.quantity}`,
            reservedQuantity: () =>
              `COALESCE(reserved_quantity, 0) + ${item.quantity}`,
          })
          .where('id = :variantId', { variantId: item.variantId })
          .andWhere('stock_quantity >= :quantity', { quantity: item.quantity })
          .execute();

        if (result.affected === 0) {
          // Get current stock for error message
          const variant = await this.variantRepository.findOne({
            where: { id: item.variantId },
            relations: ['product'],
          });

          const productName = variant?.product?.name || 'Unknown Product';
          throw new BadRequestException(
            `Insufficient stock for "${productName}". Available: ${variant?.stockQuantity || 0}, Requested: ${item.quantity}`,
          );
        }
      } catch (error) {
        // If stock reservation fails, rollback any previously reserved items
        await this.rollbackStockReservation(
          items.slice(0, items.indexOf(item)),
        );
        throw error;
      }
    }
  }

  /**
   * Rollback stock reservation in case of failure
   */
  private async rollbackStockReservation(
    items: CreateOrderItemDto[],
  ): Promise<void> {
    this.logger.warn('Rolling back stock reservations due to failure');

    for (const item of items) {
      await this.variantRepository
        .createQueryBuilder()
        .update('ProductVariant')
        .set({
          stockQuantity: () => `stock_quantity + ${item.quantity}`,
          reservedQuantity: () =>
            `GREATEST(COALESCE(reserved_quantity, 0) - ${item.quantity}, 0)`,
        })
        .where('id = :variantId', { variantId: item.variantId })
        .execute();
    }
  }

  /**
   * Confirm stock reduction after successful payment
   */
  async confirmStockReduction(orderId: string): Promise<void> {
    this.logger.log(`Confirming stock reduction for order ${orderId}`);

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.variant'],
    });

    if (!order?.items) {
      throw new NotFoundException(`Order ${orderId} not found or has no items`);
    }

    for (const item of order.items) {
      // Remove from reserved quantity (stock was already deducted during reservation)
      await this.variantRepository
        .createQueryBuilder()
        .update('ProductVariant')
        .set({
          reservedQuantity: () =>
            `GREATEST(COALESCE(reserved_quantity, 0) - ${item.quantity}, 0)`,
        })
        .where('id = :variantId', { variantId: item.variant.id })
        .execute();
    }
  }

  /**
   * Release reserved stock if payment fails or order is cancelled
   */
  async releaseReservedStock(orderId: string): Promise<void> {
    this.logger.log(`Releasing reserved stock for order ${orderId}`);

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.variant'],
    });

    if (!order?.items) {
      throw new NotFoundException(`Order ${orderId} not found or has no items`);
    }

    for (const item of order.items) {
      // Restore stock and remove from reserved
      await this.variantRepository
        .createQueryBuilder()
        .update('ProductVariant')
        .set({
          stockQuantity: () => `stock_quantity + ${item.quantity}`,
          reservedQuantity: () =>
            `GREATEST(COALESCE(reserved_quantity, 0) - ${item.quantity}, 0)`,
        })
        .where('id = :variantId', { variantId: item.variant.id })
        .execute();
    }
  }
}
