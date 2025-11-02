# API Usage Examples

This document provides example API calls for testing the Neighborhood Helper API.

## Base URL
```
http://localhost:5000
```

## Authentication Flow

### 1. Register a new user

```bash
POST /auth/register
Content-Type: application/json

{
  "displayName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "home": {
    "lng": -122.4194,
    "lat": 37.7749
  }
}

Response:
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "displayName": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

### 2. Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "displayName": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": false,
    "avatarUrl": ""
  }
}
```

### 3. Refresh access token

```bash
POST /auth/refresh
Cookie: refreshToken=<token>

Response:
{
  "accessToken": "eyJhbGc..."
}
```

## Profile Management

### Get current user profile

```bash
GET /me
Authorization: Bearer eyJhbGc...

Response:
{
  "id": "507f1f77bcf86cd799439011",
  "displayName": "John Doe",
  "bio": "",
  "avatarUrl": "",
  "skills": [],
  "radiusKm": 2.5,
  "home": {
    "lng": -122.4194,
    "lat": 37.7749
  },
  "email": "john@example.com",
  "isEmailVerified": false,
  ...
}
```

### Update profile

```bash
PATCH /me/profile
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "displayName": "John Smith",
  "bio": "Happy to help my neighbors!",
  "skills": ["gardening", "repairs", "tech"],
  "radiusKm": 3.5
}
```

## Requests

### Create a request

```bash
POST /requests
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Need help moving furniture",
  "details": "I need help moving a couch from my apartment to a truck. Should take about 30 minutes.",
  "category": "moving",
  "whenTime": "2024-12-25T10:00:00Z",
  "location": {
    "lng": -122.4194,
    "lat": 37.7749
  }
}

Response:
{
  "id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "title": "Need help moving furniture",
  "details": "I need help moving a couch...",
  "category": "moving",
  "whenTime": "2024-12-25T10:00:00.000Z",
  "location": {
    "lng": -122.4194,
    "lat": 37.7749
  },
  "status": "open",
  "createdAt": "2024-12-20T10:00:00.000Z"
}
```

### Search nearby requests

```bash
GET /requests?lng=-122.4194&lat=37.7749&radiusKm=5&category=moving&page=1&limit=20
Authorization: Bearer eyJhbGc...

Response:
{
  "requests": [
    {
      "id": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439011",
      "user": {
        "displayName": "John Doe",
        "avatarUrl": ""
      },
      "title": "Need help moving furniture",
      "details": "I need help moving a couch...",
      "category": "moving",
      "whenTime": "2024-12-25T10:00:00.000Z",
      "location": {
        "lng": -122.4194,
        "lat": 37.7749
      },
      "status": "open",
      "distance": 1234,
      "createdAt": "2024-12-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "hasMore": false
  }
}
```

## Offers

### Create an offer

```bash
POST /offers
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "skills": ["gardening", "repairs"],
  "radiusKm": 3,
  "home": {
    "lng": -122.4194,
    "lat": 37.7749
  },
  "availability": {
    "weekdays": ["Monday", "Wednesday", "Friday"],
    "hours": "9am-5pm"
  }
}
```

### Search nearby offers

```bash
GET /offers?lng=-122.4194&lat=37.7749&radiusKm=5&skill=gardening&page=1
Authorization: Bearer eyJhbGc...
```

## Matching & Chat

### Create a match

```bash
POST /matches
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "requestId": "507f1f77bcf86cd799439012",
  "offerId": "507f1f77bcf86cd799439013"
}

Response:
{
  "match": {
    "id": "507f1f77bcf86cd799439014",
    "requestId": "507f1f77bcf86cd799439012",
    "offerId": "507f1f77bcf86cd799439013",
    "requesterId": "507f1f77bcf86cd799439011",
    "helperId": "507f1f77bcf86cd799439015",
    "status": "pending",
    "createdAt": "2024-12-20T10:00:00.000Z"
  },
  "thread": {
    "id": "507f1f77bcf86cd799439016",
    "matchId": "507f1f77bcf86cd799439014"
  }
}
```

