# QuoteOtter System - How It Works

## 🎯 Overview

QuoteOtter is an **AI-powered lead generation and distribution system** that:
1. Collects service requests from consumers
2. Scores and validates leads for quality
3. Matches leads to the best service providers
4. Tracks conversions and ROI

---

## 📊 The Lead Lifecycle

### **Step 1: Lead Submission**

A consumer visits your website and submits a service request:

```bash
curl -X POST http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: api-key-001" \
  -d '{
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah@email.com",
    "phone": "+15551234567",
    "zipCode": "90210",
    "serviceCategory": "roofing",
    "serviceDetails": "My roof is leaking after the storm",
    "projectTimeline": "immediate",
    "budget": "5000-10000"
  }'
```

### **Step 2: Lead Intelligence (AI Scoring)**

The system automatically analyzes the lead:

**Scoring Factors (0-100 points):**
- ✅ **Contact Quality (25 pts)**: Valid phone, email, complete name
- ✅ **Project Details (25 pts)**: Service type, timeline, budget provided
- ✅ **Intent Signals (25 pts)**: Urgency keywords detected
- ✅ **Geographic Fit (15 pts)**: In service area with providers
- ✅ **Behavioral Signals (10 pts)**: Return visitor, paid search click

**Intent Detection:**
- 🔥 **Hot Lead** - Emergency keywords ("leaking", "broken", "ASAP") = Ready to buy
- 🟡 **Warm Lead** - Near-term timeline (1-2 weeks) = Comparison shopping
- 🔵 **Cool Lead** - Future planning (3+ months) = Researching

**Example Output:**
```json
{
  "score": 90,
  "intent": "hot",
  "status": "approved"
}
```

### **Step 3: Fraud Detection (Optional)**

If PhoneRevealr is enabled, validates the phone number:
- ❌ Blocks VoIP numbers (Google Voice, Skype)
- ❌ Detects carrier type and risk score
- ❌ Flags suspicious patterns
- ✅ Only accepts real mobile/landline numbers

**Statuses:**
- `approved` - High quality, ready to distribute
- `flagged` - Needs manual review
- `rejected` - Low quality or fraud detected
- `pending` - Awaiting validation

### **Step 4: Provider Matching**

The system finds the best providers based on:

1. **Service Category Match** - Provider offers the requested service
2. **Geographic Coverage** - Provider serves the lead's ZIP code
3. **Quality Threshold** - Lead score meets provider's minimum
4. **Capacity** - Provider hasn't hit daily lead limit
5. **Performance** - Prioritizes high-converting providers

**Example: Provider Setup**
```bash
curl -X POST http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/providers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: api-key-001" \
  -d '{
    "name": "Mike Smith",
    "email": "mike@bestroofing.com",
    "phone": "+15559876543",
    "businessName": "Best Roofing Company",
    "serviceCategories": ["roofing", "siding"],
    "serviceZipCodes": ["90210", "90211", "90212"],
    "leadPrice": 50.00,
    "maxLeadsPerDay": 10,
    "qualityThreshold": 60
  }'
```

### **Step 5: Lead Distribution**

**Three Distribution Models:**

1. **Exclusive** - Lead goes to 1 provider only (highest price)
2. **Shared** - Lead goes to 3-5 providers (competitive)
3. **Marketplace** - Providers bid on leads in real-time

The system automatically:
- ✅ Assigns lead to qualified providers
- ✅ Sends notifications (email/webhook)
- ✅ Tracks response time
- ✅ Monitors conversion status

---

## 🎯 Use Cases

### **1. Home Services Lead Generation**

**Services Supported:**
- Roofing, HVAC, Plumbing, Electrical
- Solar, Windows, Siding, Flooring
- Landscaping, Tree Service, Pest Control

**Flow:**
1. Consumer fills out form on your website
2. Lead scores 85+ → Auto-approved
3. Matched to 3 local contractors
4. Contractors receive instant notification
5. First to respond wins the job

### **2. Insurance Quote Marketplace**

**Services:**
- Auto, Home, Life, Health Insurance
- Medicare, Business Insurance

**Flow:**
1. Consumer requests insurance quotes
2. Lead validated (no VoIP numbers)
3. Distributed to 5 licensed agents
4. Agents compete with best quotes
5. Consumer picks the winner

### **3. Moving & Storage**

**Services:**
- Local moving, Long-distance, International
- Storage facilities

**Flow:**
1. Consumer enters move details
2. Lead scored on project size/budget
3. Matched to movers in origin/destination
4. Movers provide instant estimates

### **4. Legal Services**

**Services:**
- Personal injury, Family law, Bankruptcy
- Estate planning, DUI defense

**Flow:**
1. Consumer describes legal issue
2. Lead scored on case complexity
3. Matched to attorneys by specialty
4. Attorneys offer free consultations

---

## 📊 Analytics & Reporting

### **Track Performance**

