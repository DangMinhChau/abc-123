# Hoàn Thiện Hệ Thống Order & PayPal với VND

## ✅ Đã Hoàn Thành

### 1. Order Management System

- **Orders Module**: Hoàn thiện với CRUD operations
- **Orders Controller**: Sử dụng `@GetUser` decorator thay vì `@Req()`
- **Orders Service**: Xử lý tạo đơn hàng, validate stock, quản lý order status
- **Order DTOs**: Validate đầu vào cho việc tạo đơn hàng

### 2. Payment System với PayPal

- **PayPal Service**: Hỗ trợ VND → USD conversion (1 USD = 24,000 VND)
- **Payments Controller**: API endpoints cho PayPal integration
- **Payments Service**: Quản lý payment records và status updates
- **Payment DTOs**: Validate với custom `@IsValidVNDAmount` decorator

### 3. Security & Authorization

- **OptionalJwtAuthGuard**: Cho phép cả guest và authenticated users
- **GetUser Decorator**: Type-safe user extraction từ JWT
- **Permission Checks**: Users chỉ có thể xem orders của mình

### 4. Database Integration

- **TypeORM Entities**: Order, OrderItem, Payment, Shipping
- **Relations**: Proper foreign key relationships
- **Stock Management**: Tự động giảm stock khi tạo order, khôi phục khi cancel

### 5. Custom Validators

- **IsValidVNDAmount**: Validate số tiền VND hợp lệ cho PayPal
  - Minimum: 1,000 VND
  - Maximum: 1,000,000,000 VND
  - PayPal equivalent: ≥ $0.01 USD

## 🚀 API Endpoints

### Orders

```
POST   /orders                  - Tạo đơn hàng (guest + user)
GET    /orders/:id             - Lấy đơn hàng theo ID
GET    /orders/number/:number  - Lấy đơn hàng theo số order
GET    /orders/user/me         - Lấy orders của user hiện tại
```

### Payments (PayPal)

```
POST   /payments/paypal/create-order  - Tạo PayPal order
POST   /payments/paypal/capture-order - Capture PayPal payment
GET    /payments/paypal/order/:id     - Lấy PayPal order details
GET    /payments/paypal/status        - Check PayPal service status
```

## 💰 Currency Handling

### VND → USD Conversion

- **Rate**: 1 USD = 24,000 VND
- **Auto Conversion**: Backend tự động convert khi gọi PayPal API
- **Minimum**: 1,000 VND (≈ $0.04 USD)
- **Display**: Frontend hiển thị VND, PayPal xử lý USD

### Example

```typescript
// Input: 240,000 VND
// PayPal API: $10.00 USD
// User sees: 240,000₫
```

## 🔧 Environment Variables

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_ENVIRONMENT=sandbox
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_NAME=fashion_store
```

## 🛡️ Security Features

1. **Guest Orders**: Không cần đăng nhập
2. **User Orders**: Liên kết với account
3. **Permission Control**: Users chỉ xem được orders của mình
4. **Input Validation**: Comprehensive validation cho tất cả DTOs
5. **Type Safety**: Sử dụng TypeScript và decorators

## 📦 Module Structure

```
src/order/
├── orders/
│   ├── dto/requests/
│   ├── entities/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.module.ts
├── payments/
│   ├── dto/requests/
│   ├── entities/
│   ├── services/paypal.service.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   └── payments.module.ts
├── order-items/
└── shippings/
```

## ✅ Testing Checklist

- [ ] Tạo order với guest user
- [ ] Tạo order với authenticated user
- [ ] PayPal payment với VND
- [ ] COD payment
- [ ] Order permission checks
- [ ] Stock management
- [ ] Currency conversion accuracy
