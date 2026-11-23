#!/bin/bash
# Installs the Rock Garden Disco feed on the VPS and schedules it. Run from your laptop.
# Safe to re-run (it just updates feed.py and rewrites the one cron line).
# Does NOT need a token yet — but the cron job will just log "No token" until you run --set-token (see README.md).
set -e
cd "$(dirname "$0")"
KEY="/Users/jacebrown/Dropbox/Jacewon/Radio/newradiokey.pem"
HOST="ubuntu@208.113.165.231"
STATION="${1:-the-rock-garden}"
SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new $HOST"

echo "=== Preparing folders + Pillow on the VPS ==="
$SSH "sudo apt-get install -y python3-pil >/dev/null \
  && sudo mkdir -p /opt/wjrn-disco-feed /var/lib/wjrn-disco/$STATION /var/www/wjrn-disco-data/$STATION/covers \
  && sudo chown -R ubuntu:ubuntu /opt/wjrn-disco-feed /var/lib/wjrn-disco /var/www/wjrn-disco-data \
  && sudo chmod 700 /var/lib/wjrn-disco /var/lib/wjrn-disco/$STATION"

echo "=== Copying feed.py ==="
rsync -az -e "ssh -i $KEY" feed.py "$HOST:/opt/wjrn-disco-feed/feed.py"

echo "=== Scheduling: every 15 minutes ==="
LINE="*/15 * * * * /usr/bin/python3 /opt/wjrn-disco-feed/feed.py --station $STATION >> /var/lib/wjrn-disco/$STATION/feed.log 2>&1"
$SSH "(crontab -l 2>/dev/null | grep -v 'wjrn-disco-feed/feed.py --station $STATION'; echo '$LINE') | crontab -"
$SSH "crontab -l | grep wjrn-disco"

echo "=== Done. Next: put the token on the server (README.md, step 5) ==="
