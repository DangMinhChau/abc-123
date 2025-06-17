// Response DTOs
export interface OrderResponseDto {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: string;
  subTotal: number;
  shippingFee: number;
  discount: number;
  totalPrice: number;
  note?: string;
  orderedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemResponseDto {
  id: string;
  quantity: number;
  unitPrice: number;
  productName: string;
  variantSku: string;
  colorName: string;
  sizeName: string;
}

export interface OrderListResponseDto {
  orders: OrderResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
