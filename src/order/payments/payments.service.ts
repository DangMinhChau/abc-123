import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { OrderStatus } from 'src/common/constants/order-status.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async createPayment(
    order: Order,
    method: PaymentMethod,
    amount: number,
  ): Promise<Payment> {
    const payment = this.paymentRepository.create({
      order,
      method,
      amount,
      status: PaymentStatus.PENDING,
    });

    return this.paymentRepository.save(payment);
  }

  async updatePaymentWithPayPalOrder(
    orderId: string,
    paypalOrderId: string,
    amount: number,
  ): Promise<Payment> {
    // Find order first
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }

    let payment = order.payment;

    if (!payment) {
      // Create new payment if not exists
      payment = this.paymentRepository.create({
        order,
        method: PaymentMethod.PAYPAL,
        amount,
        status: PaymentStatus.PENDING,
        transactionId: paypalOrderId,
      });
    } else {
      // Update existing payment
      payment.method = PaymentMethod.PAYPAL;
      payment.amount = amount;
      payment.status = PaymentStatus.PENDING;
      payment.transactionId = paypalOrderId;
    }

    return this.paymentRepository.save(payment);
  }
  async updatePaymentAfterCapture(
    orderId: string,
    paypalOrderId: string,
    captureResult: any,
  ): Promise<Payment> {
    console.log(`=== Debug: Looking for order ${orderId} ===`);

    // First check if order exists at all
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    console.log('Order found (without relations):', !!order);

    if (!order) {
      console.log('❌ Order not found in database');
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${orderId}`);
    }

    // Now check with payment relation
    const orderWithPayment = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });

    console.log('Order with payment relation:', {
      hasOrder: !!orderWithPayment,
      hasPayment: !!orderWithPayment?.payment,
      paymentId: orderWithPayment?.payment?.id,
      paymentMethod: orderWithPayment?.payment?.method,
    });
    if (!orderWithPayment || !orderWithPayment.payment) {
      // Try to find payment separately
      const payments = await this.paymentRepository.find({
        where: { order: { id: orderId } },
      });

      console.log('Payments found separately:', payments.length);
      console.log(
        'Payment details:',
        payments.map((p) => ({
          id: p.id,
          method: p.method,
          status: p.status,
        })),
      );

      if (payments.length === 0) {
        throw new NotFoundException(
          `Không tìm thấy thanh toán cho đơn hàng: ${orderId}`,
        );
      } // Use the first payment found
      const payment = payments[0];
      console.log('✅ Using payment found separately:', payment.id);

      if (captureResult.status === 'COMPLETED') {
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();

        // Update order status and payment info - orderWithPayment is guaranteed to exist here
        if (orderWithPayment) {
          orderWithPayment.isPaid = true;
          orderWithPayment.paidAt = new Date();
          orderWithPayment.status = OrderStatus.PROCESSING; // Move to processing after payment
        }

        // Get capture ID if available
        const captureId =
          captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id;
        if (captureId) {
          payment.transactionId = paypalOrderId;
          // Note: metadata property might not exist on Payment entity, storing in transactionId instead
        }

        // Save both payment and order
        await this.paymentRepository.save(payment);
        if (orderWithPayment) {
          await this.orderRepository.save(orderWithPayment);
        }

        console.log('✅ Payment and order updated successfully');
        return payment;
      } else {
        throw new BadRequestException(
          `PayPal capture không thành công: ${captureResult.status}`,
        );
      }
    }

    const payment = orderWithPayment.payment;

    if (captureResult.status === 'COMPLETED') {
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();

      // Update order status and payment info
      order.isPaid = true;
      order.paidAt = new Date();
      order.status = OrderStatus.PROCESSING; // Move to processing after payment

      // Get capture ID if available
      const captureId =
        captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      if (captureId) {
        payment.note = `PayPal Capture ID: ${captureId}`;
      }
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.note = `PayPal payment failed: ${captureResult.status}`;
    }

    await this.orderRepository.save(order);
    return this.paymentRepository.save(payment);
  }

  async updatePaymentStatus(orderId: string, status: string): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });

    if (!order || !order.payment) {
      throw new NotFoundException(
        `Không tìm thấy thanh toán cho đơn hàng: ${orderId}`,
      );
    }

    const payment = order.payment;

    // Map string status to enum
    switch (status.toUpperCase()) {
      case 'PAID':
        payment.status = PaymentStatus.PAID;
        payment.paidAt = new Date();
        order.isPaid = true;
        order.paidAt = new Date();
        break;
      case 'FAILED':
        payment.status = PaymentStatus.FAILED;
        break;
      case 'CANCELLED':
        payment.status = PaymentStatus.CANCELLED;
        break;
      default:
        payment.status = PaymentStatus.PENDING;
    }

    await this.orderRepository.save(order);
    return this.paymentRepository.save(payment);
  }

  async findPaymentByOrderId(orderId: string): Promise<Payment | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });

    return order?.payment || null;
  }

  async findPaymentByTransactionId(
    transactionId: string,
  ): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { transactionId },
      relations: ['order'],
    });
  }
}
