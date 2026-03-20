#!/bin/bash
# Set up SSL certificates for all domains
# Run AFTER DNS is pointing to 165.73.87.181
# Usage: ./setup-ssl.sh [domain]
# Example: ./setup-ssl.sh beegraded   (just one domain)
# Example: ./setup-ssl.sh             (all domains)

set -e

SERVER="165.73.87.181"

setup_ssl() {
    local domain=$1
    echo "=== Setting up SSL for ${domain}.co.za ==="
    ssh root@${SERVER} "certbot --nginx -d ${domain}.co.za -d www.${domain}.co.za --non-interactive --agree-tos -m admin@behivez.co.za"
    echo "=== SSL active for ${domain}.co.za ==="
}

if [ -n "$1" ]; then
    setup_ssl "$1"
else
    for domain in behivez beegraded pollenz swarmz fleetz talentz; do
        setup_ssl "$domain"
    done
fi
