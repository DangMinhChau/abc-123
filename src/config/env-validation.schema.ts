import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),

  // Database Configuration
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
  PASSWORD_RESET_TOKEN_EXPIRES_IN: Joi.string().default('1h'),

  // Security Configuration
  BCRYPT_SALT_ROUNDS: Joi.number().min(10).max(15).default(12),
  MAX_LOGIN_ATTEMPTS: Joi.number().min(3).max(10).default(5),
  LOCKOUT_DURATION: Joi.number().min(60000).default(900000), // 15 minutes minimum

  // Rate Limiting Configuration
  THROTTLE_TTL: Joi.number().min(1).default(60), // Time window in seconds
  THROTTLE_LIMIT: Joi.number().min(1).default(100), // Maximum requests per TTL

  // OAuth2 Gmail Configuration (required for mail service)
  EMAIL_FROM: Joi.string().email().required(),
  GMAIL_CLIENT_ID: Joi.string().required(),
  GMAIL_CLIENT_SECRET: Joi.string().required(),
  GMAIL_REFRESH_TOKEN: Joi.string().required(),
  GMAIL_ACCESS_TOKEN: Joi.string().optional(), // Optional as it can be generated from refresh token

  // Cloudinary Configuration  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  // PayPal Configuration
  PAYPAL_CLIENT_ID: Joi.string().optional(),
  PAYPAL_CLIENT_SECRET: Joi.string().optional(),
  PAYPAL_ENVIRONMENT: Joi.string()
    .valid('sandbox', 'live')
    .default('sandbox')
    .optional(),

  // GHN Shipping Configuration
  GHN_API_URL: Joi.string().optional(),
  GHN_TOKEN: Joi.string().optional(),
  GHN_SHOP_ID: Joi.string().optional(),

  // GHN Shop Location
  GHN_FROM_DISTRICT_ID: Joi.string().optional(),
  GHN_FROM_WARD_CODE: Joi.string().optional(),
  GHN_RETURN_PHONE: Joi.string().optional(),
  GHN_RETURN_ADDRESS: Joi.string().optional(),
});
