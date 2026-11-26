#!/bin/bash
# One-time (re-runnable) server setup for the live relay. Run on the VPS from this folder: sudo bash install.sh
set -euo pipefail
cd "$(dirname "$0")"
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_SUSPEND=1   # never auto-restart other services (Docker/AzuraCast)
apt-get install -y -q --no-upgrade icecast2 python3-venv
systemctl disable --now icecast2 2>/dev/null || true          # the distro service is unused; ours is below
id wjrnlive &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin wjrnlive
install -d -m 755 /opt/wjrn-live /etc/wjrn-live
install -d -m 755 -o wjrnlive -g wjrnlive /var/www/wjrn-live-data /var/log/wjrn-live
[ -x /opt/wjrn-live/venv/bin/pip ] || python3 -m venv /opt/wjrn-live/venv
/opt/wjrn-live/venv/bin/pip install -q --upgrade streamlink
install -m 755 relay.py /opt/wjrn-live/relay.py
if [ ! -f /etc/wjrn-live/env ]; then
  (umask 077; echo "SOURCE_PASSWORD=$(openssl rand -hex 16)" > /etc/wjrn-live/env)
fi
. /etc/wjrn-live/env
(umask 077; sed -e "s/__SOURCE_PASSWORD__/$SOURCE_PASSWORD/" -e "s/__ADMIN_PASSWORD__/$(openssl rand -hex 16)/" icecast.xml > /etc/wjrn-live/icecast.xml)
chown wjrnlive /etc/wjrn-live/icecast.xml
install -m 644 wjrn-live-icecast.service wjrn-live-relay.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable -q wjrn-live-icecast wjrn-live-relay
systemctl restart wjrn-live-icecast wjrn-live-relay
