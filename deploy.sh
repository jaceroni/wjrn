#!/bin/bash

# Configuration
KEY="/Users/jacebrown/Dropbox/Jacewon/Radio/newradiokey.pem"
USER="ubuntu"
HOST="208.113.165.231"
REMOTE_DIR="/var/www/wjrn-landing"

# ── Git: commit & push to dev before building ────────────────────────────────
COMMIT_MSG="${1:-"deploy: $(date '+%Y-%m-%d %H:%M')"}"

echo "=== Committing changes to dev branch ==="
git add -A
git diff --cached --quiet && echo "(nothing new to commit)" || git commit -m "$COMMIT_MSG"
git push origin dev

if [ $? -ne 0 ]; then
  echo "Warning: Git push to dev failed — continuing with deploy anyway."
fi
# ─────────────────────────────────────────────────────────────────────────────

echo "=== Building React project locally ==="
npm run build

if [ $? -ne 0 ]; then
  echo "Error: Local build failed. Deployment aborted."
  exit 1
fi

echo "=== Ensuring remote directories exist on DreamCompute ==="
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$USER@$HOST" "sudo mkdir -p $REMOTE_DIR && sudo chown -R ubuntu:ubuntu $REMOTE_DIR"

if [ $? -ne 0 ]; then
  echo "Error: Failed to connect to server or set folder permissions."
  exit 1
fi

echo "=== Syncing built files to server ==="
rsync -avz --delete -e "ssh -i $KEY" dist/ "$USER@$HOST:$REMOTE_DIR/"

if [ $? -ne 0 ]; then
  echo "Error: Failed to sync files to remote directory via rsync."
  exit 1
fi

echo "=== Syncing Nginx configuration file ==="
rsync -avz -e "ssh -i $KEY" nginx-wjrn.conf "$USER@$HOST:/tmp/nginx-wjrn.conf"

if [ $? -ne 0 ]; then
  echo "Error: Failed to upload Nginx config."
  exit 1
fi

echo "=== Applying Nginx config and reloading Nginx ==="
ssh -i "$KEY" "$USER@$HOST" "sudo cp /tmp/nginx-wjrn.conf /etc/nginx/sites-available/radio.jacewonmusic.com && sudo systemctl reload nginx"

if [ $? -ne 0 ]; then
  echo "Error: Failed to apply Nginx config or reload Nginx on the server."
  exit 1
fi

# ── Git: merge dev → main after successful deploy ────────────────────────────
echo "=== Merging dev → main ==="
git checkout main && git merge dev --ff-only && git push origin main && git checkout dev
# ─────────────────────────────────────────────────────────────────────────────

echo "=== Deployment successfully completed! ==="
echo "Files are now live at radio.jacewonmusic.com"
echo "Git: dev and main are both up to date on GitHub."
