export interface LoggingConfig {
  /**
   * Có log dữ liệu nhạy cảm hay không
   */
  logSensitiveData: boolean;

  /**
   * Có log headers hay không
   */
  logHeaders: boolean;

  /**
   * Có log request body hay không
   */
  logRequestBody: boolean;

  /**
   * Có log response data hay không
   */
  logResponseData: boolean;

  /**
   * Giới hạn số items trong array khi log
   */
  maxArrayItemsToLog: number;

  /**
   * Các fields được coi là nhạy cảm
   */
  sensitiveFields: string[];
}

export const getLoggingConfig = (): LoggingConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    logSensitiveData: isDevelopment,
    logHeaders: isDevelopment,
    logRequestBody: true,
    logResponseData: isDevelopment,
    maxArrayItemsToLog: isDevelopment ? 5 : 2,
    sensitiveFields: [
      'password',
      'confirmPassword',
      'oldPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'key',
      'apiKey',
      'authorization',
      'jwt',
      'sessionId',
    ],
  };
};
