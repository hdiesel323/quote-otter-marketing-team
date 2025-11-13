# QuoteOtter Agents Configuration

This document provides configuration details for all AI agents in the QuoteOtter Lead Generation System.

## Overview

The QuoteOtter system uses 5 specialized AI agents that work collaboratively to process leads, detect fraud, match providers, and optimize conversions.

---

## Agent Architecture

### Communication Flow
```
Lead Submission
    ↓
[Lead Intelligence Agent] → Scores & Qualifies
    ↓
[Compliance & Quality Agent] → Validates & Fraud Check
    ↓
[Provider Intelligence Agent] → Matches Providers
    ↓
[Lead Operations Agent] → Distributes Lead
    ↓
[Conversion Analytics Agent] → Tracks Performance
```

---

## 1. Lead Intelligence Agent

**Location**: `/agents/lead-intelligence/`

**Purpose**: Lead qualification, scoring, and intent detection

### Configuration (`agent-config.json`)

```json
{
  "name": "Lead Intelligence Agent",
  "role": "lead-qualification",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.3,
  "capabilities": [
    "lead-scoring",
    "intent-detection",
    "service-classification",
    "geographic-routing"
  ],
  "scoring_framework": {
    "contact_quality": 25,
    "project_details": 25,
    "intent_signals": 25,
    "geographic_fit": 15,
    "behavioral_signals": 10
  },
  "intent_levels": ["hot", "warm", "cool"],
  "min_approval_score": 60,
  "service_categories": [
    "roofing", "hvac", "plumbing", "electrical", "solar",
    "windows", "siding", "flooring", "landscaping", "tree-service",
    "pest-control", "auto-insurance", "home-insurance", "life-insurance",
    "health-insurance", "medicare", "moving", "storage", "legal",
    "financial", "auto-repair"
  ]
}
```

### Key Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `temperature` | float | 0.3 | Lower = more deterministic scoring |
| `min_approval_score` | int | 60 | Minimum score to auto-approve |
| `scoring_framework` | object | See above | Point allocation per category |
| `intent_levels` | array | ["hot","warm","cool"] | Buyer intent classification |

### Environment Variables

```env
# Model Configuration
LEAD_INTELLIGENCE_MODEL=gpt-4-turbo-preview
LEAD_INTELLIGENCE_TEMPERATURE=0.3

# Scoring Thresholds
MIN_QUALITY_SCORE=60
AUTO_APPROVE_THRESHOLD=80
AUTO_REJECT_THRESHOLD=30

# Feature Flags
ENABLE_LEAD_SCORING=true
ENABLE_INTENT_DETECTION=true
ENABLE_GEOGRAPHIC_ROUTING=true
```

### API Integration

The agent is invoked via the Lead Service:

```javascript
const leadService = new LeadService(db, phoneRevealrClient);
const result = await leadService.validateLead(leadData);

// Returns:
{
  score: 85,
  intent: "hot",
  status: "approved",
  flagReasons: [],
  matchedCategories: ["roofing"],
  estimatedValue: 5000
}
```

---

## 2. Compliance & Quality Agent

**Location**: `/agents/compliance/`

**Purpose**: Fraud detection, phone validation, quality assurance

### Configuration (`agent-config.json`)

```json
{
  "name": "Compliance & Quality Agent",
  "role": "fraud-detection",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.1,
  "capabilities": [
    "phone-validation",
    "fraud-detection",
    "duplicate-checking",
    "pattern-recognition"
  ],
  "integrations": {
    "phonerevealr": {
      "enabled": true,
      "cache_ttl": 86400,
      "min_risk_score": 70,
      "block_voip": false,
      "block_high_risk_voip": true
    }
  },
  "fraud_rules": {
    "max_duplicate_submissions": 3,
    "duplicate_window_hours": 24,
    "suspicious_keywords": ["test", "fake", "demo"],
    "block_disposable_emails": true
  }
}
```

