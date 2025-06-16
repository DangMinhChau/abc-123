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

@Injectable()
export class SimpleLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SimpleLoggingInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startTime = Date.now();

    // Log ngay khi request đến
    console.log('🚀 ========== SIMPLE INTERCEPTOR WORKING ==========');
    console.log(`📥 ${request.method} ${request.url}`);
    console.log(`🕐 Time: ${new Date().toISOString()}`);
    this.logger.log(`📥 ${request.method} ${request.url} - START`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          console.log(
            `📤 ${request.method} ${request.url} - ${response.statusCode} - ${duration}ms`,
          );
          this.logger.log(
            `📤 ${request.method} ${request.url} - ${response.statusCode} - ${duration}ms`,
          );
          console.log('✅ ========== SIMPLE INTERCEPTOR END ==========');
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          console.log(
            `❌ ${request.method} ${request.url} - ERROR - ${duration}ms`,
          );
          this.logger.error(
            `❌ ${request.method} ${request.url} - ERROR - ${duration}ms`,
          );
          console.log(`❌ Error: ${error.message}`);
          console.log('❌ ========== SIMPLE INTERCEPTOR ERROR ==========');
        },
      }),
    );
  }
}