### Send a message

```bash
POST /threads/507f1f77bcf86cd799439016/messages
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "body": "Hi! I can help you with the furniture move.",
  "attachments": []
}
```

### Get messages

```bash
GET /threads/507f1f77bcf86cd799439016/messages?page=1&limit=50
Authorization: Bearer eyJhbGc...
```

### Start location tracking

```bash
POST /matches/507f1f77bcf86cd799439014/tracking/start
Authorization: Bearer eyJhbGc...

Response:
{
  "room": "track:507f1f77bcf86cd799439014",
  "wsToken": "eyJhbGc...",
  "trackingEnabled": true
}
```

## Ratings

### Create a rating

```bash
POST /ratings
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "toUserId": "507f1f77bcf86cd799439015",
  "matchId": "507f1f77bcf86cd799439014",
  "stars": 5,
  "comment": "Very helpful and friendly!"
}
```

### Get user ratings

```bash
GET /ratings/users/507f1f77bcf86cd799439015?summary=false&page=1
Authorization: Bearer eyJhbGc...

Response:
{
  "summary": {
    "averageRating": 4.8,
    "totalRatings": 15
  },
  "ratings": [
    {
      "id": "507f1f77bcf86cd799439017",
      "from": {
        "id": "507f1f77bcf86cd799439011",
        "displayName": "John Doe",
        "avatarUrl": ""
      },
      "stars": 5,
      "comment": "Very helpful and friendly!",
      "createdAt": "2024-12-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "hasMore": false
  }
}
```

## WebSocket Examples

### Connect to WebSocket

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  path: '/ws',
  auth: {
    token: 'your-jwt-access-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

### Join a chat thread

```javascript
socket.emit('thread:join', {
  threadId: '507f1f77bcf86cd799439016'
});

socket.on('thread:joined', (data) => {
  console.log('Joined thread:', data.threadId);
});
```

### Send a message via WebSocket

```javascript
socket.emit('message:new', {
  threadId: '507f1f77bcf86cd799439016',
  body: 'Hello via WebSocket!',
  attachments: []
});

socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

### Join tracking room

```javascript
socket.emit('tracking:join', {
  matchId: '507f1f77bcf86cd799439014'
});

socket.on('tracking:joined', (data) => {
  console.log('Joined tracking room:', data.matchId);
});
```

### Send location update (Helper)

```javascript
socket.emit('location:update', {
  matchId: '507f1f77bcf86cd799439014',
  lng: -122.4194,
  lat: 37.7749,
  speed: 5.5,  // meters per second
  heading: 90  // degrees
});
```

### Receive location updates (Requester)

```javascript
socket.on('location:update', (data) => {
  console.log('Location update:', {
    matchId: data.matchId,
    coordinates: data.coordinates,
    speed: data.speed,
    heading: data.heading,
    updatedAt: data.updatedAt
  });

  // Update map marker with new coordinates
  updateMapMarker(data.coordinates.lat, data.coordinates.lng);
});
```

### Typing indicator

```javascript
// Send typing status
socket.emit('user:typing', {
  threadId: '507f1f77bcf86cd799439016',
  isTyping: true
});

// Receive typing status
socket.on('user:typing', (data) => {
  console.log(`User ${data.userId} is typing: ${data.isTyping}`);
});
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

Common status codes:
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Testing with cURL

### Register user
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "home": {"lng": -122.4194, "lat": 37.7749}
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get profile (with token)
```bash
curl -X GET http://localhost:5000/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Additional Resources

- **API Documentation**: Visit `http://localhost:5000/docs` for interactive Swagger documentation
- **Health Check**: `GET /health` to verify server status
- **MongoDB Compass**: Connect to `mongodb://localhost:27017` to view database
