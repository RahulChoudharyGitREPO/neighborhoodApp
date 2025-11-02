.PHONY: help install dev prod build up down logs clean test

# Default target
help:
	@echo "Neighborhood Helper API - Commands"
	@echo ""
	@echo "Local Development:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Run local dev server (requires MongoDB)"
	@echo "  make test          - Run tests"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-dev    - Start Docker dev environment"
	@echo "  make docker-prod   - Start Docker prod environment"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-logs   - View Docker logs"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-clean  - Remove Docker containers and volumes"
	@echo ""

# Local development
install:
	npm install

dev:
	npm run dev

test:
	npm test

# Docker commands
docker-dev:
	docker-compose --profile dev up

docker-dev-d:
	docker-compose --profile dev up -d

docker-prod:
	docker-compose --profile prod up -d

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

docker-down:
	docker-compose down

docker-clean:
	docker-compose down -v

docker-restart:
	docker-compose down
	docker-compose --profile dev up

# Database commands
db-backup:
	docker-compose exec mongodb mongodump --out=/data/backup
	docker cp neighborhood-mongodb:/data/backup ./mongodb-backup

db-restore:
	docker cp ./mongodb-backup neighborhood-mongodb:/data/backup
	docker-compose exec mongodb mongorestore /data/backup

# Utility commands
shell:
	docker-compose exec api-dev sh

mongo-shell:
	docker-compose exec mongodb mongosh -u admin -p admin123

# Quick start for first time users
quick-start:
	@echo "🚀 Starting Neighborhood Helper API..."
	@echo ""
	@echo "Choose your setup:"
	@echo "1. Docker (recommended, easiest)"
	@echo "2. Local (requires MongoDB installed)"
	@echo ""
	@read -p "Enter choice (1 or 2): " choice; \
	if [ "$$choice" = "1" ]; then \
		echo "Starting with Docker..."; \
		docker-compose --profile dev up; \
	else \
		echo "Starting local setup..."; \
		npm install && npm run dev; \
	fi
