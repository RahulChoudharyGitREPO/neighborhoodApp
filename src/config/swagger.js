const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Neighborhood Helper API',
      version: '1.0.0',
      description: 'Production-ready REST + WebSocket backend for Neighborhood Helper app',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: config.api_url,
        description: config.node_env === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            displayName: { type: 'string' },
            bio: { type: 'string' },
            avatarUrl: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            radiusKm: { type: 'number' },
            home: {
              type: 'object',
              properties: {
                lng: { type: 'number' },
                lat: { type: 'number' },
              },
            },
            email: { type: 'string' },
            isEmailVerified: { type: 'boolean' },
            phone: { type: 'string' },
            isPhoneVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Request: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            details: { type: 'string' },
            category: { type: 'string', enum: ['errands', 'moving', 'repairs', 'gardening', 'tech', 'tutoring', 'other'] },
            whenTime: { type: 'string', format: 'date-time' },
            location: {
              type: 'object',
              properties: {
                lng: { type: 'number' },
                lat: { type: 'number' },
              },
            },
            status: { type: 'string', enum: ['open', 'matched', 'completed', 'cancelled'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Offer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            radiusKm: { type: 'number' },
            home: {
              type: 'object',
              properties: {
                lng: { type: 'number' },
                lat: { type: 'number' },
              },
            },
            availability: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Match: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            requestId: { type: 'string' },
            offerId: { type: 'string' },
            requesterId: { type: 'string' },
            helperId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'active', 'enroute', 'arrived', 'completed', 'cancelled'] },
            trackingEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to API route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
