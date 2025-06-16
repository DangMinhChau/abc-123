import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MysqlErrorCode } from 'src/common/constants/mysql-error-code';
import { QueryFailedError } from 'typeorm';

interface MySqlQueryFailedError extends QueryFailedError {
  code: string;
  errno: number;
  sqlMessage: string;
}

@Catch(QueryFailedError)
export class TypeormExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const error = exception as MySqlQueryFailedError;

    // Map database errors to appropriate HTTP responses
    switch (error.code) {
      case MysqlErrorCode.ER_DUP_ENTRY:
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Dữ liệu đã tồn tại trong hệ thống',
          error: 'Conflict',
          timestamp: new Date().toISOString(),
        });
        break;

      case 'ER_NO_REFERENCED_ROW_2':
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Tham chiếu đến dữ liệu không tồn tại',
          error: 'Bad Request',
          timestamp: new Date().toISOString(),
        });
        break;

      case 'ER_ROW_IS_REFERENCED_2':
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'Không thể xóa do có dữ liệu liên quan',
          error: 'Conflict',
          timestamp: new Date().toISOString(),
        });
        break;

      case 'ER_DATA_TOO_LONG':
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Dữ liệu quá dài cho trường được chỉ định',
          error: 'Bad Request',
          timestamp: new Date().toISOString(),
        });
        break;

      case 'ER_BAD_NULL_ERROR':
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Trường bắt buộc không được để trống',
          error: 'Bad Request',
          timestamp: new Date().toISOString(),
        });
        break;

      case 'ER_PARSE_ERROR':
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Lỗi cú pháp trong truy vấn cơ sở dữ liệu',
          error: 'Bad Request',
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        // Handle generic database errors
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Lỗi cơ sở dữ liệu',
          error: 'Internal Server Error',
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }
}
