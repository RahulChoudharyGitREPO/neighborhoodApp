const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const connectDB = require('./config/database');
const swaggerSpec = require('./config/swagger');
const initializeSocket = require('./socket');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const verificationRoutes = require('./routes/verification.routes');
const profileRoutes = require('./routes/profile.routes');
const requestRoutes = require('./routes/request.routes');
const offerRoutes = require('./routes/offer.routes');
const matchRoutes = require('./routes/match.routes');
const ratingRoutes = require('./routes/rating.routes');
const deviceRoutes = require('./routes/device.routes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to database
connectDB();

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow Swagger UI
}));

// CORS
app.use(cors({
  origin: config.ws.cors_origin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Logging
if (config.node_env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.node_env,
  });
});

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Neighborhood Helper API',
}));

// API Routes
app.use('/auth', authRoutes);
app.use('/verify', verificationRoutes);
app.use('/me', profileRoutes);
app.use('/requests', requestRoutes);
app.use('/offers', offerRoutes);
app.use('/matches', matchRoutes);
app.use('/ratings', ratingRoutes);
app.use('/devices', deviceRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Neighborhood Helper API',
    version: '1.0.0',
    documentation: `${config.api_url}/docs`,
    websocket: `${config.api_url}/ws`,
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

server.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log(`  Neighborhood Helper API`);
  console.log('===========================================');
  console.log(`  Environment: ${config.node_env}`);
  console.log(`  Server:      ${config.api_url}`);
  console.log(`  Docs:        ${config.api_url}/docs`);
  console.log(`  WebSocket:   ${config.api_url}/ws`);
  console.log('===========================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
