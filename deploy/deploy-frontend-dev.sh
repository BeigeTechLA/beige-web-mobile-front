#!/bin/bash

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./deploy-frontend-dev.sh <PUBLIC_IP> [KEY_PATH] [REMOTE_USER]"
  exit 1
fi

PUBLIC_IP="$1"
KEY_PATH="${2:-/d/Revurge/Beige-web/beige-web-front-dev.pem}"
REMOTE_USER="${3:-ubuntu}"
REMOTE_DIR="/var/www/beige-web-front-dev"
ARCHIVE_NAME="next-build.tar.gz"
SSH_OPTS=(-i "$KEY_PATH" -o StrictHostKeyChecking=no -o IdentitiesOnly=yes)

SSH_TARGET="${REMOTE_USER}@${PUBLIC_IP}"

echo "Deploying Next.js app to ${PUBLIC_IP}"
echo "====================================="
echo "Remote user: ${REMOTE_USER}"
echo "Key path: ${KEY_PATH}"

if [ ! -f "$KEY_PATH" ]; then
  echo "Error: SSH key not found at $KEY_PATH"
  exit 1
fi

echo "Checking SSH connectivity..."
ssh "${SSH_OPTS[@]}" -o BatchMode=yes "$SSH_TARGET" "echo SSH_OK" >/dev/null

# ----------------------------
# Step 1: Install modules + local build
# ----------------------------
echo "[1/3] Installing dependencies..."
if [ -f "package-lock.json" ]; then
  npm ci --legacy-peer-deps
else
  npm install
fi

echo "[1/3] Building project locally..."
npm run build
echo "Local build completed."

# ----------------------------
# Step 2: Package standalone build
# ----------------------------
echo "[2/3] Packaging standalone build output..."

ARCHIVE_ITEMS=(
  ".next/standalone"
  ".next/static"
)

[ -d "public" ] && ARCHIVE_ITEMS+=("public")
[ -f ".env.production" ] && ARCHIVE_ITEMS+=(".env.production")
[ -f ".env" ] && ARCHIVE_ITEMS+=(".env")

tar czf "$ARCHIVE_NAME" \
  --exclude=".next/cache" \
  "${ARCHIVE_ITEMS[@]}"

ARCHIVE_SIZE_MB=$(du -m "$ARCHIVE_NAME" | cut -f1 || true)
echo "Archive created: ${ARCHIVE_NAME} (${ARCHIVE_SIZE_MB:-unknown} MB)"

# ----------------------------
# Step 3: Upload code + deploy
# ----------------------------
echo "[3/3] Uploading archive to server..."
scp "${SSH_OPTS[@]}" "$ARCHIVE_NAME" "${SSH_TARGET}:/tmp/"

echo "[3/3] Deploying on server..."
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
  set -e
  mkdir -p \"$REMOTE_DIR\"
  rm -rf \"$REMOTE_DIR\"/*
  tar xzf /tmp/$ARCHIVE_NAME -C \"$REMOTE_DIR\"

  mkdir -p \"$REMOTE_DIR/.next/standalone/.next\"

  # Copy static assets
  cp -r \"$REMOTE_DIR/.next/static\" \"$REMOTE_DIR/.next/standalone/.next/\"
  if [ -d \"$REMOTE_DIR/public\" ]; then
    cp -r \"$REMOTE_DIR/public\" \"$REMOTE_DIR/.next/standalone/\"
  fi


  cd \"$REMOTE_DIR/.next/standalone\"

  pm2 delete beige-web-dev >/dev/null 2>&1 || true
  NODE_ENV=production pm2 start server.js --name beige-web-dev
  pm2 save

  rm -f /tmp/$ARCHIVE_NAME
"

rm -f "$ARCHIVE_NAME"

echo "Deployment complete."
echo "Access: http://${PUBLIC_IP}"
