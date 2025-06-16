export interface BaseResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, any>;
  errors?: any[] | null;
}
