#!/bin/bash

# Environment Variables Validation Script
# Run this before starting the application

echo "🔍 Validating environment variables..."

# Required variables
REQUIRED_VARS=(
    "DB_HOST"
    "DB_USERNAME" 
    "DB_PASSWORD"
    "DB_NAME"
    "JWT_SECRET"
    "EMAIL_FROM"
    "GMAIL_CLIENT_ID"
    "GMAIL_CLIENT_SECRET"
    "GMAIL_REFRESH_TOKEN"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
)

# Optional VNPay variables (for payment features)
VNPAY_VARS=(
    "VNPAY_URL"
    "VNPAY_TMN_CODE"
    "VNPAY_SECRET_KEY"
    "VNPAY_RETURN_URL"
)

# Check required variables
echo "✅ Checking required variables..."
missing_required=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_required+=("$var")
    fi
done

# Check VNPay variables
echo "💳 Checking VNPay variables..."
missing_vnpay=()
for var in "${VNPAY_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vnpay+=("$var")
    fi
done

# Report results
if [ ${#missing_required[@]} -eq 0 ]; then
    echo "✅ All required environment variables are set!"
else
    echo "❌ Missing required environment variables:"
    printf "   - %s\n" "${missing_required[@]}"
    echo ""
    echo "Please set these variables in your .env file before starting the application."
    exit 1
fi

if [ ${#missing_vnpay[@]} -eq 0 ]; then
    echo "✅ All VNPay environment variables are set!"
    echo "💳 Payment features will be available."
else
    echo "⚠️  Missing VNPay environment variables:"
    printf "   - %s\n" "${missing_vnpay[@]}"
    echo ""
    echo "Payment features will be disabled. Set these variables to enable VNPay integration."
fi

echo ""
echo "🚀 Environment validation complete!"
