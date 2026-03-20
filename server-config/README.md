# BeHivez Server Config

Server: `165.73.87.181`

## Quick Start

### 1. Register domains + point A-records to 165.73.87.181
- behivez.co.za, beegraded.co.za, pollenz.co.za, swarmz.co.za, broodz.co.za

### 2. Set up nginx
```bash
cd scripts && ./setup-nginx.sh
```

### 3. Deploy docker stack
```bash
cp .env.example .env  # fill in real passwords
scp docker-compose.yml init-databases.sql .env root@165.73.87.181:/opt/saas/
ssh root@165.73.87.181 "cd /opt/saas && docker compose up -d"
```

### 4. SSL (after DNS propagates)
```bash
cd scripts && ./setup-ssl.sh
```

### 5. Deploy a product
```bash
cd scripts && ./deploy-product.sh beegraded ../../beegraded/dist/spa
```

## n8n Webhook Prefixes
| Product | Prefix | Example |
|---------|--------|---------|
| BeeGraded | bg- | /webhook/bg-evaluate |
| Pollenz | pz- | /webhook/pz-submit |
| Swarmz | sz- | /webhook/sz-trip |
| Broodz | bz- | /webhook/bz-apply |