```bash
# Get lead metrics
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/analytics/leads \
  -H "X-API-Key: api-key-001" \
  -d '{"startDate": "2025-11-01", "endDate": "2025-11-08"}'

# Get conversion rates
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/analytics/conversions \
  -H "X-API-Key: api-key-001"

# Get provider performance
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/analytics/providers \
  -H "X-API-Key: api-key-001"
```

**Metrics Tracked:**
- Lead volume by service category
- Approval/rejection rates
- Average lead score
- Provider response times
- Conversion rates
- Revenue per lead
- ROI by marketing channel

---

## 🔧 Configuration

### **Environment Variables**

Edit in Coolify or `.env` file:

```env
# Enable/Disable Features
ENABLE_PHONEREVEALR=true          # Turn on fraud detection
ENABLE_FRAUD_DETECTION=true       # Additional fraud checks
ENABLE_ANALYTICS=true             # Track metrics
ENABLE_LEAD_SCORING=true          # AI scoring

# Lead Quality Settings
MIN_QUALITY_SCORE=60              # Minimum score to auto-approve
MAX_PROVIDERS_PER_LEAD=3          # How many providers get each lead
EXCLUSIVITY_WINDOW_HOURS=4        # Exclusive lead time

# Fraud Detection
MIN_RISK_SCORE=70                 # PhoneRevealr minimum (higher = safer)
AUTO_REJECT_HIGH_RISK_VOIP=true  # Block risky VoIP
MAX_DUPLICATE_SUBMISSIONS=3       # Block repeat submitters

# Routing Strategy
ROUTING_STRATEGY=performance_based  # or 'round_robin', 'load_balanced'
```

---

## 🚀 Integration Examples

### **Integrate with Your Website**

**JavaScript Form Submission:**
```javascript
async function submitLead(formData) {
  const response = await fetch('http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'api-key-001'
    },
    body: JSON.stringify({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      zipCode: formData.zipCode,
      serviceCategory: formData.service,
      serviceDetails: formData.details,
      projectTimeline: formData.timeline,
      source: 'website',
      utmSource: formData.utm_source,
      utmCampaign: formData.utm_campaign
    })
  });
  
  const result = await response.json();
  
  if (result.data.lead.status === 'approved') {
    // Show success message
    showThankYou();
  } else if (result.data.lead.status === 'flagged') {
    // Manual review needed
    showPendingMessage();
  }
}
```

### **Webhook Notifications to Providers**

Set up webhooks to notify providers when they get a new lead:

```javascript
// Provider receives webhook POST request
{
  "event": "lead.assigned",
  "lead": {
    "id": "123-456-789",
    "name": "John Doe",
    "phone": "+15551234567",
    "email": "john@email.com",
    "service": "roofing",
    "details": "Need roof repair",
    "score": 90,
    "intent": "hot"
  },
  "assignedAt": "2025-11-08T09:00:00Z"
}
```

---

## 💰 Monetization Models

### **1. Cost Per Lead (CPL)**
- Provider pays $X per qualified lead
- Price varies by service type and geography
- Example: Roofing leads = $50, HVAC = $40

### **2. Pay Per Conversion**
- Provider pays only when lead converts to a sale
- Higher price per conversion
- Example: $200 per closed deal

### **3. Subscription Model**
- Provider pays monthly fee for lead access
- Unlimited leads or tiered pricing
- Example: $500/month for up to 50 leads

### **4. Marketplace Bidding**
- Providers bid on leads in real-time
- Highest bidder gets exclusive access
- Example: Starting bid $30, winning bid $75

---

## 📈 Next Steps

### **To Start Using QuoteOtter:**

1. **Add Providers**
   - Create provider accounts via API
   - Set service areas and pricing
   - Configure lead preferences

2. **Integrate Lead Forms**
   - Add JavaScript to your website
   - Or use direct API calls
   - Test with sample submissions

3. **Enable PhoneRevealr** (Optional)
   - Get API key from PhoneRevealr
   - Add to Coolify environment variables
   - Reduces fraud by 80%+

4. **Monitor Performance**
   - Use analytics endpoints
   - Track conversion rates
   - Optimize lead scoring

5. **Scale Up**
   - Add more service categories
   - Expand geographic coverage
   - Recruit more providers

---

## 🎯 API Reference

**Base URL:** `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001`

**Authentication:** Include `X-API-Key` header in all requests

**Endpoints:**
- `POST /api/leads` - Submit new lead
- `GET /api/leads` - List leads (with filters)
- `GET /api/leads/:id` - Get lead details
- `POST /api/providers` - Create provider
- `GET /api/providers` - List providers
- `GET /api/providers/:id/stats` - Provider performance
- `GET /api/analytics/dashboard` - Full dashboard summary
- `POST /api/phone/validate` - Validate phone number

**Full API documentation:** See `deployment/SETUP.md`

---

## 🆘 Support

**Issues?**
- Check logs: `docker logs <container-name>`
- Health check: `curl http://.../health`
- Database: All tables created successfully

**Questions?**
- Review `DEPLOY-TO-COOLIFY.md`
- Check `deployment/SETUP.md`
- Test with sample API calls above

---

**Your QuoteOtter system is ready to generate and distribute leads!** 🚀
