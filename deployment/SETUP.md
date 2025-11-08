# QuoteOtter Agent System - Setup Guide

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14
- Redis >= 6 (optional, for caching)
- PhoneRevealr API Key (optional, for fraud detection)

## Quick Start

### 1. Clone and Install

```bash
cd quote-otter-marketing-team
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp deployment/.env.example .env
```

Edit `.env` and configure the following required variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com

# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/quoteotter

# Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-change-this
VALID_API_KEYS=key1,key2,key3

# PhoneRevealr (Optional but recommended)
ENABLE_PHONEREVEALR=true
PHONEREVEALR_API_KEY=your-phonerevealr-api-key

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### 3. Setup Database

Run the database migration:

```bash
npm run migrate
```

This will create all necessary tables:
- leads
- providers
- lead_assignments
- phone_validation_cache
- api_keys
- activity_logs

### 4. Start the Server

Development mode (with auto-restart):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Authentication

All API endpoints require authentication via `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/leads
```

### Available Endpoints

- `GET /` - API information
- `GET /health` - Health check (no auth required)

**Leads:**
- `POST /api/leads` - Create and validate a new lead
- `GET /api/leads` - List leads with filters
- `GET /api/leads/:id` - Get lead details
- `PATCH /api/leads/:id/status` - Update lead status

**Phone Validation:**
- `POST /api/phone/validate` - Validate single phone number
- `POST /api/phone/validate/batch` - Validate multiple phones (max 100)
- `GET /api/phone/cache/stats` - Get cache statistics
- `DELETE /api/phone/cache` - Clear validation cache

**Providers:**
- `POST /api/providers` - Create new provider
- `GET /api/providers` - List providers
- `GET /api/providers/:id` - Get provider details
- `GET /api/providers/:id/stats` - Get provider statistics
- `PATCH /api/providers/:id` - Update provider
- `DELETE /api/providers/:id` - Delete provider

**Analytics:**
- `GET /api/analytics/leads` - Lead metrics over time
- `GET /api/analytics/conversions` - Conversion metrics
- `GET /api/analytics/categories` - Service category breakdown
- `GET /api/analytics/providers` - Provider performance
- `GET /api/analytics/revenue` - Revenue metrics
- `GET /api/analytics/dashboard` - Complete dashboard summary

## Example: Submit a Lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+15551234567",
    "zipCode": "90210",
    "serviceCategory": "roofing",
    "serviceDetails": "Need roof repair after storm damage",
    "projectTimeline": "immediate"
  }'
```

Response:

```json
{
  "status": "success",
  "data": {
    "lead": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "score": 85,
      "intent": "hot",
      "status": "approved",
      "phoneValidation": {
        "isValid": true,
        "isVoip": false,
        "riskScore": 10
      }
    }
  }
}
```

## Docker Deployment

### Using Docker Compose

```bash
cd deployment/docker
docker-compose up -d
```

This starts:
- QuoteOtter API server
- PostgreSQL database
- Redis cache

### Using Coolify

1. Push code to git repository
2. In Coolify dashboard, create new application
3. Connect to your git repository
4. Set environment variables in Coolify UI
5. Deploy

See `deployment/COOLIFY-DEPLOYMENT.md` for detailed instructions.

## Testing

Run tests:

```bash
npm test
```

Run linter:

```bash
npm run lint
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2025-11-07T..."
}
```

### Logs

Logs are written to:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs
- Console (in development mode)

Logs automatically rotate when they reach 5MB.

## Lead Processing Flow

1. **Lead Submission** → POST /api/leads
2. **Lead Intelligence** → Score 0-100, detect intent (hot/warm/cool)
3. **Phone Validation** → PhoneRevealr checks for VoIP/fraud
4. **Compliance Check** → Approve/Flag/Reject based on rules
5. **Provider Matching** → Find best-fit providers
6. **Lead Distribution** → Assign to providers
7. **Tracking** → Monitor response and conversion

## Troubleshooting

### Database Connection Issues

Check DATABASE_URL format:

```
postgresql://username:password@host:port/database
```

Test connection:

```bash
psql $DATABASE_URL
```

### PhoneRevealr Not Working

1. Check API key is valid
2. Verify ENABLE_PHONEREVEALR=true
3. Check logs for API errors
4. System works without PhoneRevealr (validation skipped)

### Port Already in Use

Change PORT in .env file:

```env
PORT=3001
```

### Migration Fails

Drop and recreate database:

```bash
psql -c "DROP DATABASE quoteotter; CREATE DATABASE quoteotter;"
npm run migrate
```

## Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Generate secure API keys
- [ ] Configure CORS_ORIGINS correctly
- [ ] Enable SSL/TLS (via reverse proxy)
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set NODE_ENV=production
- [ ] Monitor server resources
- [ ] Set up error alerting
- [ ] Configure rate limiting

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review STATUS.md for known issues
- Contact: team@quoteotter.com
