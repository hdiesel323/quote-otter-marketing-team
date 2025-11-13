# QuoteOtter Integration - Instructions for AI Assistant

## 📋 Context

I need you to integrate a **lead generation API** called QuoteOtter into a website. All the backend infrastructure is already deployed and working - you just need to create the frontend integration.

---

## 🔌 API Configuration

**API Endpoint:** `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001`

**Authentication:** Include this header in all requests:
```
X-API-Key: api-key-001
```

**Test the API works:**
```bash
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/health
```

Expected response: `{"status":"healthy","version":"2.0.0"}`

---

## 📝 What QuoteOtter Does

QuoteOtter is a lead generation system that:
1. Accepts service requests from consumers (roofing, HVAC, plumbing, etc.)
2. Scores leads with AI (0-100 quality score)
3. Matches leads to service providers
4. Tracks conversions and analytics

---

## 🎯 Your Task

Create a lead capture form that submits to the QuoteOtter API.

### Required Form Fields:

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| firstName | string | Yes | 2-50 characters |
| lastName | string | Yes | 2-50 characters |
| email | string | Yes | Valid email format |
| phone | string | Yes | Valid phone number |
| zipCode | string | Yes | 5-digit US ZIP code |
| serviceCategory | string | Yes | See options below |
| serviceDetails | string | Yes | 1-500 characters |
| projectTimeline | string | No | See options below |
| budget | string | No | Free text |

### Service Category Options:
- roofing
- hvac
- plumbing
- electrical
- solar
- windows
- siding
- flooring
- painting
- remodeling
- landscaping
- tree-service
- pest-control

### Project Timeline Options:
- immediate
- within-week
- within-month
- flexible

---

## 🔧 API Endpoint to Use

**Submit a Lead:**
```
POST http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads
```

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "X-API-Key": "api-key-001"
}
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+15551234567",
  "zipCode": "90210",
  "serviceCategory": "roofing",
  "serviceDetails": "Need roof repair after storm",
  "projectTimeline": "immediate",
  "budget": "5000-10000",
  "source": "website",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "roofing-2025"
}
```

**Successful Response (201):**
```json
{
  "status": "success",
  "data": {
    "lead": {
      "id": "85236259-7972-4282-9057-933f57ccfaae",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+15551234567",
      "zipCode": "90210",
      "serviceCategory": "roofing",
      "serviceDetails": "Need roof repair after storm",
      "projectTimeline": "immediate",
      "status": "approved",
      "score": 90,
      "intent": "hot",
      "createdAt": "2025-11-08T08:56:42.447Z"
    }
  }
}
```

**Error Response (400):**
```json
{
  "status": "fail",
  "message": "Email is required"
}
```

---

## 📱 Implementation Requirements

### 1. **Form Validation**
- Validate all required fields before submission
- Show inline validation errors
- Disable submit button during API call

### 2. **User Experience**
- Show loading state during submission ("Submitting...")
- On success: Hide form, show success message
- On error: Show error message, keep form visible
- Success message: "Thank you! Local professionals will contact you shortly."

### 3. **UTM Tracking (Optional but recommended)**
- Capture UTM parameters from URL query string
- Include in API request: `utmSource`, `utmMedium`, `utmCampaign`
- Example: `?utm_source=google&utm_medium=cpc&utm_campaign=roofing`

### 4. **Analytics (Optional)**
- Track form submission in Google Analytics
- Event: `generate_lead`
- Category: `engagement`
- Label: Service category

---

## 💻 Example Implementation (JavaScript)

```javascript
async function submitLead(formData) {
  try {
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
        serviceCategory: formData.serviceCategory,
        serviceDetails: formData.serviceDetails,
        projectTimeline: formData.projectTimeline || 'immediate',
        budget: formData.budget || undefined,
        source: 'website',
        utmSource: new URLSearchParams(window.location.search).get('utm_source'),
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      // Show success message
      console.log('Lead created:', result.data.lead);
      return { success: true, lead: result.data.lead };
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 🎨 Framework-Specific Instructions

### **If using React/Next.js:**
- Create a `<QuoteForm>` component
- Use `useState` for form data and submission state
- Use `fetch` or `axios` for API calls
- Show loading spinner during submission

### **If using Vue.js:**
- Create a `QuoteForm.vue` component
- Use `v-model` for two-way binding
- Use Composition API or Options API
- Handle form submission with async method

### **If using plain HTML/JavaScript:**
- Use `addEventListener` for form submission
- Prevent default form behavior
- Use FormData API to collect inputs
- Show/hide success/error messages with DOM manipulation

### **If using WordPress:**
- Create shortcode or Gutenberg block
- Use WordPress AJAX or REST API proxy
- Enqueue scripts properly with `wp_enqueue_script`
- Sanitize and validate inputs

---

## 🔒 Security Note

**IMPORTANT:** The API key `api-key-001` is included in this example. For production:

**Option 1 (Better):** Create a backend proxy:
```javascript
// Your backend endpoint
app.post('/api/submit-lead', async (req, res) => {
  const response = await fetch('http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.QUOTEOTTER_API_KEY // Stored securely on server
    },
    body: JSON.stringify(req.body)
  });
  res.json(await response.json());
});
```

Then frontend calls: `fetch('/api/submit-lead', { ... })`

**Option 2:** Use the API key directly (acceptable for MVP/demo)

---

## ✅ Testing

**Test the integration with this data:**
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phone": "+15551234567",
  "zipCode": "90210",
  "serviceCategory": "roofing",
  "serviceDetails": "Test submission from integration",
  "projectTimeline": "immediate"
}
```

**Verify success:**
- Check API returns `status: "success"`
- Lead should have a `score` (0-100)
- Lead should have an `intent` ("hot", "warm", or "cool")
- Lead `status` should be "approved", "pending", or "flagged"

---

## 📚 Additional Resources

**Full API Documentation:** See `WEBSITE-INTEGRATION.md` file for:
- Complete HTML form example
- React component example
- WordPress plugin example
- iframe embed example

**Test API Health:**
```bash
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/health
```

**View All Leads:**
```bash
curl -H "X-API-Key: api-key-001" \
  http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads
```

---

## 🎯 Success Criteria

Your integration is successful when:
- ✅ Form submits to QuoteOtter API
- ✅ All required fields are validated
- ✅ Success/error messages are shown appropriately
- ✅ Loading state is displayed during submission
- ✅ API returns successful response with lead data
- ✅ Form matches the website's design/branding

---

## 🆘 Troubleshooting

**API not responding:**
- Check endpoint URL is correct (including `:3001` port)
- Verify `X-API-Key` header is included
- Check CORS if calling from different domain

**Validation errors:**
- Ensure all required fields are included
- Phone must be in format: `+15551234567`
- ZIP code must be 5 digits
- Service category must match one of the allowed values

**500 errors:**
- Check request body JSON is valid
- Ensure Content-Type header is `application/json`
- Verify all required fields are present

---

## 📞 Questions?

If you need clarification:
1. Check the `WEBSITE-INTEGRATION.md` file for complete examples
2. Test the API with curl commands above
3. Review the example implementations for your framework

**The API is live and ready to receive leads!** 🚀
