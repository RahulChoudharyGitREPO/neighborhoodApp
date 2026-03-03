require('dotenv').config();

module.exports = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  api_url: process.env.API_URL || 'http://localhost:5000',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/neighborhood_helper',
  },

  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET || 'change-this-secret',
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
    access_expiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refresh_expiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },

  email: {
    from: process.env.EMAIL_FROM || 'noreply@neighborhoodhelper.com',
    service: process.env.EMAIL_SERVICE || 'mock',
  },

  sms: {
    service: process.env.SMS_SERVICE || 'mock',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  geo: {
    default_radius_km: parseFloat(process.env.DEFAULT_RADIUS_KM) || 2.5,
    min_radius_km: parseFloat(process.env.MIN_RADIUS_KM) || 0.5,
    max_radius_km: parseFloat(process.env.MAX_RADIUS_KM) || 50000,
  },

  ws: {
    cors_origin: process.env.WS_CORS_ORIGIN || 'http://localhost:3000',
  },

  pagination: {
    default_page_size: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
    max_page_size: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  },

  security: {
    bcrypt_salt_rounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
    otp_expiry_minutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    verification_token_expiry_hours: parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_HOURS, 10) || 24,
  },
};
