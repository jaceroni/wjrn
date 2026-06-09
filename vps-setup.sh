#!/bin/bash

# Exit on any error
set -e

echo "=== 1. Stopping AzuraCast Docker containers ==="
cd /var/azuracast
sudo docker compose down

echo "=== 2. Backing up and updating AzuraCast .env ==="
sudo cp .env .env.bak

# Update ports in .env file
# Remove existing commented/uncommented HTTP/HTTPS port settings
sudo sed -i '/AZURACAST_HTTP_PORT/d' .env
sudo sed -i '/AZURACAST_HTTPS_PORT/d' .env

# Append new port configurations
echo "AZURACAST_HTTP_PORT=8080" | sudo tee -a .env
echo "AZURACAST_HTTPS_PORT=8443" | sudo tee -a .env

echo "=== 3. Starting AzuraCast on new ports (8080/8443) ==="
sudo docker compose up -d

echo "=== 4. Installing Nginx natively ==="
sudo apt-get update
sudo apt-get install -y nginx

echo "=== 5. Setting up Nginx config for radio.jacewonmusic.com ==="
sudo cp /tmp/nginx-wjrn.conf /etc/nginx/sites-available/radio.jacewonmusic.com
sudo ln -sf /etc/nginx/sites-available/radio.jacewonmusic.com /etc/nginx/sites-enabled/

# Disable default nginx page
sudo rm -f /etc/nginx/sites-enabled/default

echo "=== 6. Verifying Nginx configuration ==="
sudo nginx -t

echo "=== 7. Restarting Nginx service ==="
sudo systemctl restart nginx

echo "=== Remote setup completed successfully! ==="
