#!/bin/bash

# Configuration
KEY="/Users/jacebrown/Dropbox/Jacewon/Radio/newradiokey.pem"
USER="ubuntu"
HOST="208.113.165.231"
REMOTE_DIR="/var/www/wjrn-landing"

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

echo "=== Deployment successfully completed! ==="
echo "Files are now synced on DreamCompute at $REMOTE_DIR, and Nginx has been reloaded."
