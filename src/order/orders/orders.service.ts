import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from '../order-items/entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Shipping } from '../shippings/entities/shipping.entity';
import { User } from '../../user/users/entities/user.entity';
import { Voucher } from '../../promotion/vouchers/entities/voucher.entity';
import { ProductVariant } from '../../product/variants/entities/variant.entity';
import { CreateOrderDto } from './dto/requests/create-order.dto';
import { OrderStatus } from '../../common/constants/order-status.enum';
import { PaymentMethod } from '../../common/constants/payment-method.enum';
import { PaymentStatus } from '../../common/constants/payment-status.enum';
import { ShippingStatus } from '../../common/constants/shipping-status.enum';
import { ShippingMethod } from '../../common/constants/shipping-method.enum';
import { PayPalService } from '../payments/services/paypal.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    private paypalService: PayPalService,
  ) {}
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    this.logger.log(
      'Creating order with data:',
      JSON.stringify(createOrderDto, null, 2),
    );

    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items,
        subTotal,
        shippingFee,
        discount,
        totalPrice,
        note,
        userId,
        voucherId,
        voucherCode,
        paymentMethod,
      } = createOrderDto;

      this.logger.log('Validating user...');
      // Validate user if provided
      let user: User | null = null;
      if (userId) {
        user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException(
            `Không tìm thấy người dùng với ID: ${userId}`,
          );
        }
      }

      this.logger.log('Validating voucher...');
      // Validate voucher if provided
      let voucher: Voucher | null = null;
      if (voucherId) {
        voucher = await this.voucherRepository.findOne({
          where: { id: voucherId },
        });
        if (!voucher) {
          throw new NotFoundException(
            `Không tìm thấy voucher với ID: ${voucherId}`,
          );
        }
      }
      this.logger.log('Validating variants and stock...');
      // Validate variants and check stock
      const validatedItems: Array<{
        variant: ProductVariant;
        quantity: number;
        unitPrice: number;
      }> = [];

      for (const item of items) {
        this.logger.log(`Checking variant: ${item.variantId}`);

        const variant = await this.variantRepository.findOne({
          where: { id: item.variantId },
          relations: ['product', 'color', 'size'],
        });

        if (!variant) {
          this.logger.error(`Variant not found: ${item.variantId}`);
          throw new NotFoundException(
            `Không tìm thấy variant với ID: ${item.variantId}`,
          );
        }

        this.logger.log(
          `Variant found: ${variant.sku}, stock: ${variant.stockQuantity}`,
        );

        if (variant.stockQuantity < item.quantity) {
          this.logger.error(
            `Insufficient stock for variant: ${item.variantId}`,
          );
          throw new BadRequestException(
            `Không đủ hàng trong kho cho sản phẩm ${variant.product?.name}. ` +
              `Còn lại: ${variant.stockQuantity}, yêu cầu: ${item.quantity}`,
          );
        }

        validatedItems.push({
          variant,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }

      this.logger.log('Generating order number...');
      // Generate order number
      const orderNumber = await this.generateOrderNumber();
      this.logger.log('Creating order entity...');
      // For authenticated users, use user info if customer info is not provided
      const finalCustomerName =
        customerName || (user ? user.fullName || user.email : '');
      const finalCustomerEmail = customerEmail || (user ? user.email : '');
      const finalCustomerPhone =
        customerPhone || (user ? user.phoneNumber || '' : '');

      this.logger.log('Order customer info:', {
        finalCustomerName,
        finalCustomerEmail,
        finalCustomerPhone,
        fromUser: !!user,
        originalValues: { customerName, customerEmail, customerPhone },
      });

      // Create order
      const order = this.orderRepository.create({
        orderNumber,
        user,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: finalCustomerPhone,
        shippingAddress,
        subTotal,
        shippingFee,
        discount: discount || 0,
        totalPrice,
        note,
        voucher: voucher || undefined,
        status: OrderStatus.PENDING,
      });

      // Save order first to get ID
      const savedOrder = await this.orderRepository.save(order);
      this.logger.log(`Order saved with ID: ${savedOrder.id}`);

      // Create order items
      const orderItems = validatedItems.map(
        ({ variant, quantity, unitPrice }) =>
          this.orderItemRepository.create({
            order: savedOrder,
            variant,
            quantity,
            unitPrice,
            productName: variant.product?.name || 'Unknown Product',
            variantSku: variant.sku,
            colorName: variant.color?.name || 'Unknown Color',
            sizeName: variant.size?.name || 'Unknown Size',
          }),
      );
      await this.orderItemRepository.save(orderItems);
      this.logger.log('Order items saved');

      // Create payment record
      const paymentMethodEnum =
        paymentMethod === PaymentMethod.PAYPAL
          ? PaymentMethod.PAYPAL
          : PaymentMethod.COD;

      this.logger.log(
        `Creating payment record for order ${savedOrder.id} with method: ${paymentMethodEnum}`,
      );

      const payment = this.paymentRepository.create({
        order: savedOrder,
        method: paymentMethodEnum,
        amount: totalPrice,
        status: PaymentStatus.UNPAID,
      });

      const savedPayment = await this.paymentRepository.save(payment);
      this.logger.log(
        `✅ Payment record created successfully - ID: ${savedPayment.id}, Method: ${paymentMethodEnum}, Order: ${savedOrder.id}`,
      );

      // Create shipping record
      const shipping = this.shippingRepository.create({
        order: savedOrder,
        recipientName: finalCustomerName,
        recipientPhone: finalCustomerPhone,
        address: shippingAddress,
        shippingFee,
        status: ShippingStatus.PENDING,
        // Default values for required fields
        wardCode: '',
        districtId: 0,
        provinceId: 0,
        ward: '',
        district: '',
        province: '',
        shippingMethod: ShippingMethod.STANDARD,
      });

      await this.shippingRepository.save(shipping);
      this.logger.log('Shipping record created');

      // Update variant stock
      for (const { variant, quantity } of validatedItems) {
        variant.stockQuantity -= quantity;
        await this.variantRepository.save(variant);
      }
      this.logger.log('Variant stock updated');

      // Return order with relations
      return this.findOrderById(savedOrder.id);
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  async findOrderById(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.color',
        'items.variant.size',
        'payment',
        'shipping',
        'voucher',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    return order;
  }

  async findOrderByNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: [
        'user',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.color',
        'items.variant.size',
        'payment',
        'shipping',
        'voucher',
      ],
    });

    if (!order) {
      throw new NotFoundException(
        `Không tìm thấy đơn hàng với số: ${orderNumber}`,
      );
    }

    return order;
  }

  async findOrdersByUser(userId: string, page = 1, limit = 10) {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'payment',
        'shipping',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOrderById(id);

    order.status = status;

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      order.canceledAt = new Date();
      // Restore stock if cancelled
      for (const item of order.items) {
        item.variant.stockQuantity += item.quantity;
        await this.variantRepository.save(item.variant);
      }
    }

    return this.orderRepository.save(order);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Count orders today
    const startOfDay = new Date(year, date.getMonth(), date.getDate());
    const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
    const count = await this.orderRepository.count({
      where: {
        createdAt: MoreThanOrEqual(startOfDay) && LessThan(endOfDay),
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `ORD${year}${month}${day}${sequence}`;
  }
  async createOrderWithPayPal(createOrderDto: CreateOrderDto): Promise<{
    order: Order;
    approvalUrl: string;
  }> {
    this.logger.log(
      'Creating PayPal order with data:',
      JSON.stringify(createOrderDto, null, 2),
    );

    try {
      this.logger.log('=== Step 1: Creating internal order ===');
      // First create the order (same as regular order but with PayPal payment method)
      const order = await this.createOrder({
        ...createOrderDto,
        // Force PayPal payment method
      });

      this.logger.log(
        `=== Step 2: Order created successfully with ID: ${order.id} ===`,
      );

      this.logger.log('=== Step 3: Creating PayPal order ===');
      // Create PayPal order
      const paypalOrder = await this.paypalService.createOrder(
        order.totalPrice,
        'VND',
        order.id,
      );

      this.logger.log(
        `=== Step 4: PayPal order created: ${paypalOrder.id} ===`,
      );

      // Update the payment record with PayPal transaction ID
      const payment = await this.paymentRepository.findOne({
        where: { order: { id: order.id } },
      });

      if (payment) {
        payment.transactionId = paypalOrder.id;
        payment.status = PaymentStatus.PENDING;
        await this.paymentRepository.save(payment);
        this.logger.log(
          `Payment updated with PayPal transaction ID: ${paypalOrder.id}`,
        );
      }

      // Get approval URL from PayPal response
      const approvalLink = paypalOrder.links?.find(
        (link) => link.rel === 'approve',
      );

      if (!approvalLink) {
        throw new Error('Không thể lấy link thanh toán PayPal');
      }

      this.logger.log(`PayPal approval URL: ${approvalLink.href}`);

      return {
        order,
        approvalUrl: approvalLink.href,
      };
    } catch (error) {
      this.logger.error('PayPal order creation failed:', error);

      // If we have an order ID, cancel it
      if (error.order?.id) {
        await this.orderRepository.update(error.order.id, {
          status: OrderStatus.CANCELLED,
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Không thể tạo đơn hàng PayPal: ${errorMessage}`);
    }
  }
}
