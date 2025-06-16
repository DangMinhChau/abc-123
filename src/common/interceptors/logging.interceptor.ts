import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { getLoggingConfig, LoggingConfig } from './logging.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly config: LoggingConfig;

  constructor() {
    this.config = getLoggingConfig();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      return this.handleHttpRequest(context, next);
    }

    return next.handle();
  }

  private handleHttpRequest(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    // Thông tin về request
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const contentLength = headers['content-length'] || '0';
    const contentType = headers['content-type'] || 'Unknown';

    // Log request với format đẹp
    this.logger.log('');
    this.logger.log(
      '📥 ================== INCOMING REQUEST ==================',
    );
    this.logger.log(`   Method: ${method}`);
    this.logger.log(`   URL: ${url}`);
    this.logger.log(`   IP: ${ip || 'Unknown'}`);
    this.logger.log(`   User-Agent: ${userAgent}`);
    this.logger.log(`   Content-Type: ${contentType}`);
    this.logger.log(`   Content-Length: ${contentLength} bytes`); // Log essential headers trong development mode
    if (this.config.logHeaders) {
      const essentialHeaders = this.getEssentialHeaders(headers);
      if (Object.keys(essentialHeaders).length > 0) {
        this.logger.log('🔧 Essential Headers:');
        Object.entries(essentialHeaders).forEach(([key, value]) => {
          this.logger.log(`   ${key}: ${value}`);
        });
      }
    }

    // Log request body nếu có
    if (
      this.config.logRequestBody &&
      request.body &&
      typeof request.body === 'object' &&
      request.body !== null &&
      Object.keys(request.body as object).length > 0
    ) {
      const sanitizedBody = this.sanitizeRequestBody(
        request.body as Record<string, unknown>,
      );
      this.logger.log('📝 Request Body:');
      this.logger.log(JSON.stringify(sanitizedBody, null, 2));
    }

    // Log query parameters nếu có
    if (
      request.query &&
      typeof request.query === 'object' &&
      Object.keys(request.query).length > 0
    ) {
      this.logger.log('🔍 Query Parameters:');
      Object.entries(request.query).forEach(([key, value]) => {
        this.logger.log(`   ${key}: ${String(value)}`);
      });
    }

    return next.handle().pipe(
      tap({
        next: (responseData: unknown) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;
          const contentLength = response.get('content-length') || 'Unknown';

          // Log response với format đẹp
          this.logger.log(
            '📤 ================== OUTGOING RESPONSE ==================',
          );
          this.logger.log(`   Method: ${method}`);
          this.logger.log(`   URL: ${url}`);
          this.logger.log(
            `   Status: ${this.getStatusIcon(statusCode)} ${statusCode}`,
          );
          this.logger.log(`   Duration: ${duration}ms`);
          this.logger.log(`   Content-Length: ${contentLength} bytes`); // Log essential response headers trong development mode
          if (this.config.logHeaders) {
            const responseHeaders = response.getHeaders();
            const essentialResponseHeaders =
              this.getEssentialResponseHeaders(responseHeaders);
            if (Object.keys(essentialResponseHeaders).length > 0) {
              this.logger.log('🔧 Response Headers:');
              Object.entries(essentialResponseHeaders).forEach(
                ([key, value]) => {
                  this.logger.log(`   ${key}: ${String(value)}`);
                },
              );
            }
          }

          // Log response data trong development mode
          if (this.config.logResponseData && responseData) {
            const sanitizedResponse = this.sanitizeResponseData(responseData);
            this.logger.log('📋 Response Data:');
            this.logger.log(JSON.stringify(sanitizedResponse, null, 2));
          }

          this.logger.log('================================================');
          this.logger.log('');
        },
        error: (error: Error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode || 500;

          this.logger.error('');
          this.logger.error(
            '❌ ================== ERROR RESPONSE ==================',
          );
          this.logger.error(`   Method: ${method}`);
          this.logger.error(`   URL: ${url}`);
          this.logger.error(`   Status: ${statusCode}`);
          this.logger.error(`   Duration: ${duration}ms`);
          this.logger.error(`   Error: ${error.message}`);
          this.logger.error('================================================');
          this.logger.error('');

          if (error.stack) {
            this.logger.error('Stack trace:', error.stack);
          }
        },
      }),
    );
  } /**
   * Lấy những header quan trọng nhất để log
   */
  private getEssentialHeaders(headers: any): Record<string, string> {
    const essential = [
      'authorization',
      'content-type',
      'accept',
      'x-forwarded-for',
      'origin',
      'referer',
    ];

    const result: Record<string, string> = {};

    for (const key of essential) {
      if (headers && typeof headers === 'object' && key in headers) {
        const value = headers[key] as string | string[] | undefined;
        if (value) {
          // Ẩn token trong authorization header
          if (key === 'authorization' && !this.config.logSensitiveData) {
            result[key] = 'Bearer ***HIDDEN***';
          } else {
            result[key] = Array.isArray(value)
              ? value.join(', ')
              : String(value);
          }
        }
      }
    }

    return result;
  }

  /**
   * Lấy những response header quan trọng nhất để log
   */
  private getEssentialResponseHeaders(headers: any): Record<string, string> {
    const essential = [
      'content-type',
      'content-length',
      'set-cookie',
      'cache-control',
      'location',
      'x-powered-by',
    ];

    const result: Record<string, string> = {};

    for (const key of essential) {
      if (headers && typeof headers === 'object' && key in headers) {
        const value = headers[key] as string | number | string[] | undefined;
        if (value !== undefined) {
          if (key === 'set-cookie' && !this.config.logSensitiveData) {
            result[key] = '***HIDDEN***';
          } else {
            result[key] = Array.isArray(value)
              ? value.join(', ')
              : String(value);
          }
        }
      }
    }

    return result;
  }

  /**
   * Trả về icon tương ứng với status code
   */
  private getStatusIcon(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '✅';
    if (statusCode >= 300 && statusCode < 400) return '🔄';
    if (statusCode >= 400 && statusCode < 500) return '⚠️';
    return '❌';
  }

  /**
   * Làm sạch request body để tránh log thông tin nhạy cảm
   * Trong development mode, sẽ log tất cả dữ liệu để debug
   */
  private sanitizeRequestBody(
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    // Nếu config cho phép log dữ liệu nhạy cảm, trả về nguyên bản
    if (this.config.logSensitiveData) {
      return body;
    }

    const sanitized = { ...body };

    for (const field of this.config.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***';
      }
    }

    return sanitized;
  }

  /**
   * Làm sạch response data để tránh log quá nhiều thông tin
   * Trong development mode, sẽ log tất cả dữ liệu để debug
   */
  private sanitizeResponseData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const dataObj = data as Record<string, unknown>;

    // Rút gọn array quá dài dựa trên config
    if (
      dataObj.data &&
      Array.isArray(dataObj.data) &&
      dataObj.data.length > this.config.maxArrayItemsToLog
    ) {
      const maxItems = Math.floor(this.config.maxArrayItemsToLog / 2);
      const firstFew = dataObj.data.slice(0, maxItems) as unknown[];
      return {
        ...dataObj,
        data: [
          ...firstFew,
          `... và ${dataObj.data.length - maxItems} items khác`,
        ],
      };
    }

    // Nếu config cho phép log dữ liệu nhạy cảm, trả về nguyên bản (chỉ rút gọn array)
    if (this.config.logSensitiveData) {
      return data;
    }

    // Loại bỏ các field nhạy cảm từ response
    const sanitized = JSON.parse(JSON.stringify(data)) as Record<
      string,
      unknown
    >;
    this.removeSensitiveFields(sanitized, this.config.sensitiveFields);

    return sanitized;
  }

  /**
   * Đệ quy loại bỏ các field nhạy cảm
   * Chỉ áp dụng khi config không cho phép log dữ liệu nhạy cảm
   */
  private removeSensitiveFields(obj: unknown, sensitiveFields: string[]): void {
    // Nếu config cho phép log dữ liệu nhạy cảm, không làm gì
    if (this.config.logSensitiveData) {
      return;
    }

    if (!obj || typeof obj !== 'object') {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item) => this.removeSensitiveFields(item, sensitiveFields));
      return;
    }

    const objRecord = obj as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (objRecord[field]) {
        objRecord[field] = '***HIDDEN***';
      }
    }

    // Đệ quy cho nested objects
    Object.values(objRecord).forEach((value) => {
      if (typeof value === 'object' && value !== null) {
        this.removeSensitiveFields(value, sensitiveFields);
      }
    });
  }
}
