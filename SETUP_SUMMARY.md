# Setup Summary - Neighborhood Helper Backend

Complete guide to get started with the Neighborhood Helper API in under 2 minutes!

## 🎯 What You Have

A **production-ready** Express + MongoDB + Socket.IO backend with:

✅ REST API (40+ endpoints)
✅ Real-time chat (Socket.IO)
✅ Live location tracking (Swiggy-style)
✅ JWT authentication
✅ Geospatial queries (MongoDB 2dsphere)
✅ Rating system
✅ Image uploads (Cloudinary)
✅ API documentation (Swagger)
✅ **Docker support** (complete containerization)

---

## 🚀 Quick Start (Choose Your Method)

### Method 1: Docker (Recommended - Zero Config!)

**Requirements:** Docker installed

```bash
# One command to rule them all
docker-compose --profile dev up
```

**That's it!** Everything runs automatically:
- ✅ MongoDB (with data persistence)
- ✅ API Server (with hot reload)
- ✅ Mongo Express UI (database viewer)

**Access:**
- API: http://localhost:5000
- Docs: http://localhost:5000/docs
- DB UI: http://localhost:8081 (admin/admin)

**Stop:**
```bash
docker-compose down
```

---

### Method 2: Local Development

**Requirements:** Node.js 16+, MongoDB

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB (in separate terminal)
mongod

# 3. Start API
npm run dev
```

**Access:**
- API: http://localhost:5000
- Docs: http://localhost:5000/docs

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [README.md](README.md) | Complete documentation |
| [QUICK_START.md](QUICK_START.md) | 5-minute quick start |
| [DOCKER.md](DOCKER.md) | Full Docker guide |
| [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md) | Docker command cheatsheet |
| [API_EXAMPLES.md](API_EXAMPLES.md) | API usage examples |
| [Makefile](Makefile) | Convenience commands |

---

## 📁 Project Structure

```
neighborhood-helper-backend/
├── src/
│   ├── config/          # Env, database, Swagger
│   ├── middleware/      # Auth, validation, errors
│   ├── models/          # 10 MongoDB schemas
│   ├── routes/          # 8 API route files
│   ├── socket/          # WebSocket handlers
│   ├── utils/           # JWT, crypto, mailer, etc.
│   ├── validators/      # Joi validation schemas
│   └── server.js        # Main entry point
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Full stack orchestration
├── package.json         # Dependencies
├── .env                 # Environment config
└── Documentation files
```

---

## 🧪 Test the API

### 1. Register a User

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Test User",
    "email": "test@example.com",
    "password": "Password123!",
    "home": {"lng": -122.4194, "lat": 37.7749}
  }'
```

**Response:** You'll get an `accessToken` - save it!

### 2. Get Your Profile

```bash
curl http://localhost:5000/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Create a Request

```bash
curl -X POST http://localhost:5000/requests \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Need help moving",
    "details": "Moving a couch, 30 mins",
    "category": "moving",
    "whenTime": "2024-12-25T10:00:00Z",
    "location": {"lng": -122.4194, "lat": 37.7749}
  }'
```

### 4. Search Nearby Requests

```bash
curl "http://localhost:5000/requests?lng=-122.4194&lat=37.7749&radiusKm=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔌 WebSocket Example

```javascript
const io = require('socket.io-client');

// Connect
const socket = io('http://localhost:5000', {
  path: '/ws',
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

// Join chat thread
socket.emit('thread:join', { threadId: 'thread-id' });

// Send message
socket.emit('message:new', {
  threadId: 'thread-id',
  body: 'Hello!'
});

// Receive messages
socket.on('message:new', (msg) => {
  console.log('New message:', msg);
});
```

---

## 🛠️ Common Commands

### Using Make (Optional)

```bash
make docker-dev        # Start Docker development
make docker-logs       # View logs
make docker-down       # Stop containers
make shell             # Access API shell
make mongo-shell       # Access MongoDB shell
```

### Using Docker Compose

```bash
docker-compose --profile dev up       # Start dev
docker-compose logs -f                # View logs
docker-compose down                   # Stop
docker-compose exec api-dev sh        # Shell access
```

### Using NPM

```bash
npm run dev            # Start development
npm test               # Run tests
npm start              # Start production
```

---

## 🔑 Key Features to Try

### 1. Geospatial Search
```bash
GET /requests?lng=-122.4194&lat=37.7749&radiusKm=5&category=errands
```

### 2. Create Match & Chat
1. Create request → `/requests`
2. Create offer → `/offers`
3. Match them → `/matches`
4. Send messages → `/threads/:id/messages`

### 3. Live Location Tracking
1. Create match
2. Start tracking → `POST /matches/:id/tracking/start`
3. Connect via WebSocket
4. Helper sends `location:update` events
5. Requester receives real-time updates

