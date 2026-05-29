# LMS System Configuration & Setup Guide

This guide explains how to configure and run **LMS (Live Media Sharing)** from a fresh clone to a working local development environment.

LMS is a full-stack event media sharing platform. The backend provides REST APIs, authentication, media upload, real-time sockets, background jobs, payments, moderation, and notifications. The frontend provides the event, gallery, chat, dashboard, checkout, and admin user interface.

## 1. Project Stack

| Area | Technology |
| --- | --- |
| Project name | LMS (Live Media Sharing) |
| Repository type | Full-stack monorepo |
| Backend runtime | Node.js 20 LTS or newer |
| Backend framework | Express.js 5 |
| Frontend runtime | Node.js 20 LTS or newer |
| Frontend framework | Next.js 16, React 19, TypeScript |
| Database | MongoDB with Mongoose |
| Queue/cache service | Redis for BullMQ background jobs |
| Real-time transport | Socket.IO |
| Media storage | Cloudinary |
| Payments | Stripe Checkout and Stripe webhooks |
| Email | Nodemailer with Mailtrap or SMTP-compatible service |
| Package manager | npm |

## 2. Prerequisites

Install the following tools before running the project.

| Tool | Recommended version | Purpose |
| --- | --- | --- |
| Git | 2.40+ | Clone and manage the repository |
| Node.js | 20 LTS or 22 LTS | Run backend and frontend applications |
| npm | 10+ | Install JavaScript dependencies |
| MongoDB | 7+ or MongoDB Atlas | Store users, events, media metadata, chats, reports, notifications, and payments |
| Redis | 7+ | Run BullMQ queues for video processing, event sync, cleanup, retention, and highlights |
| Stripe CLI | Latest, optional but recommended | Forward local Stripe webhooks during development |
| Cloudinary account | Active account | Store uploaded images and videos |
| Mailtrap or SMTP account | Active account | Send activation, password reset, and notification emails |

FFmpeg is used for video processing through the `ffmpeg-static` npm package, so a system-wide FFmpeg install is not required for normal local setup.

## 3. Clone the Repository

```bash
git clone https://github.com/nl-codes/lms---Event-Media-Sharing-Website.git
cd lms---Event-Media-Sharing-Website
```

If the repository is already available locally, move into the project root:

```bash
cd /path/to/lms
```

The expected structure is:

```text
lms/
  backend/
  frontend/
  docs/
  report/
  README.md
```

## 4. Configure Environment Files

Create local environment files from the included examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend Environment Template

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3000

DB_CONNECTION_STRING=mongodb://127.0.0.1:27017/lms
JWT_SECRET_KEY=replace_with_a_long_random_secret

REDIS_URL=redis://127.0.0.1:6379

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_password
EMAIL_FROM=no-reply@lms.local

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_local_webhook_secret

DISABLE_HIGHLIGHT_WORKER=true

FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

Notes:

- `DISABLE_HIGHLIGHT_WORKER=true` is recommended for first local setup because highlight generation uses heavier AI-related dependencies.
- Set `DISABLE_HIGHLIGHT_WORKER=false` or remove it when you want the highlight worker to run.
- `FRONTEND_URL` must match the frontend dev server URL because backend CORS and Socket.IO use it.
- `PORT` must be set. The backend reads `process.env.PORT` directly.

### Frontend Environment Template

Edit `frontend/.env`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:8080
JWT_SECRET_KEY=replace_with_the_same_or_frontend_compatible_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

Notes:

- `NEXT_PUBLIC_BACKEND_URL` must point to the Express backend.
- `NEXT_PUBLIC_FRONTEND_URL` must point to the Next.js frontend.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe to expose in the browser, but it should still come from your Stripe test dashboard for development.

## 5. Start Required Local Services

### MongoDB

If MongoDB is installed locally:

```bash
mongod --dbpath /path/to/your/mongodb/data
```

On macOS with Homebrew:

```bash
brew services start mongodb-community
```

You can also use MongoDB Atlas. In that case, set `DB_CONNECTION_STRING` to the Atlas connection string.

### Redis

If Redis is installed locally:

```bash
redis-server
```

