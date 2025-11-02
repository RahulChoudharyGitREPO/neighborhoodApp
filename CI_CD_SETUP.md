# CI/CD Setup Guide

Complete guide to set up **Continuous Integration** and **Continuous Deployment** for the Neighborhood Helper API.

---

## 📋 Table of Contents

1. [GitHub Actions Setup](#github-actions)
2. [GitLab CI/CD Setup](#gitlab-cicd)
3. [Docker Hub Setup](#docker-hub)
4. [Server Deployment Setup](#server-deployment)
5. [Environment Secrets](#environment-secrets)
6. [Testing the Pipeline](#testing)

---

## 🔧 **GitHub Actions** (Recommended)

### What It Does

Your pipeline will:
1. ✅ Run tests on every push/PR
2. ✅ Build Docker image on main branch
3. ✅ Push image to Docker Hub
4. ✅ Deploy to production server (optional)

### Setup Steps

#### 1. **Enable GitHub Actions**

Already done! Files created:
- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/deploy.yml` - Deployment pipeline

#### 2. **Set Up Docker Hub**

**Create Docker Hub account:**
1. Go to [Docker Hub](https://hub.docker.com/)
2. Sign up / Log in
3. Create repository: `neighborhood-helper-api`

**Get credentials:**
- Username: Your Docker Hub username
- Password: Create access token at [Docker Hub Tokens](https://hub.docker.com/settings/security)

#### 3. **Add GitHub Secrets**

Go to your GitHub repo:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

| Secret Name | Value | Required For |
|-------------|-------|--------------|
| `DOCKER_USERNAME` | Your Docker Hub username | ✅ Build |
| `DOCKER_PASSWORD` | Your Docker Hub access token | ✅ Build |
| `DEPLOY_HOST` | Your server IP or domain | Deploy only |
| `DEPLOY_USER` | SSH username (e.g., `ubuntu`) | Deploy only |
| `DEPLOY_SSH_KEY` | Private SSH key | Deploy only |
| `DEPLOY_PATH` | App path (e.g., `/opt/neighborhood-helper`) | Deploy only |
| `DEPLOY_URL` | Production URL (e.g., `https://api.yourdomain.com`) | Deploy only |

#### 4. **Push to GitHub**

```bash
git add .
git commit -m "Add CI/CD pipelines"
git push origin main
```

#### 5. **Watch It Run!**

1. Go to **Actions** tab in GitHub
2. Watch your pipeline run
3. See tests, builds, and deployments

---

## 🦊 **GitLab CI/CD**

### Setup Steps

#### 1. **Enable GitLab CI/CD**

Already done! File created: `.gitlab-ci.yml`

#### 2. **Set Up GitLab Container Registry**

GitLab has built-in Docker registry!

**Enable it:**
1. Go to **Settings** → **CI/CD** → **Container Registry**
2. Enable Container Registry

#### 3. **Add GitLab CI/CD Variables**

Go to your GitLab repo:
1. Click **Settings** → **CI/CD** → **Variables**
2. Click **Add variable**

Add these variables:

| Variable Name | Value | Protected | Masked |
|---------------|-------|-----------|--------|
| `STAGING_HOST` | Staging server IP | ❌ | ❌ |
| `STAGING_USER` | SSH username | ❌ | ❌ |
| `STAGING_SSH_KEY` | Private SSH key | ✅ | ✅ |
| `PRODUCTION_HOST` | Production server IP | ✅ | ❌ |
| `PRODUCTION_USER` | SSH username | ✅ | ❌ |
| `PRODUCTION_SSH_KEY` | Private SSH key | ✅ | ✅ |

#### 4. **Push to GitLab**

```bash
git add .
git commit -m "Add GitLab CI/CD pipeline"
git push origin main
```

#### 5. **Watch Pipeline**

1. Go to **CI/CD** → **Pipelines**
2. See your pipeline run

---

## 🐳 **Docker Hub Setup**

### Option 1: Docker Hub (Public)

**Create repository:**
1. Go to [Docker Hub](https://hub.docker.com/)
2. Click **Create Repository**
3. Name: `neighborhood-helper-api`
4. Visibility: Public or Private
5. Click **Create**

**Your image will be:**
```
yourusername/neighborhood-helper-api:latest
```

### Option 2: GitHub Container Registry (GHCR)

**Update `.github/workflows/ci.yml`:**

```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
```

**Your image will be:**
```
ghcr.io/yourusername/neighborhood-helper-api:latest
```

### Option 3: GitLab Container Registry

GitLab automatically pushes to:
```
registry.gitlab.com/yourusername/neighborhood-helper-api:latest
```

No extra setup needed!

---

## 🚀 **Server Deployment Setup**

### Prepare Your Production Server

#### 1. **Set Up Server**

**Requirements:**
- Ubuntu 20.04+ / Debian / CentOS
- Docker installed
- Docker Compose installed
- SSH access

**Install Docker:**
```bash
# Update packages
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Verify
docker --version
docker compose version
```

#### 2. **Create App Directory**

```bash
sudo mkdir -p /opt/neighborhood-helper
sudo chown $USER:$USER /opt/neighborhood-helper
cd /opt/neighborhood-helper
```

#### 3. **Clone Repository**

```bash
git clone <your-repo-url> .
```

#### 4. **Create Production `.env`**

```bash
nano .env
```

Add:
```env
NODE_ENV=production
PORT=5000
API_URL=https://api.yourdomain.com

# MongoDB (use Atlas for production)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/neighborhood_helper

# Strong secrets!
JWT_ACCESS_SECRET=<generate-strong-random-secret-32-chars>
JWT_REFRESH_SECRET=<generate-strong-random-secret-32-chars>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# CORS
WS_CORS_ORIGIN=https://yourdomain.com
```

#### 5. **Set Up SSH Key for CI/CD**

On your **local machine**:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/deploy_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/deploy_key.pub user@your-server-ip

# Print private key (copy this to GitHub Secrets)
cat ~/.ssh/deploy_key
```

Add the private key to GitHub Secrets as `DEPLOY_SSH_KEY`

#### 6. **Start the App**

```bash
docker compose --profile prod up -d
```

#### 7. **Set Up Nginx (Optional)**

**Install Nginx:**
```bash
sudo apt install nginx
```

**Create config:**
```bash
sudo nano /etc/nginx/sites-available/neighborhood-helper
```

Add:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/neighborhood-helper /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 8. **Set Up SSL (HTTPS)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

---

## 🔐 **Environment Secrets Reference**

### GitHub Actions Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `DOCKER_USERNAME` | Docker Hub username | `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub token | `dckr_pat_xxx...` |
| `DEPLOY_HOST` | Server IP/domain | `123.45.67.89` |
| `DEPLOY_USER` | SSH username | `ubuntu` |
| `DEPLOY_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | App directory | `/opt/neighborhood-helper` |
| `DEPLOY_PORT` | SSH port (optional) | `22` |
| `DEPLOY_URL` | Production URL | `https://api.yourdomain.com` |

### GitLab CI/CD Variables

Same as GitHub, but prefix with environment:
- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `PRODUCTION_SSH_KEY`

---

## 🧪 **Testing the Pipeline**

### Test Locally First

**Run tests:**
```bash
npm test
```

**Build Docker image:**
```bash
docker build --target production -t neighborhood-helper-api:test .
```

**Run Docker image:**
```bash
docker run -p 5000:5000 \
  -e MONGODB_URI="mongodb://localhost:27017/test" \
  -e JWT_ACCESS_SECRET="test-secret" \
  -e JWT_REFRESH_SECRET="test-secret" \
  neighborhood-helper-api:test
```

### Test CI/CD Pipeline

**1. Create feature branch:**
```bash
git checkout -b test-cicd
```

**2. Make a small change:**
```bash
echo "# Test CI/CD" >> README.md
git add .
git commit -m "Test CI/CD pipeline"
```

**3. Push:**
```bash
git push origin test-cicd
```

**4. Create Pull Request**

Watch GitHub Actions run tests!

**5. Merge to main**

Watch it build Docker image and deploy!

---

## 📊 **Pipeline Overview**

### GitHub Actions Pipeline

```
┌─────────────────────────────────────────────────┐
│                 PUSH TO MAIN                    │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────▼───────────┐
    │   1. Run Tests         │
    │   - npm ci             │
    │   - npm test           │
    │   - Upload coverage    │
    └────────────┬───────────┘
                 │
    ┌────────────▼───────────┐
    │   2. Build Docker      │
    │   - Build image        │
    │   - Tag with SHA       │
    │   - Push to registry   │
    └────────────┬───────────┘
                 │
    ┌────────────▼───────────┐
    │   3. Deploy (Optional) │
    │   - SSH to server      │
    │   - Pull new image     │
    │   - Restart containers │
    │   - Health check       │
    └────────────────────────┘
```

### What Runs When

| Event | Tests | Build | Deploy |
|-------|-------|-------|--------|
| Push to PR | ✅ | ❌ | ❌ |
| Push to develop | ✅ | ✅ | ❌ |
| Push to main | ✅ | ✅ | ✅ (if configured) |
| Create tag v* | ✅ | ✅ | ✅ |
| Manual trigger | ❌ | ❌ | ✅ |

---

## 🎯 **Deployment Strategies**

### Strategy 1: Direct Deployment (Simple)

On every push to main:
1. Build image
2. Push to registry
3. SSH to server
4. Pull image
5. Restart

**Pros:** Simple, fast
**Cons:** Brief downtime (~10 seconds)

### Strategy 2: Blue-Green Deployment

Run two versions:
1. Deploy to "blue" environment
2. Test
3. Switch traffic from "green" to "blue"
4. Keep "green" as backup

**Pros:** Zero downtime, easy rollback
**Cons:** More complex, more resources

### Strategy 3: Rolling Deployment

Update one instance at a time:
1. Deploy to instance 1
2. Check health
3. Deploy to instance 2
4. Repeat...

**Pros:** Zero downtime, gradual
**Cons:** Complex orchestration

---

## 🔄 **Rollback Process**

### Manual Rollback

```bash
# SSH to server
ssh user@server

# View image history
docker images

# Run previous version
docker compose down
docker run -d previous-image-tag

# Or using git
git checkout <previous-commit>
docker compose --profile prod up -d --build
```

### Automated Rollback

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'EOF'
      docker compose down
      docker run -d <previous-stable-image>
    EOF
```

---

## 📈 **Monitoring & Alerts**

### Add Health Checks

Your API already has `/health` endpoint!

### Set Up Monitoring

**Option 1: Uptime Robot** (Free)
1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Add monitor: `https://api.yourdomain.com/health`
3. Get alerts via email/Slack/Discord

**Option 2: Better Uptime** (Free tier)
1. Go to [Better Uptime](https://betteruptime.com/)
2. Add monitor
3. Get alerts and status page

**Option 3: Self-hosted**
- Prometheus + Grafana
- Netdata

---

## 📝 **Best Practices**

### 1. **Use Tags for Releases**

```bash
# Create version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Triggers production deployment automatically!

### 2. **Separate Environments**

- `develop` branch → Staging environment
- `main` branch → Production environment

### 3. **Require Manual Approval for Production**

In `.github/workflows/deploy.yml`:
```yaml
deploy:
  environment:
    name: production
    url: https://api.yourdomain.com
  # GitHub requires manual approval for "production" environment
```

### 4. **Run Tests Before Merge**

Enable branch protection:
- GitHub Settings → Branches → Add rule
- Require status checks to pass
- Require CI to pass before merging

### 5. **Use Secrets Management**

Never commit secrets! Use:
- GitHub Secrets
- GitLab CI/CD Variables
- AWS Secrets Manager
- HashiCorp Vault

---

## ✅ **Verification Checklist**

After setting up CI/CD:

- [ ] Tests run on every PR
- [ ] Tests pass before merging
- [ ] Docker image builds on main branch
- [ ] Image pushed to registry
- [ ] Can pull image manually
- [ ] Deployment works (if configured)
- [ ] Health check passes after deployment
- [ ] SSL/HTTPS works
- [ ] Monitoring set up
- [ ] Alerts configured

---

## 🆘 **Troubleshooting**

### Tests Failing in CI

**Check logs in Actions/Pipelines tab**

Common issues:
- MongoDB not ready → Add health check wait
- Environment variables missing → Check secrets
- Different Node version → Specify in workflow

### Docker Build Failing

```bash
# Test locally first
docker build --target production -t test .
```

### Deployment Failing

**SSH issues:**
```bash
# Test SSH access
ssh -i deploy_key user@server

# Check SSH key format (no spaces, newlines)
```

**Docker issues on server:**
```bash
# Check Docker status
docker ps
docker compose ps

# Check logs
docker compose logs api
```

### Image Not Found

**Check Docker Hub/Registry:**
- Is image pushed?
- Is name correct?
- Are credentials valid?

---

## 🎉 **You're Done!**

Your CI/CD pipeline is set up! Every push to main will now:
1. ✅ Run tests
2. ✅ Build Docker image
3. ✅ Push to registry
4. ✅ Deploy to production (if configured)

**Zero-downtime deployments with one `git push`!** 🚀

---

## 📚 **Additional Resources**

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitLab CI/CD Docs](https://docs.gitlab.com/ee/ci/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

Happy deploying! 😊
