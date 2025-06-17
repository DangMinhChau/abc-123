// Response DTOs
export interface PaymentResponseDto {
  id: string;
  method: string;
  amount: number;
  status: string;
  transactionId?: string;
  paidAt?: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayPalOrderResponseDto {
  paypalOrderId: string;
  status: string;
  orderId: string;
  approvalLinks?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResponseDto {
  status: string;
  paypalOrderId: string;
  orderId: string;
  captureId?: string;
}

export interface PayPalStatusResponseDto {
  configured: boolean;
  available: boolean;
}
