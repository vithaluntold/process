# EPI-Q - Docker Deployment Guide

Complete guide for deploying EPI-Q using Docker with enterprise-grade security and portability across any platform.

## 🚀 Quick Start

### Prerequisites
- Docker Engine 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ (included with Docker Desktop)
- 2GB RAM minimum, 4GB recommended
- 5GB disk space

### 1. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd epi-q

# Create environment file from template
cp .env.example .env

# Edit .env with your secure values
nano .env
```

### 2. Generate Secure Secrets

```bash
# Generate AUTH_SECRET and SESSION_SECRET (use same value)
export SECRET=$(openssl rand -base64 32)
echo "AUTH_SECRET=$SECRET"
echo "SESSION_SECRET=$SECRET"

# Generate MASTER_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate secure database password
openssl rand -base64 24
```

**Important:** SESSION_SECRET is required. If you omit it, the container will fail to start. For simplicity, use the same value as AUTH_SECRET.

Update your `.env` file with these generated values.

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

Your application will be available at: **http://localhost:5000**

## 🔒 Security Features

### Built-in Security Hardening

1. **Multi-stage Build** - Minimal production image (~150MB vs ~1.2GB)
2. **Non-root User** - Application runs as `nextjs` user (UID 1001)
3. **Read-only Filesystem** - Critical components are read-only
4. **Capability Dropping** - Only essential Linux capabilities enabled
5. **Resource Limits** - CPU and memory constraints prevent resource exhaustion
6. **Health Checks** - Automatic container restart on failure
7. **Security Options** - `no-new-privileges` flag prevents privilege escalation
8. **Dependency Scanning** - Use `docker scout` for vulnerability detection

### Environment Variable Security

**Never commit `.env` files to version control!**

```bash
# Add to .gitignore (already included)
.env
.env.local
.env.production
```

**For production deployments, use:**
- Docker secrets (Docker Swarm)
- Kubernetes secrets
- Cloud provider secret managers (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager)
- HashiCorp Vault

### Network Security

```yaml
# Configure reverse proxy with SSL/TLS
# Example: nginx reverse proxy configuration
server {
    listen 443 ssl http2;
    server_name epi-q.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📦 Docker Commands Reference

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app
docker-compose logs -f database

# Execute commands in running container
docker-compose exec app sh
docker-compose exec database psql -U epi-q
```

### Database Management

```bash
# Backup database
docker-compose exec database pg_dump -U epi-q epi-q > backup.sql

# Restore database
docker-compose exec -T database psql -U epi-q epi-q < backup.sql

# Run database migrations (push schema)
docker-compose exec app pnpm run db:push

# Force database schema sync
docker-compose exec app pnpm run db:push --force
```

### Monitoring

```bash
# Check container health
docker-compose ps

# View resource usage
docker stats epi-q-app epi-q-database

# Inspect container details
docker inspect epi-q-app

# Check container logs (last 100 lines)
docker-compose logs --tail=100 app
```

## 🌍 Platform-Specific Deployment

### AWS EC2 / DigitalOcean / Linode

```bash
# SSH into server
ssh user@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone <your-repo>
cd epi-q
cp .env.example .env
nano .env  # Configure secrets
docker-compose up -d
```

### Azure Container Instances

```bash
# Login to Azure
az login

# Create resource group
az group create --name epi-q-rg --location eastus

# Deploy container
az container create \
  --resource-group epi-q-rg \
  --name epi-q-app \
  --image <your-registry>/epi-q:latest \
  --dns-name-label epi-q \
  --ports 5000 \
  --environment-variables \
    DATABASE_URL="..." \
    AUTH_SECRET="..." \
    MASTER_ENCRYPTION_KEY="..."
```

### Google Cloud Run

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/epi-q

# Deploy to Cloud Run
gcloud run deploy epi-q \
  --image gcr.io/PROJECT-ID/epi-q \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="...",AUTH_SECRET="..."
```

### Kubernetes

```bash
# Create namespace
kubectl create namespace epi-q

# Create secrets
kubectl create secret generic epi-q-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=AUTH_SECRET="..." \
  --from-literal=MASTER_ENCRYPTION_KEY="..." \
  -n epi-q

# Apply deployment
kubectl apply -f k8s/deployment.yaml -n epi-q

# Expose service
kubectl apply -f k8s/service.yaml -n epi-q
```

## 🔄 Production Best Practices

### 1. Use Reverse Proxy

Always deploy behind a reverse proxy (nginx, Traefik, Caddy) for:
- SSL/TLS termination
- Rate limiting
- Load balancing
- DDoS protection

### 2. Enable Logging

```yaml
# docker-compose.yml - Add logging configuration
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. Automated Backups

```bash
# Cron job for daily database backups
0 2 * * * docker-compose exec -T database pg_dump -U epi-q epi-q | gzip > /backups/epi-q-$(date +\%Y\%m\%d).sql.gz
```

### 4. Update Strategy

```bash
# Zero-downtime updates
docker-compose pull
docker-compose up -d --no-deps --build app
docker image prune -f
```

### 5. Monitoring Integration

```yaml
# Add Prometheus metrics endpoint
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep DATABASE_URL

# Verify health
docker-compose ps
```

### Database connection issues

```bash
# Test database connectivity
docker-compose exec app sh -c 'nc -zv database 5432'

# Check database logs
docker-compose logs database

# Verify credentials
docker-compose exec database psql -U epi-q -c '\l'
```

### Performance issues

```bash
# Check resource usage
docker stats

# Increase memory limit in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 4G
```

### Build failures

```bash
# Clear build cache
docker-compose build --no-cache

# Remove all containers and rebuild
docker-compose down -v
docker-compose up -d --build
```

## 🔐 Security Checklist

- [ ] Generated strong secrets (AUTH_SECRET, MASTER_ENCRYPTION_KEY)
- [ ] `.env` file excluded from version control
- [ ] Database password changed from default
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSL/TLS certificate installed
- [ ] Regular security updates enabled
- [ ] Database backups automated
- [ ] Container health checks configured
- [ ] Resource limits set
- [ ] Non-root user running application
- [ ] Vulnerability scanning enabled (`docker scout`)

## 📊 Monitoring Endpoints

- **Health Check**: `http://localhost:5000/api/health`
- **Application**: `http://localhost:5000`
- **Database**: `postgresql://localhost:5432/epi-q`

## 🆘 Support

For issues or questions:
1. Check container logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Review this documentation
4. Check GitHub Issues

## 📝 License

See LICENSE file in the repository.

---

**EPI-Q** - Enterprise Process Intelligence & Automation Platform
