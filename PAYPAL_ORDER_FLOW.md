# Flow Đặt Hàng với PayPal - Men's Fashion Website

## Tổng Quan

Hệ thống hỗ trợ thanh toán PayPal với khả năng tự động chuyển đổi từ VND sang USD để tương thích với PayPal API. Dưới đây là flow chi tiết cho quá trình đặt hàng và thanh toán với PayPal.

## Architecture Overview

```
Frontend (Client) → Backend API → PayPal API
                 ↓
            Database (Orders, Payments, Order Items, Shipping)
```

## Flow Đặt Hàng với PayPal

### 1. Khởi Tạo Đơn Hàng

**Endpoint:** `POST /api/orders`

**Request Body:**
```json
{
  "items": [
    {
      "variantId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 2,
      "pricePerUnit": 250000
    }
  ],
  "totalAmount": 500000,
  "paymentMethod": "paypal",
  "shippingAddress": {
    "recipientName": "Nguyễn Văn A",
    "recipientPhone": "+84901234567",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "wardCode": "00001",
    "districtId": 1,
    "provinceId": 79
  }
}
```

**Response:**
```json
{
  "message": "Đơn hàng được tạo thành công",
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-240617-001",
    "status": "pending",
    "totalAmount": 500000,
    "paymentMethod": "paypal",
    "items": [...],
    "shipping": {...}
  },
  "meta": {
    "timestamp": "2024-06-17T10:00:00.000Z"
  }
}
```

### 2. Tạo PayPal Order

**Endpoint:** `POST /api/payments/paypal/orders`

**Request Body:**
```json
{
  "orderId": "order-uuid",
  "amount": 500000,
  "currency": "VND"
}
```

**PayPal Service Logic:**
- Tự động chuyển đổi VND → USD (1 USD ≈ 24,000 VND)
- 500,000 VND → 20.83 USD
- Tạo PayPal order với USD amount

**Response:**
```json
{
  "message": "PayPal order tạo thành công",
  "data": {
    "paypalOrderId": "paypal-order-id",
    "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=xxx",
    "originalAmount": 500000,
    "convertedAmount": 20.83,
    "currency": "USD"
  },
  "meta": {
    "timestamp": "2024-06-17T10:01:00.000Z"
  }
}
```

### 3. PayPal Approval Flow

**Client Side:**
1. Frontend redirect user đến `approvalUrl`
2. User login PayPal và approve payment
3. PayPal redirect về success URL với `paypalOrderId`

### 4. Capture PayPal Payment

**Endpoint:** `POST /api/payments/paypal/capture`

**Request Body:**
```json
{
  "paypalOrderId": "paypal-order-id",
  "orderId": "order-uuid"
}
```

**Backend Logic:**
1. Call PayPal capture API
2. Validate capture result
3. Update payment status
4. Update order status
5. Create/update shipping record

**Response:**
```json
{
  "message": "Thanh toán PayPal thành công",
  "data": {
    "paymentId": "payment-uuid",
    "status": "completed",
    "captureId": "paypal-capture-id",
    "amount": 500000,
    "paypalAmount": 20.83,
    "currency": "VND",
    "paidAt": "2024-06-17T10:05:00.000Z"
  },
  "meta": {
    "timestamp": "2024-06-17T10:05:00.000Z"
  }
}
```

### 5. Get Order Details

**Endpoint:** `GET /api/payments/paypal/orders/{paypalOrderId}`

**Response:**
```json
{
  "message": "Lấy thông tin đơn thanh toán thành công",
  "data": {
    "id": "paypal-order-id",
    "status": "COMPLETED",
    "purchase_units": [...],
    "payer": {...},
    "create_time": "2024-06-17T10:01:00Z",
    "update_time": "2024-06-17T10:05:00Z"
  },
  "meta": {
    "timestamp": "2024-06-17T10:06:00.000Z"
  }
}
```

## Database Schema Updates

### Orders Table
```sql
- id (UUID, Primary Key)
- order_number (String, Unique)
- user_id (UUID, Nullable - for guest orders)
- status (Enum: pending, processing, completed, cancelled)
- total_amount (Decimal)
- payment_method (Enum: cod, paypal)
- created_at, updated_at
```

### Payments Table
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key)
- payment_method (Enum)
- status (Enum: pending, processing, completed, failed, cancelled)
- amount (Decimal)
- currency (String)
- paypal_order_id (String, Nullable)
- paypal_capture_id (String, Nullable)
- note (Text, Nullable)
- paid_at (Timestamp, Nullable)
- created_at, updated_at
```

### Order Items Table
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key)
- variant_id (UUID, Foreign Key)
- quantity (Integer)
- unit_price (Decimal)
- product_name (String - snapshot)
- variant_sku (String - snapshot)
- color_name (String - snapshot)
- size_name (String - snapshot)
- created_at, updated_at
```

### Shipping Table
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key)
- recipient_name (String)
- recipient_phone (String)
- address (String)
- ward_code, district_id, province_id
- shipping_method (Enum)
- shipping_fee (Decimal)
- status (Enum: pending, processing, shipped, delivered, cancelled)
- tracking_number (String, Nullable)
- shipped_at, delivered_at (Timestamp, Nullable)
- created_at, updated_at
```

## Error Handling

### PayPal Errors
1. **Insufficient Funds:** PayPal user không đủ tiền
2. **Payment Declined:** Ngân hàng từ chối
3. **Expired Order:** PayPal order quá hạn (3 hours)
4. **Invalid Order:** Order không tồn tại

### System Errors
1. **Stock Validation:** Kiểm tra tồn kho trước khi capture
2. **Duplicate Capture:** Tránh capture cùng một order nhiều lần
3. **Currency Conversion:** Handle lỗi chuyển đổi tiền tệ

## Security Features

1. **JWT Authentication:** Optional cho guest orders
2. **Validation:** Strict validation cho tất cả inputs
3. **Rate Limiting:** Giới hạn requests to PayPal
4. **Audit Trail:** Log tất cả payment activities
5. **Idempotency:** Prevent duplicate payments

## Configuration

### Environment Variables
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_ENVIRONMENT=sandbox # or live
PAYPAL_WEBHOOK_ID=your_webhook_id
```

### PayPal Webhook Events
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `CHECKOUT.ORDER.APPROVED`

## Testing

### Test Cards (Sandbox)
- **Success:** Use PayPal sandbox accounts
- **Failure:** Use declined test accounts
- **Insufficient Funds:** Use limited balance accounts

### Test Scenarios
1. Successful payment flow
2. Payment cancellation
3. Payment failure
4. Network timeout handling
5. Duplicate capture prevention

## Monitoring & Logging

### Key Metrics
- Payment success rate
- PayPal API response times
- Currency conversion accuracy
- Order completion rate

### Logs
- All PayPal API calls
- Payment status changes
- Error conditions
- Performance metrics

## Future Enhancements

1. **Webhook Integration:** Real-time payment updates
2. **Refund Support:** Handle PayPal refunds
3. **Multi-Currency:** Support more currencies
4. **Payment Plans:** Installment payments
5. **Fraud Detection:** Advanced security checks
