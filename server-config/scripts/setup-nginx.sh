#!/bin/bash
# Set up nginx configs on the server
# Run this ONCE after SSH-ing into 165.73.87.181
# Usage: ./setup-nginx.sh

set -e

SERVER="165.73.87.181"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

echo "=== Uploading nginx configs ==="

# Copy all nginx configs to server
scp ../nginx/*.conf root@${SERVER}:${NGINX_CONF_DIR}/

# Enable all sites
ssh root@${SERVER} << 'EOF'
cd /etc/nginx/sites-enabled

# Symlink all configs
for conf in /etc/nginx/sites-available/behivez.conf \
            /etc/nginx/sites-available/beegraded.conf \
            /etc/nginx/sites-available/pollenz.conf \
            /etc/nginx/sites-available/swarmz.conf \
            /etc/nginx/sites-available/fleetz.conf \
            /etc/nginx/sites-available/talentz.conf; do
    name=$(basename "$conf")
    ln -sf "$conf" "$name"
    echo "Enabled: $name"
done

# Create web root directories
for product in behivez beegraded pollenz swarmz fleetz talentz; do
    mkdir -p /opt/saas/${product}/web
    echo "Created: /opt/saas/${product}/web"
done

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx
echo "=== nginx reloaded ==="
EOF

echo "=== Done. Now run certbot for SSL on each domain. ==="
echo "certbot --nginx -d behivez.co.za -d www.behivez.co.za"
echo "certbot --nginx -d beegraded.co.za -d www.beegraded.co.za"
echo "(repeat for each domain as DNS propagates)"
