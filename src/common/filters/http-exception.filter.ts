import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationError {
  field: string;
  message: string;
}

interface ErrorResponse {
  statusCode: number;
  error?: string;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
  path: string;
}

interface ValidationExceptionResponse {
  statusCode: number;
  error: string;
  message: string[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse: ErrorResponse = {
      statusCode,
      message: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (typeof exceptionResponse === 'string') {
      errorResponse.message = exceptionResponse;
    } else if (this.isValidationError(exceptionResponse)) {
      errorResponse.error = exceptionResponse.error || 'Bad Request';
      errorResponse.message = 'Validation failed';
      errorResponse.errors = exceptionResponse.message.map((msg: string) => {
        // Extract field name from validation message
        const fieldMatch = msg.match(/^(\w+)\s/);
        const field = fieldMatch ? fieldMatch[1] : 'unknown';
        return {
          field,
          message: msg,
        };
      });
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      // Handle other types of errors
      Object.assign(errorResponse, exceptionResponse);
    }
    response.status(statusCode).json(errorResponse);
  }

  private isValidationError(
    response: unknown,
  ): response is ValidationExceptionResponse {
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    const obj = response as Record<string, unknown>;
    return Array.isArray(obj.message) && typeof obj.error === 'string';
  }
}
