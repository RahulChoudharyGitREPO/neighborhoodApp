# Docker Quick Reference

Ultra-quick reference for common Docker operations.

## 🚀 Quick Start

```bash
# Start everything (API + MongoDB + Mongo UI)
docker-compose --profile dev up

# Or run in background
docker-compose --profile dev up -d
```

Visit:
- API: http://localhost:5000
- API Docs: http://localhost:5000/docs
- MongoDB UI: http://localhost:8081 (admin/admin)

## 📋 Common Commands

### Start/Stop

```bash
# Start development
docker-compose --profile dev up

# Start production
docker-compose --profile prod up -d

# Stop all
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f api-dev
docker-compose logs -f mongodb
```

### Rebuild

```bash
# Rebuild and start
docker-compose --profile dev up --build

# Rebuild specific service
docker-compose build api-dev
```

### Shell Access

```bash
# Access API container
docker-compose exec api-dev sh

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p admin123
```

## 🧹 Cleanup

```bash
# Remove containers
docker-compose down

# Remove containers + volumes (deletes DB data)
docker-compose down -v

# Remove everything (containers, volumes, images)
docker-compose down -v --rmi all

# Clean all Docker resources
docker system prune -a --volumes
```

## 🔧 Makefile Shortcuts

If you have `make` installed:

```bash
make docker-dev        # Start dev mode
make docker-prod       # Start prod mode
make docker-logs       # View logs
make docker-down       # Stop containers
make docker-clean      # Remove everything
make shell             # Access API shell
make mongo-shell       # Access MongoDB shell
```

## 🐛 Debugging

```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats

# Inspect specific container
docker inspect neighborhood-api-dev

# View health check status
docker inspect --format='{{json .State.Health}}' neighborhood-api
```

## 💾 Database Operations

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/data/backup
docker cp neighborhood-mongodb:/data/backup ./mongodb-backup

# Restore MongoDB
docker cp ./mongodb-backup neighborhood-mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup

# Connect with MongoDB Compass
mongodb://admin:admin123@localhost:27017
```

## 🌐 Services & Ports

| Service | Port | URL |
|---------|------|-----|
| API (Dev) | 5000 | http://localhost:5000 |
| API (Prod) | 5000 | http://localhost:5000 |
| MongoDB | 27017 | mongodb://admin:admin123@localhost:27017 |
| Mongo Express | 8081 | http://localhost:8081 |

## 🔐 Default Credentials

**MongoDB:**
- Username: `admin`
- Password: `admin123`
- Database: `neighborhood_helper`

**Mongo Express UI:**
- Username: `admin`
- Password: `admin`

## ⚙️ Environment Variables

Create `.env` file:

```env
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
API_URL=http://localhost:5000
WS_CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

## 🏗️ Build Stages

The Dockerfile has multiple stages:

- **development**: Hot reload, dev dependencies, source mounted
- **production**: Optimized, no dev deps, smaller image

## ⚡ Development vs Production

### Development (`--profile dev`)
- Hot reload with nodemon
- Source code mounted as volume
- Dev dependencies included
- Mongo Express UI included

### Production (`--profile prod`)
- Optimized Node.js build
- No hot reload
- Production dependencies only
- Smaller image size
- No Mongo Express

## 🔄 Full Reset

To completely reset your Docker environment:

```bash
# 1. Stop all containers
docker-compose down -v

# 2. Remove all Neighborhood Helper images
docker rmi $(docker images | grep neighborhood | awk '{print $3}')

# 3. Clean system
docker system prune -a --volumes

# 4. Rebuild from scratch
docker-compose --profile dev up --build
```

## 📊 Monitoring

```bash
# Real-time resource usage
docker stats

# Container logs (last 100 lines)
docker-compose logs --tail=100 api-dev

# Follow logs for specific service
docker-compose logs -f mongodb
```

## 🧪 Testing in Docker

```bash
# Run tests
docker-compose exec api-dev npm test

# Run with coverage
docker-compose exec api-dev npm test -- --coverage

# Run specific test file
docker-compose exec api-dev npm test -- auth.test.js
```

## 🌍 Production Deployment

1. Set strong JWT secrets in `.env`
2. Use MongoDB Atlas or managed database
3. Change `MONGODB_URI` in docker-compose.yml
4. Set `NODE_ENV=production`
5. Configure proper CORS origins
6. Add reverse proxy (Nginx)
7. Enable HTTPS

```bash
docker-compose --profile prod up -d
```

## 💡 Tips

- Use `docker-compose up -d` to run in background
- Use `docker-compose logs -f` to follow logs
- Use `docker-compose restart api-dev` to restart specific service
- Volume changes persist even after `docker-compose down`
- Use `docker-compose down -v` to delete volumes and reset data

## 🆘 Troubleshooting

**Port already in use:**
```bash
# Check what's using port 5000
lsof -i :5000
# Kill the process or change port in docker-compose.yml
```

**MongoDB connection failed:**
```bash
# Check MongoDB is running
docker-compose ps
# Check MongoDB logs
docker-compose logs mongodb
```

**Container keeps restarting:**
```bash
# Check logs for errors
docker-compose logs api-dev
```

**Out of disk space:**
```bash
# Clean up Docker
docker system prune -a --volumes
```

---

For more details, see [DOCKER.md](DOCKER.md)
