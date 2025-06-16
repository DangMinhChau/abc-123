import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class OrderExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OrderExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { method, url } = request;
    let status = 500;
    let message = 'Internal server error';
    let details: unknown = null;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : message;
        details = responseObj.details ?? null;
      }
    }

    // Log error
    this.logger.error(
      `Order API Error: ${method} ${url} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    ); // Order-specific error messages
    const orderErrorMessages: Record<string, string> = {
      'Order not found': 'Không tìm thấy đơn hàng',
      'Payment failed': 'Thanh toán thất bại',
      'Order cannot be cancelled': 'Đơn hàng không thể hủy',
      'Invalid order status transition':
        'Chuyển trạng thái đơn hàng không hợp lệ',
    };

    const localizedMessage = orderErrorMessages[message] || message;

    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url || '',
      method: request.method || '',
      message: localizedMessage,
    };

    if (details !== null) {
      errorResponse.details = details;
    }

    response.status(status).json(errorResponse);
  }
}
