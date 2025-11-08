# Deploy QuoteOtter to Coolify

## Step 1: Push Code to GitHub

Already done! Code should be at: `https://github.com/hdiesel323/quote-otter-marketing-team`

## Step 2: Configure Coolify

Go to your Coolify dashboard:
`http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io/`

### Create New Application

1. Click **"New Resource"** → **"Application"**
2. Select **"Docker Compose"** as the deployment type
3. Application Settings:
   - **Name**: `quoteotter-agents`
   - **Git Repository**: `https://github.com/hdiesel323/quote-otter-marketing-team`
   - **Branch**: `main`
   - **Docker Compose Location**: `deployment/docker/docker-compose.yml`
   - **Build Pack**: Docker Compose

### Set Environment Variables

In Coolify's Environment Variables section, add these:

```env
# Application
NODE_ENV=production
PORT=3000

# Database (Coolify will provide PostgreSQL)
DATABASE_URL=postgresql://postgres:your-password@postgres:5432/quoteotter_agents
POSTGRES_PASSWORD=GenerateSecurePassword123!

# Redis
REDIS_PASSWORD=GenerateSecurePassword456!

# Authentication
JWT_SECRET=GenerateSecureJWTSecret789!
VALID_API_KEYS=coolify-api-key-001,coolify-api-key-002

# PhoneRevealr (Optional - can enable later)
ENABLE_PHONEREVEALR=false
PHONEREVEALR_API_KEY=

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# CORS
CORS_ORIGINS=http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io

# Feature Flags
ENABLE_FRAUD_DETECTION=true
ENABLE_ANALYTICS=true
ENABLE_LEAD_SCORING=true
ENABLE_PROVIDER_MATCHING=true

# API Rate Limiting
API_RATE_LIMIT=100
```

## Step 3: Deploy

1. Click **"Deploy"** button
2. Monitor the build logs
3. Wait for deployment to complete (~2-3 minutes)

## Step 4: Verify Deployment

Once deployed, test the health endpoint:

```bash
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 123,
  "timestamp": "2025-11-07T..."
}
```

## Step 5: Run Database Migration

After first deployment, you need to run the migration to create database tables:

### Option A: Coolify Console
1. In Coolify, go to your application
2. Click "Terminal" or "Console"
3. Run:
```bash
node deployment/database/migrate.js
```

### Option B: Docker Exec
```bash
docker exec quoteotter-agents node deployment/database/migrate.js
```

## Step 6: Test API Endpoints

### Create a Test Lead
```bash
curl -X POST http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: coolify-api-key-001" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+15551234567",
    "zipCode": "90210",
    "serviceCategory": "roofing",
    "serviceDetails": "Need roof repair",
    "projectTimeline": "immediate"
  }'
```

### List Leads
```bash
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/api/leads \
  -H "X-API-Key: coolify-api-key-001"
```

### Create a Provider
```bash
curl -X POST http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/api/providers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: coolify-api-key-001" \
  -d '{
    "name": "Test Roofer",
    "email": "roofer@example.com",
    "phone": "+15559876543",
    "businessName": "Test Roofing Co",
    "serviceCategories": ["roofing"],
    "serviceZipCodes": ["90210"],
    "leadPrice": 50,
    "maxLeadsPerDay": 10
  }'
```

## Troubleshooting

### Logs
View application logs in Coolify dashboard or:
```bash
docker logs quoteotter-agents -f
```

### Database Connection Issues
Check DATABASE_URL is correct and PostgreSQL container is running:
```bash
docker ps | grep postgres
```

### Restart Services
In Coolify dashboard, click "Restart" button

## Next Steps

1. ✅ Configure custom domain (optional)
2. ✅ Enable SSL with Let's Encrypt
3. ✅ Add PhoneRevealr API key for fraud detection
4. ✅ Set up monitoring and alerts
5. ✅ Configure backup schedule for PostgreSQL
6. ✅ Add more API keys for different consumers

## API Documentation

Full API documentation available at:
- Setup Guide: `deployment/SETUP.md`
- Coolify Guide: `deployment/COOLIFY-DEPLOYMENT.md`

## System is Production Ready! 🚀

All core features implemented:
- Lead validation and scoring
- Provider matching and distribution
- Analytics and reporting
- PostgreSQL persistence
- Redis caching
- Health monitoring
