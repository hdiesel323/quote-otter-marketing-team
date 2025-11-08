# QuoteOtter AI Agent System - Coolify Deployment Guide

## Overview
This guide walks through deploying the QuoteOtter AI Agent System on your Coolify server at:
`http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io/`

## Prerequisites

✅ Coolify server running and accessible
✅ Docker installed on Coolify server
✅ Git repository access
✅ API keys for:
  - PhoneRevealr
  - OpenAI (GPT-4)
  - Anthropic (Claude)
  - Google AI (Gemini)

## Deployment Steps

### 1. Prepare Your Repository

First, commit all changes and push to your git repository:

```bash
cd /Users/admin/Dropbox/Labs/GitHub/quote-otter-marketing-team
git add .
git commit -m "Initial QuoteOtter AI Agent System setup"
git remote add origin <your-git-repo-url>
git push -u origin main
```

### 2. Configure Coolify Application

1. **Log into Coolify**:
   - Navigate to `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io/`
   - Log in with your credentials

2. **Create New Application**:
   - Click "New Resource" → "Application"
   - Choose "Docker Compose" as the type
   - Name: `quoteotter-agents`

3. **Configure Git Repository**:
   - Repository URL: `<your-git-repo-url>`
   - Branch: `main`
   - Base directory: `/`
   - Docker Compose Location: `/deployment/docker/docker-compose.yml`

4. **Set Environment Variables**:
   Copy variables from `/deployment/.env.example`:
   
   ```bash
   # Application
   NODE_ENV=production
   PORT=3000
   
   # QuoteOtter Platform
   QUOTEOTTER_API_URL=http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io
   QUOTEOTTER_API_KEY=<generate-secure-key>
   
   # PhoneRevealr
   PHONEREVEALR_API_KEY=<your-phonerevealr-key>
   
   # AI Providers
   OPENAI_API_KEY=<your-openai-key>
   ANTHROPIC_API_KEY=<your-anthropic-key>
   GOOGLE_AI_API_KEY=<your-google-key>
   
   # Database
   DATABASE_URL=postgresql://postgres:<secure-password>@postgres:5432/quoteotter_agents
   POSTGRES_PASSWORD=<secure-password>
   
   # Redis
   REDIS_PASSWORD=<secure-password>
   
   # Security
   JWT_SECRET=<generate-secure-secret>
   ```