On macOS with Homebrew:

```bash
brew services start redis
```

Confirm Redis is responding:

```bash
redis-cli ping
```

Expected output:

```text
PONG
```

## 6. Install Dependencies

Install backend dependencies:

```bash
cd backend
npm ci
```

Install frontend dependencies:

```bash
cd ../frontend
npm ci
```

Return to the project root:

```bash
cd ..
```

Use `npm install` instead of `npm ci` only when package lock files need to be regenerated.

## 7. Database Initialization, Migration, and Seed Setup

This project uses MongoDB with Mongoose models. There is no SQL-style migration step. Collections are created automatically when the application writes data for the first time.

### 7.1 Verify MongoDB Connection

Start the backend once after configuring `backend/.env`:

```bash
cd backend
npm run dev
```

Look for:

```text
MongoDB connected.
Server is running on port 3000
```

Stop the server with `Ctrl+C` before running setup scripts.

### 7.2 Create the SuperAdmin User

The backend includes an interactive script for creating or replacing the singleton SuperAdmin account:

```bash
cd backend
npm run setup:superadmin
```

The script will ask for:

- SuperAdmin email
- Password
- Username

Use this account to access administrative features.

### 7.3 Optional Existing Data Migration

If you are upgrading an older dataset where media likes were stored directly on media documents, run:

```bash
cd backend
npm run migrate:media-likes
```

For a fresh development database, this migration is usually not required.

## 8. Stripe Webhook Setup for Local Development

Stripe checkout confirmation depends on webhook events. Install and log in to the Stripe CLI:

```bash
stripe login
```

Forward webhooks to the backend:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copy the generated `whsec_...` value into:

```env
STRIPE_WEBHOOK_SECRET=whsec_generated_by_stripe_cli
```

Restart the backend after changing the environment file.

## 9. Run the Application

Use two terminals.

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

Backend URL:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok","uptime":123.45}
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

```text
http://localhost:8080
```

For LAN testing from another device on the same network:

```bash
cd frontend
npm run lan
```

If you use LAN mode, also add the LAN frontend URL to the backend environment if needed:

```env
FRONTEND_LAN_URL=http://your-local-ip:8080
```

Then restart the backend.

## 10. Build and Production Smoke Test

Build the frontend:

```bash
cd frontend
npm run build
```

Start the production frontend server:

```bash
npm run start
```

Start the backend in production-style mode:

```bash
cd ../backend
npm start
```

For production deployment, use a process manager or hosting platform that keeps both backend and frontend processes alive.

## 11. Common Troubleshooting

### Backend starts but CORS blocks frontend requests

Check that these values match exactly:

```env
# backend/.env
FRONTEND_URL=http://localhost:8080

# frontend/.env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:8080
```

Restart both servers after changing environment variables.

### Backend prints `Server is running on port undefined`

Set `PORT` in `backend/.env`:

```env
PORT=3000
```

### MongoDB connection fails

Check `DB_CONNECTION_STRING`.

For local MongoDB:

```env
DB_CONNECTION_STRING=mongodb://127.0.0.1:27017/lms
```

Also confirm MongoDB is running:

```bash
mongosh --eval "db.adminCommand({ ping: 1 })"
```

### Redis connection errors appear in backend logs

BullMQ workers require Redis. Start Redis and confirm:

```bash
redis-cli ping
```

If Redis is running on a different host or port, update:

```env
REDIS_URL=redis://host:port
```

### Video uploads remain in processing state

Video processing depends on Redis queues and the video worker. Confirm:

- Redis is running.
- Backend was restarted after Redis became available.
- The uploaded file fits the tier limits.
- The backend process has permission to write temporary upload files.

### Highlight worker fails on local machine

For normal development, disable it:

```env
DISABLE_HIGHLIGHT_WORKER=true
```

The API can still run without the highlight worker. Premium highlight jobs will not process until the worker is enabled and healthy.

### Stripe checkout works but upgrade is not applied

Most likely the webhook is not reaching the backend.

Run:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Then copy the CLI webhook secret into `STRIPE_WEBHOOK_SECRET` and restart the backend.

### Cloudinary upload fails

