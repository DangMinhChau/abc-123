# Environment Setup Guide

## Quick Start

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Update the `.env` file with your actual values:

### Required Variables

#### Database Configuration

```bash
DB_HOST=localhost          # Your database host
DB_PORT=3306              # Database port (MySQL default: 3306)
DB_USERNAME=root          # Database username
DB_PASSWORD=your_password # Database password
DB_NAME=ecommerce_db      # Database name
```

#### JWT Security

```bash
JWT_SECRET=your-super-secret-jwt-key-that-should-be-very-long-and-random
```

> Generate a secure JWT secret: `openssl rand -base64 64`

#### Email Configuration (Gmail OAuth2)

```bash
EMAIL_FROM=noreply@yourdomain.com
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
```

#### Cloudinary (Image Upload)

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Optional Variables

#### VNPay Payment (Optional)

```bash
# Sandbox (Development)
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=your_sandbox_tmn_code
VNPAY_SECRET_KEY=your_sandbox_hash_secret
VNPAY_RETURN_URL=http://localhost:3000/checkout/payment/result/vnpay

# Production
VNPAY_URL=https://pay.vnpay.vn/vpcpay.html
VNPAY_TMN_CODE=your_production_tmn_code
VNPAY_SECRET_KEY=your_production_hash_secret
VNPAY_RETURN_URL=https://yourdomain.com/checkout/payment/result/vnpay
```

## Environment Validation

Run the validation script to check your environment:

```bash
chmod +x scripts/validate-env.sh
./scripts/validate-env.sh
```

## Common Issues

### 1. VNPay Configuration Error

```
Error: Config validation error: "VNPAY_RETURN_URL" must be a valid uri
```

**Solution**:

- Ensure `VNPAY_RETURN_URL` is a valid URL
- For development: `http://localhost:3000/checkout/payment/result/vnpay`
- For production: `https://yourdomain.com/checkout/payment/result/vnpay`

### 2. Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**:

- Check if MySQL is running
- Verify database credentials in `.env`
- Ensure database exists

### 3. Gmail OAuth Error

```
Error: Invalid grant
```

**Solution**:

- Regenerate Gmail refresh token
- Check OAuth2 credentials
- Verify Gmail API is enabled

## Production Deployment

1. Use `.env.production.example` as template
2. Set `NODE_ENV=production`
3. Use production URLs and credentials
4. Enable SSL/HTTPS for all URLs

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Regularly rotate API keys and tokens
- Enable 2FA for all service accounts
