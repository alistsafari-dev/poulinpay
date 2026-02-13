# Docker Deployment on VPS

## 1) Prerequisites on VPS
- Ubuntu 22.04/24.04
- Docker + Docker Compose plugin installed
- Domain DNS `A` record pointed to VPS IP

## 2) Upload project
```bash
git clone <your-repo-url> paylinker
cd paylinker
```

## 3) Configure environment
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set at least:
- `DJANGO_SECRET_KEY` (long random)
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com`
- `CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
- `CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`
- `POSTGRES_PASSWORD` (strong password)

## 4) Build and run
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

App will be available on:
- `http://<VPS_IP>`

## 5) Update after code changes
```bash
git pull
docker compose up -d --build
```

## 6) Useful commands
```bash
docker compose logs -f
docker compose logs -f web
docker compose exec web python manage.py createsuperuser
docker compose down
```

## 7) HTTPS (recommended)
Current setup exposes port `80` via Nginx container. For SSL, use one of:
- Cloudflare proxy + SSL
- Host-level Nginx/Caddy reverse proxy with Let's Encrypt
- Add Certbot-based SSL in container stack (separate compose override)
