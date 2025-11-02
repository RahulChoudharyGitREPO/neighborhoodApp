# Neighborhood Helper - Backend API

Production-ready **Express + MongoDB** backend for the Neighborhood Helper app, featuring **REST API**, **WebSocket** (Socket.IO), **JWT authentication**, **geospatial queries**, **realtime chat**, and **live location tracking**.

## Features

- **Authentication & Authorization**: JWT access tokens + HttpOnly refresh cookies
- **User Management**: Registration, login, profile, verification (email/phone)
- **Geospatial Queries**: MongoDB 2dsphere indexes for location-based matching
- **Requests & Offers**: Create, search, and match help requests with helpers
- **Realtime Chat**: Socket.IO-powered messaging between matched users
- **Live Location Tracking**: Swiggy/Domino's-style order tracking with WebSocket
- **Ratings System**: 5-star ratings with comments
- **Push Notifications**: Mock service (ready for Expo Push/FCM integration)
- **Image Uploads**: Cloudinary integration for avatars
- **API Documentation**: Auto-generated Swagger docs at `/docs`
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing
- **Audit Logging**: Track sensitive user actions

## Tech Stack

- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database with geospatial indexes
- **Socket.IO** - WebSocket for chat and tracking
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Joi** - Request validation
- **Cloudinary** - Image storage
- **Swagger** - API documentation
- **Jest + Supertest** - Testing

## Prerequisites

- **Node.js** >= 16.x
- **MongoDB** >= 5.x (running locally or remote)
- **Cloudinary Account** (optional, for avatar uploads)

**OR**

- **Docker** & **Docker Compose** (for containerized setup)

## Installation

### Option A: Docker (Recommended - Easiest Setup!)

The fastest way to get started. See **[DOCKER.md](DOCKER.md)** for detailed guide.

```bash
# Start the entire stack (API + MongoDB + Mongo Express UI)
docker-compose --profile dev up
```

That's it! The API will be running at:
- **API**: http://localhost:5000
- **Docs**: http://localhost:5000/docs
- **MongoDB UI**: http://localhost:8081

### Option B: Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd neighborhood-helper-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neighborhood_helper

JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Optional: Cloudinary (for avatars)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# Linux/macOS
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the development server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## Project Structure

```
neighborhood-helper-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection
│   │   ├── env.js        # Environment variables
│   │   └── swagger.js    # Swagger setup
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # JWT authentication
│   │   ├── validate.js   # Joi validation
│   │   └── errorHandler.js
│   ├── models/           # Mongoose schemas
│   │   ├── User.js
│   │   ├── UserContact.js
│   │   ├── Request.js
│   │   ├── Offer.js
│   │   ├── Match.js
│   │   ├── Thread.js
│   │   ├── Message.js
│   │   ├── Rating.js
│   │   ├── LiveLocation.js
│   │   ├── AuditLog.js
│   │   └── DeviceToken.js
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── verification.routes.js
│   │   ├── profile.routes.js
│   │   ├── request.routes.js
│   │   ├── offer.routes.js
│   │   ├── match.routes.js
│   │   ├── rating.routes.js
│   │   └── device.routes.js
│   ├── socket/           # Socket.IO handlers
│   │   └── index.js
│   ├── utils/            # Utility functions
│   │   ├── jwt.js
│   │   ├── crypto.js
│   │   ├── audit.js
│   │   ├── mailer.js
│   │   ├── sms.js
│   │   └── notification.js
│   ├── validators/       # Joi schemas
│   │   ├── auth.validators.js
│   │   ├── profile.validators.js
│   │   ├── request.validators.js
│   │   ├── offer.validators.js
│   │   ├── match.validators.js
│   │   ├── rating.validators.js
│   │   └── verification.validators.js
│   └── server.js         # Main entry point
├── .env.example
├── .gitignore
├── package.json
├── jest.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `POST /auth/password` - Change password
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/confirm-password-reset` - Confirm password reset

### Verification
- `POST /verify/email/start` - Start email verification
- `POST /verify/email/confirm` - Confirm email
- `POST /verify/phone/start` - Start phone verification (OTP)
- `POST /verify/phone/confirm` - Confirm phone with OTP

