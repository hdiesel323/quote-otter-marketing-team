# Deploy QuoteOtter to Coolify

## Step 1: Push Code to GitHub

Already done! Code should be at: `https://github.com/hdiesel323/quote-otter-marketing-team`

## Step 2: Configure Coolify

Go to your Coolify dashboard:
`http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io/`

### Create New Application

1. Click **"New Resource"** → **"Service"**
2. Select **"Docker Compose"** option
3. **IMPORTANT: YAML Formatting Issues**
   
   When pasting the Docker Compose file, Coolify may have issues with:
   - Smart quotes (curly quotes) - Use only straight quotes: `"3.8"` not `"3.8"`
   - Indentation problems - YAML requires exact spacing
   
   **Common Errors and Fixes:**
   
   **Error: "Unable to parse at line 1 (near version: '3.8')"**
   - Fix: Remove smart quotes. Line 1 should be: `version: "3.8"` with straight quotes
   
   **Error: "Unable to parse at line 3 (near services:)"**
   - Fix: Remove ALL spaces before `services:` - it should start at column 0 (flush left)
   - `services:` should align with `version:` above it (no indent)
   
   **Correct Structure:**
   ```yaml
   version: "3.8"
   
   services:
     quoteotter-agents:
       build:
   ```
   Note: `version` and `services` have NO leading spaces

4. **Paste Docker Compose Content:**
   
   Copy this EXACTLY (watch for indentation):

```yaml
version: "3.8"

services:
  quoteotter-agents:
    build:
      context: .
      dockerfile: deployment/docker/Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:SecurePass123@postgres:5432/quoteotter_agents
      - JWT_SECRET=ChangeThisJWTSecret123
      - VALID_API_KEYS=api-key-001,api-key-002
      - ENABLE_PHONEREVEALR=false
      - LOG_LEVEL=info
      - CORS_ORIGINS=*
      - ENABLE_FRAUD_DETECTION=true
      - ENABLE_ANALYTICS=true
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=SecurePass123
      - POSTGRES_DB=quoteotter_agents
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass RedisPass123
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

5. **Troubleshooting Tips:**
   - If pasting doesn't work, try typing line 1 manually: `version: "3.8"`
   - Make sure line 3 `services:` has NO spaces before it
   - Use 2 spaces for each indentation level (not tabs)
   - If error persists, clear the field completely and re-paste

6. Click **"Save"** when YAML parses successfully (no error message)

7. **Configure Git Repository** (Next Screen):
   - **Public Repository**: `https://github.com/hdiesel323/quote-otter-marketing-team`
   - **Branch**: `main`
   - **Build Pack**: Docker Compose
   - Leave other settings as default

### Set Environment Variables (Optional - Already in Docker Compose)

The environment variables are already embedded in the docker-compose.yml above. 
If you need to override them, you can add these in Coolify's Environment Variables section:

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

### YAML Parsing Errors in Coolify

**Problem:** Error messages when pasting docker-compose.yml
**Solution:**
1. Clear the text field completely
2. Type line 1 manually: `version: "3.8"` (use keyboard quotes, not copy-paste)
3. Ensure `services:` on line 3 has NO leading spaces
4. Use 2 spaces (not tabs) for indentation
5. Don't copy from formatted documents (PDF, Word) - they add smart quotes

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
