# Deploy Guide (Production Ready)

This guide documents how to deploy AdScale to a production environment using Docker Compose.

## 1. Prerequisites (Server)
You need a VPS or Server (e.g., AWS EC2, DigitalOcean Droplet, Hetzner, Render) with:
- **OS**: Ubuntu 22.04 LTS (Recommended)
- **RAM**: Minimum 2GB (4GB recommended for Celery/Redis)
- **Software**: Docker & Docker Compose

### Installing Docker on Ubuntu
```bash
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
sudo systemctl enable --now docker
```

## 2. Environment Variables (.env)
Create a `.env` file on the server with production values. 
**NEVER** commit this file to Git.

```env
# Database (Postgres)
POSTGRES_USER=adscale_admin
POSTGRES_PASSWORD=COMPLEX_SERVER_PASSWORD_HERE
POSTGRES_DB=adscale_prod
DATABASE_URL=postgresql+asyncpg://adscale_admin:COMPLEX_SERVER_PASSWORD_HERE@db:5432/adscale_prod

# Redis
REDIS_URL=redis://redis:6379/0

# Security (Generate new ones!)
SECRET_KEY=GENERATE_A_LONG_RANDOM_STRING_HERE
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Stripe (Live Keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Deployment Steps

### Option A: Using Git (Recommended)
1. Clone the repository on the server:
   ```bash
   git clone https://github.com/your-repo/adscale.git
   cd adscale
   ```
2. Create the `.env` file (copied from above).
3. Build and Run:
   ```bash
   docker compose up -d --build
   ```

### Option B: Cloud Services (Render/Railway)
Most PaaS providers will auto-detect the `docker-compose.yml` or `Dockerfile`.
1. Connect your GitHub repo.
2. Add the Environment Variables in their dashboard.
3. Deploy.
   * **Note for Render:** You might need to deploy the DB/Redis purely as managed services and update `DATABASE_URL` and `REDIS_URL` accordingly, or use a `render.yaml` blueprint.

## 4. Post-Deployment Checks

1. **Database Migration**:
   On the first run, the app validates the tables. Check logs:
   ```bash
   docker compose logs api
   ```
   Look for: `Database initialized.`

2. **Create Admin User**:
   Access the container to create your first admin:
   ```bash
   docker compose exec api python reset_admin.py
   ```
   (Or use the `/register` endpoint if not disabled).

3. **Check Celery Workers**:
   Ensure background tasks are processing:
   ```bash
   docker compose logs worker
   ```

## 5. Maintenance
- **Update Code**: `git pull && docker compose up -d --build`
- **Backup DB**: `docker compose exec db pg_dump -U adscale_admin adscale_prod > backup.sql`