### 4. Rate Users
```bash
POST /ratings
{
  "toUserId": "user-id",
  "matchId": "match-id",
  "stars": 5,
  "comment": "Great helper!"
}
```

---

## 📊 Available Endpoints

### Auth (7 endpoints)
- Register, Login, Logout, Refresh
- Password change/reset

### Verification (4 endpoints)
- Email verification
- Phone verification (OTP)

### Profile (9 endpoints)
- Get/update profile
- Avatar upload (Cloudinary)
- Email/phone change
- Privacy settings
- Delete account

### Requests & Offers (8 endpoints)
- Create, search, update
- Geospatial filtering

### Matching & Chat (7 endpoints)
- Create matches
- Send/receive messages
- Location tracking

### Ratings (2 endpoints)
- Create ratings
- Get user ratings

### Devices (2 endpoints)
- Register push tokens
- Deactivate tokens

---

## 🌍 Environment Variables

### Required for Production

```env
JWT_ACCESS_SECRET=strong-random-secret-32-chars-minimum
JWT_REFRESH_SECRET=another-strong-random-secret-32-chars
```

### Optional (for full features)

```env
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### Already Set (Development)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/neighborhood_helper
WS_CORS_ORIGIN=http://localhost:3000
```

---

## 🐳 Docker Details

### Services

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| api-dev | Custom (dev) | 5000 | API with hot reload |
| api | Custom (prod) | 5000 | Optimized API |
| mongodb | mongo:7 | 27017 | Database |
| mongo-express | mongo-express | 8081 | DB UI (dev only) |

### Volumes

- `mongodb_data` - Persistent database storage
- `mongodb_config` - MongoDB configuration

### Networks

- `neighborhood-network` - Bridge network for all services

---

## 🔐 Security Features

✅ JWT access tokens (15 min expiry)
✅ HttpOnly refresh cookies (7 day expiry)
✅ bcrypt password hashing (12 rounds)
✅ Rate limiting (100 req/15 min)
✅ Helmet.js security headers
✅ CORS protection
✅ Re-auth for sensitive operations
✅ Audit logging
✅ OTP hashing

---

## 🎨 Swagger UI

Interactive API documentation with try-it-out feature:

**URL:** http://localhost:5000/docs

Features:
- All endpoints documented
- Request/response schemas
- Try API calls directly
- Authentication support

---

## 🧹 Cleanup & Reset

### Docker Cleanup

```bash
# Stop containers
docker-compose down

# Remove data (database will be reset)
docker-compose down -v

# Full cleanup (images + volumes)
docker-compose down -v --rmi all
```

### Local Cleanup

```bash
# Remove node_modules
rm -rf node_modules

# Remove MongoDB data (varies by OS)
# macOS: rm -rf /usr/local/var/mongodb
# Linux: rm -rf /var/lib/mongodb
```

---

## 📈 Next Steps

### For Development

1. ✅ Start with Docker: `docker-compose --profile dev up`
2. ✅ Visit docs: http://localhost:5000/docs
3. ✅ Test endpoints with Postman/cURL
4. ✅ Connect WebSocket client
5. ✅ Build your frontend

### For Production

1. ✅ Set strong JWT secrets
2. ✅ Use MongoDB Atlas
3. ✅ Configure Cloudinary
4. ✅ Set up real email/SMS
5. ✅ Add reverse proxy (Nginx)
6. ✅ Enable HTTPS
7. ✅ Set proper CORS origins
8. ✅ Configure monitoring

---

## 🆘 Troubleshooting

### MongoDB Connection Failed

**Docker:**
```bash
docker-compose logs mongodb
docker-compose ps
```

**Local:**
```bash
# Check if MongoDB is running
pgrep mongod

# Start MongoDB
mongod
```

### Port Already in Use

```bash
# Find process on port 5000
lsof -i :5000

# Kill it or change PORT in .env
```

### JWT Token Errors

- Make sure you're sending: `Authorization: Bearer <token>`
- Token might be expired (15 min default)
- Use `/auth/refresh` to get new token

### Docker Issues

```bash
# Reset everything
docker-compose down -v
docker system prune -a --volumes
docker-compose --profile dev up --build
```

---

## 📞 Support

- Check [DOCKER.md](DOCKER.md) for Docker details
- Check [API_EXAMPLES.md](API_EXAMPLES.md) for usage examples
- Check [README.md](README.md) for full documentation

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Server starts without errors
- [ ] Can access http://localhost:5000/health
- [ ] Can view Swagger docs at /docs
- [ ] Can register a new user
- [ ] Can login and get JWT token
- [ ] Can access protected endpoint (/me)
- [ ] MongoDB is accessible (Mongo Express or Compass)
- [ ] Can create and search requests
- [ ] WebSocket connection works

---

**Congratulations! You're ready to build! 🎉**

For questions or issues, refer to the documentation files or check the code comments.

Happy coding! 🚀
