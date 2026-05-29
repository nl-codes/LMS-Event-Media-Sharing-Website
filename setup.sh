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