### Key Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `temperature` | float | 0.1 | Very low for consistent fraud detection |
| `min_risk_score` | int | 70 | PhoneRevealr minimum score (0-100) |
| `block_voip` | bool | false | Block all VoIP numbers |
| `block_high_risk_voip` | bool | true | Block only risky VoIP |
| `cache_ttl` | int | 86400 | Phone validation cache (seconds) |

### Environment Variables

```env
# PhoneRevealr Integration
ENABLE_PHONEREVEALR=true
PHONEREVEALR_API_KEY=your_api_key_here
PHONEREVEALR_CACHE_TTL=86400
MIN_RISK_SCORE=70

# Fraud Detection
ENABLE_FRAUD_DETECTION=true
AUTO_REJECT_HIGH_RISK_VOIP=true
MAX_DUPLICATE_SUBMISSIONS=3
DUPLICATE_WINDOW_HOURS=24
BLOCK_DISPOSABLE_EMAILS=true

# Suspicious Patterns
SUSPICIOUS_KEYWORDS=test,fake,demo,spam
BLOCKED_AREA_CODES=000,555,800,888,900
```

### PhoneRevealr Response

```json
{
  "phone": "+15551234567",
  "valid": true,
  "type": "mobile",
  "carrier": "Verizon Wireless",
  "isVoip": false,
  "riskScore": 85,
  "recommendation": "accept"
}
```

---

## 3. Provider Intelligence Agent

**Location**: `/agents/provider-intelligence/`

**Purpose**: Provider matching, performance optimization

### Configuration (`agent-config.json`)

```json
{
  "name": "Provider Intelligence Agent",
  "role": "provider-matching",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.2,
  "capabilities": [
    "provider-matching",
    "performance-optimization",
    "capacity-management",
    "specialization-matching"
  ],
  "matching_strategy": "performance_based",
  "routing_options": {
    "max_providers_per_lead": 3,
    "exclusivity_window_hours": 4,
    "load_balancing": true,
    "prioritize_high_performers": true
  },
  "performance_weights": {
    "conversion_rate": 0.4,
    "response_time": 0.3,
    "customer_satisfaction": 0.2,
    "specialization_match": 0.1
  }
}
```

### Key Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `matching_strategy` | string | "performance_based" | "round_robin", "load_balanced", "performance_based" |
| `max_providers_per_lead` | int | 3 | Number of providers to match |
| `exclusivity_window_hours` | int | 4 | Exclusive lead time before opening to others |
| `performance_weights` | object | See above | Weighting for provider scoring |

### Environment Variables

```env
# Provider Matching
ENABLE_PROVIDER_MATCHING=true
ROUTING_STRATEGY=performance_based
MAX_PROVIDERS_PER_LEAD=3
EXCLUSIVITY_WINDOW_HOURS=4

# Performance Optimization
PRIORITIZE_HIGH_PERFORMERS=true
MIN_CONVERSION_RATE=0.15
MAX_RESPONSE_TIME_SECONDS=3600

# Load Balancing
ENABLE_LOAD_BALANCING=true
MAX_LEADS_PER_PROVIDER_PER_DAY=50
```

### Matching Algorithm

```javascript
// Provider scoring for each lead
providerScore = 
  (conversionRate * 0.4) +
  (responseTimeScore * 0.3) +
  (customerSatScore * 0.2) +
  (specializationMatch * 0.1)

// Filters applied:
// 1. Service category match
// 2. Geographic coverage
// 3. Quality threshold met
// 4. Capacity available
// 5. Status = active
```

---

## 4. Lead Operations Agent

**Location**: `/agents/lead-operations/`

**Purpose**: Lead distribution, delivery management

### Configuration (`agent-config.json`)

```json
{
  "name": "Lead Operations Agent",
  "role": "lead-distribution",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.2,
  "capabilities": [
    "lead-distribution",
    "assignment-tracking",
    "notification-management",
    "status-monitoring"
  ],
  "distribution_modes": {
    "exclusive": {
      "providers_count": 1,
      "price_multiplier": 1.5
    },
    "shared": {
      "providers_count": 3,
      "price_multiplier": 1.0
    },
    "marketplace": {
      "providers_count": 5,
      "bidding_enabled": true
    }
  },
  "notification_channels": ["email", "webhook", "sms"]
}
```