### Profile
- `GET /me` - Get current user profile
- `PATCH /me/profile` - Update profile
- `POST /me/avatar/sign` - Get Cloudinary upload signature
- `POST /me/avatar/confirm` - Confirm avatar upload
- `POST /me/email/start` - Start email change
- `POST /me/email/confirm` - Confirm email change
- `POST /me/phone/start` - Start phone change
- `POST /me/phone/confirm` - Confirm phone change
- `PATCH /me/privacy` - Update privacy settings
- `DELETE /me` - Soft delete account

### Requests & Offers
- `POST /requests` - Create request
- `GET /requests` - Search requests (geospatial)
- `GET /requests/:id` - Get request details
- `PATCH /requests/:id` - Update request
- `POST /offers` - Create offer
- `GET /offers` - Search offers (geospatial)
- `GET /offers/:id` - Get offer details
- `PATCH /offers/:id` - Update offer

### Matching & Chat
- `POST /matches` - Create match
- `GET /matches/:id` - Get match details
- `PATCH /matches/:id/status` - Update match status
- `POST /matches/:id/tracking/start` - Start location tracking
- `GET /threads/:threadId/messages` - Get messages
- `POST /threads/:threadId/messages` - Send message

### Ratings
- `POST /ratings` - Create rating
- `GET /ratings/users/:userId` - Get user ratings

### Devices
- `POST /devices` - Register device token for push notifications
- `DELETE /devices/:token` - Deactivate device

### Other
- `GET /health` - Health check
- `GET /docs` - Swagger API documentation

## WebSocket Events

### Connection
Connect to `/ws` with authentication token:

```javascript
const socket = io('http://localhost:5000', {
  path: '/ws',
  auth: { token: '<your-jwt-token>' }
});
```

### Chat Events
- **thread:join** - Join a chat thread
- **thread:leave** - Leave a chat thread
- **message:new** - Send/receive new message
- **message:read** - Mark message as read
- **user:typing** - Typing indicator

### Tracking Events
- **tracking:join** - Join tracking room for a match
- **location:update** - Send/receive location updates
- **tracking:leave** - Leave tracking room

## Realtime Tracking Flow

1. **Requester** calls `POST /matches/:id/tracking/start` to get WS token
2. **Requester** connects to Socket.IO and joins `track:<matchId>` room
3. **Helper** sends periodic `location:update` events with `{lng, lat, speed, heading}`
4. **Server** broadcasts location to all room members
5. **Frontend** updates map marker and calculates ETA using Google Maps API

## Geospatial Queries

The app uses MongoDB's 2dsphere indexes for location-based matching:

```javascript
// Find requests within 2.5km
GET /requests?lng=-122.4194&lat=37.7749&radiusKm=2.5&category=errands

// Find offers within 5km with specific skill
GET /offers?lng=-122.4194&lat=37.7749&radiusKm=5&skill=gardening
```

Coordinates format: `[longitude, latitude]` (GeoJSON standard)

## Security Best Practices

- JWT access tokens (short-lived) + HttpOnly refresh cookies
- bcrypt password hashing (12 rounds)
- Rate limiting on all endpoints
- Helmet.js for security headers
- CORS configured for specific origins
- Audit logging for sensitive actions
- OTP hashing for phone verification
- Re-authentication required for sensitive operations

## Development

### Run in development mode
```bash
npm run dev
```

### Run tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong JWT secrets (32+ characters)
3. Configure Cloudinary for production
4. Set up MongoDB Atlas or managed MongoDB
5. Configure CORS for your frontend domain
6. Enable HTTPS and secure cookies
7. Set up real email service (replace mock mailer)
8. Set up real SMS service (replace mock SMS)
9. Integrate Expo Push or FCM for notifications

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/neighborhood_helper` |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `WS_CORS_ORIGIN` | WebSocket CORS origin | `http://localhost:3000` |
| `BCRYPT_SALT_ROUNDS` | bcrypt salt rounds | `12` |

## Troubleshooting

### MongoDB connection failed
- Ensure MongoDB is running: `mongod` or check Docker container
- Verify `MONGODB_URI` in `.env`

### JWT token errors
- Check if `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Ensure tokens are passed in `Authorization: Bearer <token>` header

### WebSocket connection issues
- Verify `WS_CORS_ORIGIN` matches your frontend URL
- Check if token is passed in Socket.IO auth

### Geospatial queries not working
- Ensure MongoDB version >= 5.x
- Indexes are created automatically on server start

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
