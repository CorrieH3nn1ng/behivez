#!/bin/bash
# Deploy coming-soon page to placeholder product domains
# Usage: ./deploy-coming-soon.sh

set -e

SERVER="165.73.87.181"
PRODUCTS=("pollenz" "swarmz" "talentz")

for product in "${PRODUCTS[@]}"; do
    echo "=== Deploying coming-soon to ${product}.co.za ==="
    ssh root@${SERVER} "mkdir -p /opt/saas/${product}/web"
    scp ../coming-soon.html "root@${SERVER}:/opt/saas/${product}/web/index.html"
done

echo "=== All placeholder pages deployed ==="