5. **Configure Domains**:
   - Primary domain: `agents.quoteotter.com` (or use sslip.io for testing)
   - Add SSL certificate (Let's Encrypt recommended)

6. **Resource Limits**:
   - CPU: 2 cores (minimum)
   - Memory: 4GB (minimum)
   - Storage: 20GB (for data and logs)

### 3. Deploy the Application

1. Click "Deploy" in Coolify
2. Monitor build logs for any errors
3. Wait for all services to be healthy (30-60 seconds)

### 4. Verify Deployment

Check service health:

```bash
# Health check
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "phonerevealr": "available"
  },
  "agents": {
    "lead_intelligence": "ready",
    "compliance": "ready",
    "conversion_analytics": "ready",
    "lead_operations": "ready",
    "provider_intelligence": "ready"
  }
}
```

### 5. Test Agent Endpoints

```bash
# Test lead validation
curl -X POST http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/api/validate-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-api-key>" \
  -d '{
    "phone": "+15551234567",
    "email": "test@example.com",
    "service": "roofing",
    "zip": "85001",
    "name": "John Doe"
  }'

# Expected response:
{
  "lead_id": "QO-2025-123456",
  "status": "approved",
  "quality_score": 87,
  "risk_level": "low",
  "routing": {
    "providers": ["provider_123", "provider_456"],
    "method": "competitive"
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Coolify Server                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  QuoteOtter Next.js App (Port 80/443)                │  │
│  │  - Quote request forms                                │  │
│  │  - Provider dashboard                                 │  │
│  │  - Consumer interface                                 │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │ HTTP API                                │
│                   ↓                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Agent System (Port 3000)                         │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Lead Intelligence Agent                       │  │  │
│  │  │  - Qualification & Scoring                     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Compliance & Quality Agent                    │  │  │
│  │  │  - PhoneRevealr Integration ───────►           │  │  │
│  │  │  - Fraud Detection                             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Lead Operations Agent                         │  │  │
│  │  │  - Lead Distribution                           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Provider Intelligence Agent                   │  │  │
│  │  │  - Provider Matching                           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│  ┌─────────────────┴──────────────────┬─────────────────┐  │
│  │                                     │                 │  │
│  ↓                                     ↓                 ↓  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │  │
│  │  PostgreSQL  │  │   Redis     │  │  Volumes     │   │  │
│  │  (Port 5432) │  │  (Port 6379)│  │  - Data      │   │  │
│  │  - Lead data │  │  - Cache    │  │  - Logs      │   │  │
│  │  - Analytics │  │  - Sessions │  │              │   │  │
│  └──────────────┘  └─────────────┘  └──────────────┘   │  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌─────────────────────┐
                    │  PhoneRevealr API   │
                    │  phonerevealr.com   │
                    │  - Phone validation │
                    │  - VoIP detection   │
                    └─────────────────────┘
```

## Service URLs

Once deployed, services will be available at:

- **Main App**: `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io/`
- **Agent API**: `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/`
- **Health Check**: `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3000/health`
- **Grafana** (if enabled): `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/`
- **Prometheus** (if enabled): `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:9090/`

## API Endpoints

### Lead Submission & Validation
```bash
POST /api/validate-lead
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "phone": "+15551234567",
  "email": "customer@example.com",
  "name": "John Doe",
  "service": "roofing",
  "service_details": "Need roof replacement",
  "zip": "85001",
  "urgency": "urgent",
  "timeline": "1-2 weeks",
  "budget": "5000-10000"
}
```

### Phone Validation (PhoneRevealr)
```bash
POST /api/validate-phone
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "phone": "+15551234567"
}

# Response:
{
  "isValid": true,
  "riskLevel": "low",
  "riskScore": 95,
  "lineType": "mobile",
  "carrier": "Verizon Wireless",
  "isVoip": false,
  "recommendation": "approve"
}
```

### Lead Routing
```bash
POST /api/route-lead
Content-Type: application/json
Authorization: Bearer <api-key>

{
  "lead_id": "QO-2025-123456"
}

# Response:
{
  "lead_id": "QO-2025-123456",
  "providers": [
    {
      "provider_id": "provider_123",
      "name": "Top Roofing Co",
      "priority": 1,
      "delivery_method": "api_push"
    }
  ],
  "routing_type": "exclusive"
}
```

### Analytics
```bash
GET /api/analytics/dashboard
Authorization: Bearer <api-key>

# Response:
{
  "today": {
    "leads_received": 234,
    "leads_approved": 187,
    "leads_rejected": 47,
    "fraud_detected": 15,
    "avg_quality_score": 78
  },
  "phonerevealr": {
    "validations_today": 234,
    "voip_detected": 23,
    "invalid_phones": 12
  }
}
```

## Monitoring & Logs

### View Logs
```bash
# Agent system logs
docker logs quoteotter-agents -f --tail 100

# Database logs
docker logs quoteotter-postgres -f --tail 50

# Redis logs
docker logs quoteotter-redis -f --tail 50
```

### Check Resource Usage
```bash
# Container stats
docker stats quoteotter-agents quoteotter-postgres quoteotter-redis
```

### Database Backup
```bash
# Backup PostgreSQL
docker exec quoteotter-postgres pg_dump -U postgres quoteotter_agents > backup.sql

# Restore
docker exec -i quoteotter-postgres psql -U postgres quoteotter_agents < backup.sql
```

## Scaling Considerations

### Horizontal Scaling
To handle increased load:

1. **Multiple Agent Instances**:
   - Deploy multiple containers with load balancer
   - Use Redis for shared state
   - Ensure PhoneRevealr API rate limits

2. **Database Scaling**:
   - Enable PostgreSQL replication
   - Use read replicas for analytics
   - Consider PgBouncer for connection pooling

3. **Caching Strategy**:
   - Redis cluster for high availability
   - Cache PhoneRevealr results (1 hour TTL)
   - Cache provider performance data

### Vertical Scaling
Increase resources if needed:
- **CPU**: 4+ cores for high throughput
- **Memory**: 8GB+ for larger caches
- **Storage**: SSD for database performance

## Troubleshooting

### Agent System Not Starting
```bash
# Check logs
docker logs quoteotter-agents

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Redis unavailable
# - PhoneRevealr API key invalid
```

### PhoneRevealr Integration Failing
```bash
# Test API directly
curl "https://phonerevealr.com/api/validate?phone=+15551234567" \
  -H "Authorization: Bearer $PHONEREVEALR_API_KEY"

# Check environment variable
docker exec quoteotter-agents env | grep PHONEREVEALR
```

### High Latency
```bash
# Check Redis
docker exec quoteotter-redis redis-cli ping

# Check database connections
docker exec quoteotter-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Enable caching
export ENABLE_CACHING=true
```

### Memory Issues
```bash
# Increase memory limit in Coolify
# Or reduce concurrent operations:
export MAX_CONCURRENT_VALIDATIONS=10
```

## Maintenance

### Update Application
```bash
# In Coolify:
# 1. Go to your application
# 2. Click "Redeploy"
# 3. Coolify will pull latest code and rebuild

# Or via git:
git pull origin main
# Push to trigger Coolify auto-deployment
```

### Database Migrations
```bash
# Run migrations
docker exec quoteotter-agents npm run migrate

# Or manually
docker exec -it quoteotter-postgres psql -U postgres quoteotter_agents
```

### Clear Caches
```bash
# Clear Redis
docker exec quoteotter-redis redis-cli FLUSHALL

# Clear application cache
curl -X POST http://localhost:3000/api/admin/clear-cache \
  -H "Authorization: Bearer <admin-key>"
```

## Security Best Practices

1. **API Keys**: Rotate regularly, use strong random strings
2. **Database**: Strong passwords, no public access
3. **SSL/TLS**: Always use HTTPS in production
4. **Rate Limiting**: Prevent abuse of validation endpoints
5. **Secrets**: Use Coolify's secret management, never commit to git
6. **Network**: Isolate services in Docker network
7. **Backups**: Automated daily backups
8. **Monitoring**: Alert on suspicious patterns

## Support & Resources

- **Documentation**: `/documentation/`
- **API Reference**: `/api/docs`
- **Health Dashboard**: `/admin/health`
- **Coolify Docs**: https://coolify.io/docs

## Next Steps

1. ✅ Deploy to Coolify
2. ✅ Verify all services healthy
3. ✅ Test lead validation workflow
4. ✅ Integrate with QuoteOtter Next.js app
5. ✅ Set up monitoring and alerts
6. ✅ Configure backup schedule
7. ✅ Train team on agent system

---

**Deployment Date**: 2025-11-06
**Version**: 2.0.0
**Deployed By**: QuoteOtter Team
