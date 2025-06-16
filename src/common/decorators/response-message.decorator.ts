import { SetMetadata } from '@nestjs/common';

/**
 * Decorator để custom message cho response
 * @param message - Custom message cho response
 */
export const ResponseMessage = (message: string) =>
  SetMetadata('responseMessage', message);

/**
 * Key để lấy message từ metadata
 */
export const RESPONSE_MESSAGE_KEY = 'responseMessage';