Check:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- File size limits for the event tier
- Network access from the backend process

### Emails do not send

Check:

- `MAILTRAP_HOST`
- `MAILTRAP_PORT`
- `MAILTRAP_USER`
- `MAILTRAP_PASS`
- `EMAIL_FROM`

For local development, Mailtrap sandbox credentials are recommended.

### Frontend environment changes are not reflected

Next.js reads environment variables at server start. Restart the frontend dev server after editing `frontend/.env`.

### Port already in use

Find the process:

```bash
lsof -i :3000
lsof -i :8080
```

Either stop the process or update the port and matching environment URLs.

## 12. setup.sh

Save the following script as `setup.sh` in the project root, or use the included `setup.sh` file if it is already present.

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

info() {
  printf "\033[1;34m[INFO]\033[0m %s\n" "$1"
}

warn() {
  printf "\033[1;33m[WARN]\033[0m %s\n" "$1"
}

fail() {
  printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"
  exit 1
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "$1 is required but was not found in PATH."
  fi
}

version_major() {
  "$1" --version 2>/dev/null | sed -E 's/[^0-9]*([0-9]+).*/\1/'
}

info "Checking required tools..."
need_cmd git
need_cmd node
need_cmd npm

NODE_MAJOR="$(version_major node)"
if [ "${NODE_MAJOR:-0}" -lt 20 ]; then
  fail "Node.js 20 or newer is required. Current version: $(node --version)"
fi

NPM_MAJOR="$(version_major npm)"
if [ "${NPM_MAJOR:-0}" -lt 10 ]; then
  warn "npm 10+ is recommended. Current version: $(npm --version)"
fi

if command -v mongosh >/dev/null 2>&1; then
  info "MongoDB shell found."
else
  warn "mongosh was not found. Use MongoDB Atlas or install MongoDB locally."
fi

if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli ping >/dev/null 2>&1; then
    info "Redis is running."
  else
    warn "redis-cli exists, but Redis is not responding. Start Redis before running background jobs."
  fi
else
  warn "redis-cli was not found. Install Redis locally or configure REDIS_URL for a remote Redis instance."
fi

if command -v stripe >/dev/null 2>&1; then
  info "Stripe CLI found."
else
  warn "Stripe CLI not found. Install it if you need local webhook forwarding."
fi

info "Creating environment files when missing..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  info "Created backend/.env from backend/.env.example"
else
  info "backend/.env already exists; leaving it unchanged."
fi

if [ ! -f "$FRONTEND_DIR/.env" ]; then
  cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
  info "Created frontend/.env from frontend/.env.example"
else
  info "frontend/.env already exists; leaving it unchanged."
fi

info "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci

info "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm ci

info "Checking important environment values..."
cd "$ROOT_DIR"

check_env_key() {
  local file="$1"
  local key="$2"
  if ! grep -q "^${key}=.\+" "$file"; then
    warn "$key is empty or missing in $file"
  fi
}

check_env_key "$BACKEND_DIR/.env" "PORT"
check_env_key "$BACKEND_DIR/.env" "DB_CONNECTION_STRING"
check_env_key "$BACKEND_DIR/.env" "JWT_SECRET_KEY"
check_env_key "$BACKEND_DIR/.env" "REDIS_URL"
check_env_key "$BACKEND_DIR/.env" "FRONTEND_URL"
check_env_key "$BACKEND_DIR/.env" "BACKEND_URL"
check_env_key "$FRONTEND_DIR/.env" "NEXT_PUBLIC_BACKEND_URL"
check_env_key "$FRONTEND_DIR/.env" "NEXT_PUBLIC_FRONTEND_URL"
check_env_key "$FRONTEND_DIR/.env" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"

cat <<'NEXT_STEPS'

Setup check complete.

Next steps:
1. Fill backend/.env and frontend/.env with real local credentials.
2. Start MongoDB and Redis.
3. Create a SuperAdmin:
   cd backend && npm run setup:superadmin
4. Start backend:
   cd backend && npm run dev
5. Start frontend in another terminal:
   cd frontend && npm run dev
6. Open:
   http://localhost:8080

NEXT_STEPS
```
