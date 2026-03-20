#!/bin/bash
# Deploy a product SPA to the server
# Usage: ./deploy-product.sh <product-name> <local-dist-path>
# Example: ./deploy-product.sh beegraded ../beegraded/dist/spa

set -e

PRODUCT=$1
DIST_PATH=$2
SERVER="165.73.87.181"
REMOTE_PATH="/opt/saas/${PRODUCT}/frontend-dist"

if [ -z "$PRODUCT" ] || [ -z "$DIST_PATH" ]; then
    echo "Usage: ./deploy-product.sh <product-name> <local-dist-path>"
    echo "Products: behivez, beegraded, pollenz, swarmz, broodz, fleetz"
    exit 1
fi

if [ ! -d "$DIST_PATH" ]; then
    echo "Error: dist path '$DIST_PATH' does not exist. Build first."
    exit 1
fi

echo "=== Deploying ${PRODUCT} to ${SERVER}:${REMOTE_PATH} ==="

# Create remote directory if needed
ssh root@${SERVER} "mkdir -p ${REMOTE_PATH}"

# Sync files (delete old files, skip hidden)
rsync -avz --delete "${DIST_PATH}/" "root@${SERVER}:${REMOTE_PATH}/"

echo "=== ${PRODUCT} deployed successfully ==="
echo "Check: https://${PRODUCT}.co.za"