### Key Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `distribution_mode` | string | "shared" | "exclusive", "shared", "marketplace" |
| `notification_channels` | array | ["email","webhook"] | Delivery methods |
| `retry_failed_deliveries` | bool | true | Retry on notification failure |
| `max_retry_attempts` | int | 3 | Maximum delivery retries |

### Environment Variables

```env
# Distribution Settings
DISTRIBUTION_MODE=shared
DEFAULT_PROVIDERS_COUNT=3
ENABLE_EXCLUSIVE_LEADS=true

# Notifications
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_WEBHOOK_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_key
FROM_EMAIL=leads@quoteotter.com

# Webhook Configuration
WEBHOOK_TIMEOUT_MS=5000
WEBHOOK_RETRY_ATTEMPTS=3
```

---

## 5. Conversion Analytics Agent

**Location**: `/agents/conversion-analytics/`

**Purpose**: Performance tracking, ROI analysis

### Configuration (`agent-config.json`)

```json
{
  "name": "Conversion Analytics Agent",
  "role": "analytics",
  "model": "gpt-4-turbo-preview",
  "temperature": 0.2,
  "capabilities": [
    "conversion-tracking",
    "roi-calculation",
    "performance-reporting",
    "trend-analysis"
  ],
  "metrics": {
    "lead_volume": true,
    "conversion_rates": true,
    "response_times": true,
    "revenue_tracking": true,
    "provider_performance": true
  },
  "reporting_schedule": {
    "daily_summary": "08:00",
    "weekly_report": "monday_09:00",
    "monthly_report": "1st_09:00"
  }
}
```

### Key Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enable_real_time_analytics` | bool | true | Real-time metric updates |
| `data_retention_days` | int | 365 | How long to keep analytics data |
| `reporting_schedule` | object | See above | Automated report timing |

### Environment Variables

```env
# Analytics Configuration
ENABLE_ANALYTICS=true
ENABLE_REAL_TIME_ANALYTICS=true
DATA_RETENTION_DAYS=365

# Reporting
ENABLE_AUTOMATED_REPORTS=true
DAILY_REPORT_TIME=08:00
WEEKLY_REPORT_DAY=monday
MONTHLY_REPORT_DATE=1

# Metrics Tracked
TRACK_LEAD_VOLUME=true
TRACK_CONVERSION_RATES=true
TRACK_RESPONSE_TIMES=true
TRACK_REVENUE=true
TRACK_PROVIDER_PERFORMANCE=true
```

### Key Metrics

```javascript
// Dashboard metrics
{
  totalLeads: 1250,
  approvedLeads: 980,
  rejectedLeads: 150,
  flaggedLeads: 120,
  approvalRate: 0.784,
  averageScore: 72.5,
  
  providerMetrics: {
    totalProviders: 45,
    activeProviders: 38,
    averageConversionRate: 0.23,
    averageResponseTime: 1847, // seconds
    topPerformers: [...]
  },
  
  revenueMetrics: {
    totalRevenue: 49500.00,
    averageLeadPrice: 50.51,
    projectedMonthlyRevenue: 148500.00
  }
}
```

---

## Global Configuration

### Shared Environment Variables

These apply across all agents:

```env
# AI Models
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_MODEL=gpt-4-turbo-preview
DEFAULT_TEMPERATURE=0.3

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/quoteotter
REDIS_URL=redis://:password@localhost:6379

# Security
JWT_SECRET=your_secure_secret_here
VALID_API_KEYS=api-key-001,api-key-002,api-key-003

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_TO_FILE=true
LOG_DIRECTORY=/var/log/quoteotter

# Rate Limiting
API_RATE_LIMIT=100
RATE_LIMIT_WINDOW_MS=60000

# CORS
CORS_ORIGINS=https://quoteotter.com,https://www.quoteotter.com
ENABLE_CORS_CREDENTIALS=true
```

