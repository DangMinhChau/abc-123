# Order & Payment System with PayPal Support

## Setup PayPal Environment Variables

### Development (Sandbox)

```bash
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_ENVIRONMENT=sandbox
FRONTEND_URL=http://localhost:3000
```

### Production

```bash
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_ENVIRONMENT=live
FRONTEND_URL=https://yourdomain.com
```

## API Endpoints

### Orders

- `POST /orders` - Create order (supports both guest and authenticated users)
- `GET /orders/:id` - Get order by ID
- `GET /orders/number/:orderNumber` - Get order by order number
- `GET /orders/user/me` - Get current user's orders (requires auth)

### Payments (PayPal)

- `POST /payments/paypal/create-order` - Create PayPal order
- `POST /payments/paypal/capture-order` - Capture PayPal payment
- `GET /payments/paypal/order/:paypalOrderId` - Get PayPal order details
- `GET /payments/paypal/status` - Check PayPal service status

## Features

### ✅ Guest Order Support

- Anonymous users can place orders
- Only requires shipping information
- No authentication needed

### ✅ User Order Support

- Authenticated users can place orders
- Orders linked to user account
- Order history available

### ✅ PayPal Integration

- VND to USD conversion (1 USD ≈ 24,000 VND)
- Automatic currency handling
- Fallback to COD if PayPal fails

### ✅ COD Support

- Cash on delivery payment method
- Default payment method for all orders

### ✅ Product Variants

- Different sizes and colors
- Individual stock tracking
- SKU-based inventory management

### ✅ Order Management

- Order status tracking
- Automatic order number generation
- Stock management (decrease on order, restore on cancel)

## Order Flow

1. **Create Order**: Customer provides shipping info and selects items
2. **Payment Selection**: Choose between COD or PayPal
3. **PayPal Payment** (if selected):
   - Convert VND amount to USD
   - Create PayPal order
   - User approves payment on PayPal
   - Capture payment and update order status
4. **COD Payment**: Order created with pending payment status
5. **Order Fulfillment**: Order moves through processing → shipped → delivered

## Currency Handling

The system automatically handles Vietnamese Dong (VND) for PayPal:

- Frontend displays prices in VND
- PayPal API requires USD
- Automatic conversion: VND ÷ 24,000 = USD
- Minimum PayPal amount: $0.01 USD

## Error Handling

- Stock validation before order creation
- User permission checks for order access
- PayPal API error handling with fallback options
- Graceful degradation if PayPal is unavailable
