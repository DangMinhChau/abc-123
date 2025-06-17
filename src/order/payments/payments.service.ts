import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../../notification/notifications/notifications.service';
import { MailService } from '../../common/services/mail/mail.service';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';
import { Order } from '../orders/entities/order.entity';
import { PayPalService } from './services/paypal.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    private readonly paypalService: PayPalService,
  ) {}
  async create(
    createPaymentDto: CreatePaymentDto,
  ): Promise<
    Payment | { paypalOrderId: string; status: string; orderId: string }
  > {
    try {
      const order = await this.ordersService.findOne(createPaymentDto.orderId);

      // Check if order is already paid
      if (order.isPaid) {
        throw new ConflictException('Order has already been paid');
      }

      // Check if active payment already exists for this order
      const existingPayment = await this.paymentRepository.findOne({
        where: {
          order: { id: order.id },
          status: PaymentStatus.PENDING,
        },
      });

      if (existingPayment) {
        // Cancel existing pending payment before creating new one
        existingPayment.status = PaymentStatus.CANCELLED;
        existingPayment.note = 'Cancelled due to new payment creation';
        await this.paymentRepository.save(existingPayment);
      }

      const payment = this.paymentRepository.create({
        order,
        method: createPaymentDto.method,
        amount: createPaymentDto.amount,
        note: createPaymentDto.note,
        status: PaymentStatus.PENDING,
      });
      const savedPayment = await this.paymentRepository.save(payment); // Handle different payment methods
      switch (createPaymentDto.method) {
        case PaymentMethod.PAYPAL:
          return await this.createPayPalPayment(savedPayment, createPaymentDto);
        case PaymentMethod.COD:
        case PaymentMethod.CREDIT_CARD:
          // For COD and CREDIT_CARD, set status to unpaid and return payment
          savedPayment.status = PaymentStatus.UNPAID;
          await this.paymentRepository.save(savedPayment);
          return savedPayment;
        default:
          throw new BadRequestException('Unsupported payment method');
      }
    } catch (error) {
      this.logger.error('Failed to create payment:', error);
      throw error;
    }
  }
  async createPayPalPayment(
    payment: Payment,
    createPaymentDto: CreatePaymentDto,
  ): Promise<{ paypalOrderId: string; status: string; orderId: string }> {
    try {
      const orderId = payment.order.id;
      const amount = payment.amount;

      this.logger.log(
        `Creating PayPal payment for order ${orderId} with amount ${amount} VND`,
      );

      const paypalOrder = await this.paypalService.createOrder({
        orderId,
        amount,
        currency: 'VND', // Will be converted to USD in PayPalService
        description: `Payment for order ${orderId}`,
      });

      // Update payment with PayPal order ID
      await this.paymentRepository.update(payment.id, {
        transactionId: paypalOrder.paypalOrderId,
      });

      this.logger.log(
        `✅ Created PayPal order ${paypalOrder.paypalOrderId} for order ${orderId}`,
      );

      return {
        paypalOrderId: paypalOrder.paypalOrderId,
        status: paypalOrder.status,
        orderId,
      };
    } catch (error) {
      this.logger.error('❌ Error creating PayPal payment:', error);

      // Log more details about the error
      if (error.name) {
        this.logger.error('Error name:', error.name);
      }
      if (error.message) {
        this.logger.error('Error message:', error.message);
      }
      if (error.stack) {
        this.logger.error('Error stack:', error.stack);
      }

      throw new BadRequestException(
        `Failed to create PayPal payment: ${error.message}`,
      );
    }
  }

  async handlePayPalCallback(callbackData: any): Promise<Payment> {
    try {
      const { paypalOrderId, orderId } = callbackData;

      // Capture the PayPal payment
      const captureResult = await this.paypalService.captureOrder({
        paypalOrderId,
      });

      // Find the payment record
      const payment = await this.paymentRepository.findOne({
        where: { order: { id: orderId } },
        relations: ['order'],
      });

      if (!payment) {
        throw new NotFoundException(
          `Payment not found for order ID: ${orderId}`,
        );
      }

      // Update payment status
      const isSuccess = captureResult.status === 'COMPLETED';
      const status = isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED;

      await this.paymentRepository.update(payment.id, {
        status,
        transactionId: captureResult.captureId,
        paidAt: isSuccess ? new Date(captureResult.createTime) : undefined,
      });

      // Update order payment status
      if (isSuccess) {
        this.logger.log(`Marking order ${orderId} as paid`);
        await this.ordersService.updatePaymentStatus(
          payment.order.id,
          true,
          new Date(captureResult.createTime),
        );

        // Update stock quantities
        this.logger.log(
          `Updating stock for order ${orderId} after successful payment`,
        );
        await this.ordersService.updateStockForSuccessfulPayment(
          payment.order.id,
        );

        // Send notifications
        await this.sendPaymentSuccessNotifications(payment.order);
      } else {
        this.logger.log(`PayPal payment failed for order ${orderId}`);
      }

      const updatedPayment = await this.paymentRepository.findOne({
        where: { id: payment.id },
        relations: ['order'],
      });

      if (!updatedPayment) {
        throw new NotFoundException('Updated payment not found');
      }

      return updatedPayment;
    } catch (error) {
      this.logger.error('Error handling PayPal callback:', error);
      throw new BadRequestException('Failed to process PayPal callback');
    }
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Payment[];
    meta: { total: number; page: number; limit: number };
  }> {
    const [payments, total] = await this.paymentRepository.findAndCount({
      relations: ['order', 'order.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);

    Object.assign(payment, updatePaymentDto);

    if (updatePaymentDto.status === PaymentStatus.PAID && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    return await this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  async refund(id: string, reason?: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (!payment.canBeRefunded()) {
      throw new BadRequestException('Payment cannot be refunded');
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.note = reason ? `Refunded: ${reason}` : 'Refunded';

    return await this.paymentRepository.save(payment);
  }

  /**
   * Get payment history for an order
   * @param orderId Order ID to get payment history for
   * @returns Array of payment attempts and their statuses
   */
  async getPaymentHistory(orderId: string): Promise<{
    latest: Payment | null;
    history: Payment[];
  }> {
    // Ensure the order exists using OrdersService
    await this.ordersService.findOne(orderId);

    // Get all payments for this order (even soft-deleted ones)
    const payments = await this.paymentRepository.find({
      where: { order: { id: orderId } },
      withDeleted: true,
      order: { createdAt: 'DESC' },
      relations: ['order'],
    });

    const latest = payments.length > 0 ? payments[0] : null;

    return {
      latest,
      history: payments,
    };
  }

  /**
   * Cancel a pending payment
   * @param id Payment ID to cancel
   * @param reason Reason for cancellation
   * @returns Updated payment entity
   */
  async cancelPayment(id: string, reason?: string): Promise<Payment> {
    const payment = await this.findOne(id);

    // Only pending or unpaid payments can be cancelled
    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.UNPAID
    ) {
      throw new BadRequestException(
        `Payment with status ${payment.status} cannot be cancelled`,
      );
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.note = reason ? `Cancelled: ${reason}` : 'Cancelled by user';

    return await this.paymentRepository.save(payment);
  }

  /**
   * Retry payment for an order (create a new payment for the same order)
   * @param orderId Order ID to retry payment for
   * @param createPaymentDto Payment details   * @returns New payment entity or payment gateway response
   */ async retryPayment(
    orderId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<
    Payment | { paypalOrderId: string; status: string; orderId: string }
  > {
    try {
      // Validate order exists using OrdersService
      const order = await this.ordersService.findOne(orderId);

      // Find existing payments for this order
      const existingPayments = await this.paymentRepository.find({
        where: { order: { id: orderId } },
      });

      // Cancel any existing pending payments
      for (const payment of existingPayments) {
        if (
          payment.status === PaymentStatus.PENDING ||
          payment.status === PaymentStatus.UNPAID
        ) {
          payment.status = PaymentStatus.CANCELLED;
          payment.note = 'Cancelled due to payment retry';
          await this.paymentRepository.save(payment);
        }
      }

      // Create a new payment
      const payment = this.paymentRepository.create({
        order,
        method: createPaymentDto.method,
        amount: createPaymentDto.amount,
        note: `Retry payment. ${createPaymentDto.note || ''}`,
        status: PaymentStatus.PENDING,
      });

      const savedPayment = await this.paymentRepository.save(payment); // Process payment based on method
      switch (createPaymentDto.method) {
        case PaymentMethod.PAYPAL:
          return await this.createPayPalPayment(savedPayment, createPaymentDto);
        case PaymentMethod.COD:
          return savedPayment;
        default:
          throw new BadRequestException('Unsupported payment method');
      }
    } catch (error) {
      this.logger.error(`Failed to retry payment for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Check and handle abandoned payments (payments that were initiated but never completed)
   * @param timeThresholdMinutes Minutes after which a payment is considered abandoned
   * @returns Number of abandoned payments handled
   */
  async handleAbandonedPayments(
    timeThresholdMinutes: number = 30,
  ): Promise<number> {
    this.logger.log(
      `Checking for abandoned payments older than ${timeThresholdMinutes} minutes`,
    );

    // Calculate the threshold date
    const thresholdDate = new Date();
    thresholdDate.setMinutes(thresholdDate.getMinutes() - timeThresholdMinutes);

    // Find pending or unpaid payments older than the threshold
    const abandonedPayments = await this.paymentRepository.find({
      where: [
        { status: PaymentStatus.PENDING, createdAt: LessThan(thresholdDate) },
        { status: PaymentStatus.UNPAID, createdAt: LessThan(thresholdDate) },
      ],
      relations: ['order'],
    });

    this.logger.log(`Found ${abandonedPayments.length} abandoned payments`);

    // Mark each payment as cancelled
    let handled = 0;
    for (const payment of abandonedPayments) {
      try {
        payment.status = PaymentStatus.CANCELLED;
        payment.note = `Cancelled automatically: Payment abandoned for more than ${timeThresholdMinutes} minutes`;
        await this.paymentRepository.save(payment);
        handled++;
      } catch (error) {
        this.logger.error(
          `Failed to cancel abandoned payment ${payment.id}:`,
          error,
        );
      }
    }

    this.logger.log(`Successfully handled ${handled} abandoned payments`);
    return handled;
  }
  /**
   * Process payment callbacks from various payment gateways
   * @param gateway The payment gateway (paypal)
   * @param callbackData Data received from the payment gateway
   * @returns Object with success status, message, and payment details
   */
  async processPaymentCallback(
    gateway: string,
    callbackData: any,
  ): Promise<{ success: boolean; message: string; payment?: Payment }> {
    this.logger.log(`Processing ${gateway} callback`);
    this.logger.debug(JSON.stringify(callbackData));
    try {
      let payment: Payment; // Handle different payment gateways
      switch (gateway.toLowerCase()) {
        case 'paypal':
          payment = await this.handlePayPalCallback(callbackData);
          break;
        default:
          throw new BadRequestException(
            `Unsupported payment gateway: ${gateway}`,
          );
      } // Update order status if payment was successful
      if (payment.status === PaymentStatus.PAID) {
        await this.ordersService.updatePaymentStatus(
          payment.order.id,
          true,
          payment.paidAt,
        );

        return {
          success: true,
          message: 'Payment processed successfully',
          payment,
        };
      } else {
        return {
          success: false,
          message: 'Payment failed or was declined',
          payment,
        };
      }
    } catch (error: unknown) {
      this.logger.error(`Error processing ${gateway} callback:`, error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred while processing the payment';

      return {
        success: false,
        message: errorMessage,
      };
    }
  }
  /**
   * Send payment success notifications (both email and in-app)
   * @param order Order that was paid
   */ private async sendPaymentSuccessNotifications(
    order: Order,
  ): Promise<void> {
    try {
      // Only send notifications if user exists (not a guest order)
      if (order.user) {
        // Send in-app notification
        await this.notificationsService.notifyPaymentStatusChange(
          order.user.id,
          order.id,
          order.orderNumber,
          PaymentStatus.PAID,
        );

        // Send email notification
        await this.mailService.sendOrderStatusUpdateEmail(order.user.email, {
          orderNumber: order.orderNumber,
          customerName: order.user.fullName,
          status: 'paid',
          trackingNumber: order.shipping?.trackingNumber,
        });

        this.logger.log(
          `Payment success notifications sent for order ${order.id}`,
        );
      } else {
        // For guest orders, we could optionally send email to customerEmail
        this.logger.log(
          `Skipping user notifications for guest order ${order.id}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send payment notifications:', error);
      // Don't throw error to prevent notification failure from affecting payment flow
    }
  }
}