---

## Agent Collaboration

### Inter-Agent Communication

Agents communicate through shared services:

```javascript
// Example: Lead processing workflow
const leadIntelligence = new LeadIntelligenceAgent();
const compliance = new ComplianceAgent(phoneRevealrClient);
const providerIntel = new ProviderIntelligenceAgent(db);
const operations = new LeadOperationsAgent(db);

// 1. Score lead
const scoring = await leadIntelligence.score(leadData);

// 2. Validate compliance
const validation = await compliance.validate(leadData);

// 3. Match providers (if approved)
if (validation.status === 'approved') {
  const providers = await providerIntel.match(leadData, scoring);
  
  // 4. Distribute to providers
  await operations.distribute(leadData, providers);
}
```

---

## Testing Agent Configuration

### Development Mode

```env
NODE_ENV=development
ENABLE_PHONEREVEALR=false  # Use mock data
ENABLE_EMAIL_NOTIFICATIONS=false
LOG_LEVEL=debug
```

### Staging Mode

```env
NODE_ENV=staging
ENABLE_PHONEREVEALR=true
PHONEREVEALR_API_KEY=test_key_...
ENABLE_EMAIL_NOTIFICATIONS=true
LOG_LEVEL=info
```

### Production Mode

```env
NODE_ENV=production
ENABLE_PHONEREVEALR=true
PHONEREVEALR_API_KEY=prod_key_...
ENABLE_EMAIL_NOTIFICATIONS=true
LOG_LEVEL=warn
```

---

## Monitoring & Debugging

### Health Checks

Each agent exposes health status:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T12:00:00Z",
  "agents": {
    "leadIntelligence": "operational",
    "compliance": "operational",
    "providerIntelligence": "operational",
    "leadOperations": "operational",
    "conversionAnalytics": "operational"
  },
  "services": {
    "database": "connected",
    "redis": "connected",
    "phonerevealr": "available"
  }
}
```

### Logging

All agents log to Winston:

```javascript
logger.info('Lead scored', { 
  leadId: '123-456', 
  score: 85, 
  intent: 'hot' 
});
```

Log levels: `error`, `warn`, `info`, `debug`

---

## Troubleshooting

### Common Issues

**1. Agent not scoring leads**
- Check `ENABLE_LEAD_SCORING=true`
- Verify OpenAI/Anthropic API key
- Check model availability

**2. PhoneRevealr integration failing**
- Verify `PHONEREVEALR_API_KEY` is set
- Check `ENABLE_PHONEREVEALR=true`
- Review API quota/limits

**3. Provider matching not working**
- Ensure providers are `status=active`
- Check service category overlap
- Verify ZIP code coverage

**4. Low approval rates**
- Lower `MIN_QUALITY_SCORE` threshold
- Disable `AUTO_REJECT_HIGH_RISK_VOIP` for testing
- Check fraud detection rules

---

## Best Practices

1. **Start Conservative**: Use higher quality thresholds initially, then relax as you tune
2. **Monitor Performance**: Track approval rates, conversion rates, and adjust scoring weights
3. **Cache Phone Validations**: Set `PHONEREVEALR_CACHE_TTL` high (24h+) to reduce costs
4. **Load Balance**: Enable load balancing to prevent provider overload
5. **Test Thoroughly**: Use staging environment before production changes
6. **Regular Updates**: Review and update suspicious keyword lists and fraud patterns
7. **Optimize Costs**: Use caching, batch operations, and appropriate model selection

---

## Further Reading

- [System Prompt Documentation](./system-prompts.md)
- [API Reference](./api-reference.md)
- [Deployment Guide](../deployment/SETUP.md)
- [PhoneRevealr Integration](../integrations/phonerevealr-guide.md)

---

**Last Updated**: 2025-11-11  
**Version**: 2.0.0
