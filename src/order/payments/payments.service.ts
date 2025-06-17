import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from 'src/product/products/products.service';
import { SimplePayPalService } from './services/simple-paypal.service';
import { Order } from '../orders/entities/order.entity';

interface CreatePaymentDto {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  note?: string;
}

interface PayPalOrderResponse {
  paypalOrderId: string;
  status: string;
  orderId: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly paypalService: SimplePayPalService,
  ) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment | PayPalOrderResponse> {
    try {
      // Verify order exists
      const order = await this.ordersService.findOne(createPaymentDto.orderId);
      if (!order) {
        throw new NotFoundException(
          `Order with ID ${createPaymentDto.orderId} not found`,
        );
      }

      // Check if payment already exists for this order
      const existingPayment = await this.paymentRepository.findOne({
        where: { order: { id: createPaymentDto.orderId } },
      });

      if (existingPayment) {
        throw new BadRequestException('Payment already exists for this order');
      }

      // Handle PayPal payment
      if (createPaymentDto.method === PaymentMethod.PAYPAL) {
        return await this.createPayPalOrder(createPaymentDto);
      } // Handle other payment methods (COD, Bank Transfer)
      const payment = this.paymentRepository.create({
        order: { id: createPaymentDto.orderId },
        method: createPaymentDto.method,
        amount: createPaymentDto.amount,
        status:
          createPaymentDto.method === PaymentMethod.COD
            ? PaymentStatus.PENDING
            : PaymentStatus.PAID,
        note: createPaymentDto.note,
        transactionId: this.generateTransactionId(),
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Update order payment status
      const isPaid = savedPayment.status === PaymentStatus.PAID;
      await this.ordersService.updatePaymentStatus(
        createPaymentDto.orderId,
        isPaid,
      );

      // If payment is completed, update stock
      if (savedPayment.status === PaymentStatus.PAID) {
        await this.updateStockAfterPayment(order);
      }

      return savedPayment;
    } catch (error) {
      this.logger.error('Failed to create payment:', error);
      throw error;
    }
  }

  private async createPayPalOrder(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PayPalOrderResponse> {
    try {
      const paypalOrder = await this.paypalService.createOrder({
        amount: createPaymentDto.amount,
        currency: 'USD', // Convert VND to USD if needed
        orderId: createPaymentDto.orderId,
      });

      // Create pending payment record
      const payment = this.paymentRepository.create({
        order: { id: createPaymentDto.orderId },
        method: PaymentMethod.PAYPAL,
        amount: createPaymentDto.amount,
        status: PaymentStatus.PENDING,
        note: createPaymentDto.note,
        transactionId: paypalOrder.paypalOrderId,
      });

      await this.paymentRepository.save(payment);

      return paypalOrder;
    } catch (error) {
      this.logger.error('Failed to create PayPal order:', error);
      throw new BadRequestException('Failed to create PayPal order');
    }
  }

  async capturePayPalPayment(paypalOrderId: string, orderId: string) {
    try {
      // Capture PayPal payment
      const captureResult = await this.paypalService.captureOrder({
        paypalOrderId,
        orderId,
      }); // Update payment status
      const payment = await this.paymentRepository.findOne({
        where: {
          transactionId: paypalOrderId,
          order: { id: orderId },
        },
        relations: ['order', 'order.items', 'order.items.variant'],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      payment.status = PaymentStatus.PAID;
      payment.note = `PayPal captured: ${JSON.stringify(captureResult)}`;

      await this.paymentRepository.save(payment);

      // Update order payment status
      await this.ordersService.updatePaymentStatus(orderId, true);

      // Update stock after successful payment
      await this.updateStockAfterPayment(payment.order);

      return {
        paymentId: payment.id,
        status: payment.status,
        captureResult,
      };
    } catch (error) {
      this.logger.error('Failed to capture PayPal payment:', error);
      throw error;
    }
  }
  private async updateStockAfterPayment(order: Order) {
    try {
      if (!order.items) {
        this.logger.warn(`Order ${order.id} has no items`);
        return;
      }

      for (const item of order.items) {
        if (item.variant && item.variant.id) {
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
      this.logger.log(`Stock updated for order ${order.id}`);
    } catch (error) {
      this.logger.error('Failed to update stock after payment:', error);
      throw error;
    }
  }

  async findByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }

  private generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
