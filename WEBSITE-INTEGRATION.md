# QuoteOtter Website Integration Guide

## 🌐 Your API Endpoint

**API Base URL:** `http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001`

**API Key:** `api-key-001` (Include in `X-API-Key` header)

---

## 📝 Method 1: Simple HTML Form + JavaScript

### **Step 1: Create Your Lead Form**

Add this HTML form to your website:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Get a Quote</title>
    <style>
        .quote-form {
            max-width: 600px;
            margin: 50px auto;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: Arial, sans-serif;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #0056b3;
        }
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            display: none;
        }
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="quote-form">
        <h2>Get Your Free Quote</h2>
        <p>Fill out the form below and we'll connect you with top-rated local professionals.</p>
        
        <form id="quoteForm">
            <div class="form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" required>
            </div>
            
            <div class="form-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" required>
            </div>
            
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="phone" placeholder="+1 555-123-4567" required>
            </div>
            
            <div class="form-group">
                <label>ZIP Code *</label>
                <input type="text" name="zipCode" pattern="[0-9]{5}" required>
            </div>
            
            <div class="form-group">
                <label>Service Needed *</label>
                <select name="serviceCategory" required>
                    <option value="">-- Select Service --</option>
                    <option value="roofing">Roofing</option>
                    <option value="hvac">HVAC</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="solar">Solar Installation</option>
                    <option value="windows">Windows</option>
                    <option value="siding">Siding</option>
                    <option value="flooring">Flooring</option>
                    <option value="painting">Painting</option>
                    <option value="landscaping">Landscaping</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Project Details *</label>
                <textarea name="serviceDetails" rows="4" placeholder="Tell us about your project..." required></textarea>
            </div>
            
            <div class="form-group">
                <label>When do you need this done? *</label>
                <select name="projectTimeline" required>
                    <option value="immediate">As soon as possible</option>
                    <option value="within-week">Within a week</option>
                    <option value="within-month">Within a month</option>
                    <option value="flexible">Flexible / Planning ahead</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Budget Range (Optional)</label>
                <input type="text" name="budget" placeholder="e.g., $5,000 - $10,000">
            </div>
            
            <button type="submit">Get Free Quotes</button>
        </form>
        
        <div class="success-message" id="successMessage">
            <h3>✅ Thank You!</h3>
            <p>Your request has been submitted. Local professionals will contact you shortly with free quotes.</p>
        </div>
        
        <div class="error-message" id="errorMessage">
            <h3>❌ Oops!</h3>
            <p id="errorText">Something went wrong. Please try again.</p>
        </div>
    </div>

    <script>
        document.getElementById('quoteForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(e.target);
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                zipCode: formData.get('zipCode'),
                serviceCategory: formData.get('serviceCategory'),
                serviceDetails: formData.get('serviceDetails'),
                projectTimeline: formData.get('projectTimeline'),
                budget: formData.get('budget') || undefined,
                source: 'website',
                utmSource: new URLSearchParams(window.location.search).get('utm_source'),
                utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
                utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
            };
            
            // Show loading state
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;
            
            try {
                // Submit to QuoteOtter API
                const response = await fetch('http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'api-key-001'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    // Hide form and show success message
                    document.getElementById('quoteForm').style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                    
                    // Optional: Track conversion in Google Analytics
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'conversion', {
                            'send_to': 'YOUR-GA-ID',
                            'value': 1.0,
                            'currency': 'USD'
                        });
                    }
                    
                    // Optional: Redirect to thank you page after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/thank-you';
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Submission failed');
                }
            } catch (error) {
                console.error('Error submitting lead:', error);
                document.getElementById('errorText').textContent = error.message;
                document.getElementById('errorMessage').style.display = 'block';
                
                // Re-enable submit button
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    </script>
</body>
</html>
```

---

## 🔌 Method 2: React/Next.js Component

```jsx
// components/QuoteForm.jsx
import { useState } from 'react';

export default function QuoteForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zipCode: '',
    serviceCategory: '',
    serviceDetails: '',
    projectTimeline: 'immediate',
    budget: ''
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'api-key-001'
        },
        body: JSON.stringify({
          ...formData,
          source: 'website',
          utmSource: new URLSearchParams(window.location.search).get('utm_source'),
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setStatus('success');
        
        // Track in Google Analytics
        if (window.gtag) {
          window.gtag('event', 'generate_lead', {
            event_category: 'engagement',
            event_label: formData.serviceCategory,
            value: 1
          });
        }
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (status === 'success') {
    return (
      <div className="success-message">
        <h2>✅ Thank You!</h2>
        <p>Your request has been submitted. Local professionals will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="quote-form">
      <h2>Get Your Free Quote</h2>
      
      <input
        type="text"
        name="firstName"
        placeholder="First Name"
        value={formData.firstName}
        onChange={handleChange}
        required
      />
      
      <input
        type="text"
        name="lastName"
        placeholder="Last Name"
        value={formData.lastName}
        onChange={handleChange}
        required
      />
      
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <input
        type="tel"
        name="phone"
        placeholder="Phone Number"
        value={formData.phone}
        onChange={handleChange}
        required
      />
      
      <input
        type="text"
        name="zipCode"
        placeholder="ZIP Code"
        value={formData.zipCode}
        onChange={handleChange}
        required
      />
      
      <select
        name="serviceCategory"
        value={formData.serviceCategory}
        onChange={handleChange}
        required
      >
        <option value="">Select Service</option>
        <option value="roofing">Roofing</option>
        <option value="hvac">HVAC</option>
        <option value="plumbing">Plumbing</option>
        <option value="electrical">Electrical</option>
        <option value="solar">Solar</option>
      </select>
      
      <textarea
        name="serviceDetails"
        placeholder="Project Details"
        value={formData.serviceDetails}
        onChange={handleChange}
        required
      />
      
      <select
        name="projectTimeline"
        value={formData.projectTimeline}
        onChange={handleChange}
      >
        <option value="immediate">ASAP</option>
        <option value="within-week">Within a week</option>
        <option value="within-month">Within a month</option>
        <option value="flexible">Flexible</option>
      </select>
      
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting...' : 'Get Free Quotes'}
      </button>
      
      {status === 'error' && (
        <div className="error-message">{errorMessage}</div>
      )}
    </form>
  );
}
```

---

## 🔗 Method 3: WordPress Plugin Integration

```php
<?php
/*
Plugin Name: QuoteOtter Lead Capture
Description: Capture leads and send to QuoteOtter API
Version: 1.0
*/

// Add shortcode [quoteotter_form]
function quoteotter_form_shortcode() {
    ob_start();
    ?>
    <form id="quoteotter-form" class="quoteotter-form">
        <input type="text" name="firstName" placeholder="First Name" required>
        <input type="text" name="lastName" placeholder="Last Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="phone" placeholder="Phone" required>
        <input type="text" name="zipCode" placeholder="ZIP Code" required>
        
        <select name="serviceCategory" required>
            <option value="">Select Service</option>
            <option value="roofing">Roofing</option>
            <option value="hvac">HVAC</option>
            <option value="plumbing">Plumbing</option>
        </select>
        
        <textarea name="serviceDetails" placeholder="Project Details" required></textarea>
        
        <button type="submit">Get Free Quotes</button>
    </form>
    
    <div id="quoteotter-success" style="display:none;">
        <h3>Thank you! We'll be in touch soon.</h3>
    </div>
    
    <script>
    document.getElementById('quoteotter-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            zipCode: formData.get('zipCode'),
            serviceCategory: formData.get('serviceCategory'),
            serviceDetails: formData.get('serviceDetails'),
            projectTimeline: 'immediate',
            source: 'wordpress'
        };
        
        try {
            const response = await fetch('http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': 'api-key-001'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                document.getElementById('quoteotter-form').style.display = 'none';
                document.getElementById('quoteotter-success').style.display = 'block';
            }
        } catch (error) {
            alert('Error submitting form. Please try again.');
        }
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('quoteotter_form', 'quoteotter_form_shortcode');
?>
```

**Usage in WordPress:** Add `[quoteotter_form]` to any page/post

---

## 🎨 Method 4: Embedded Widget (iframe)

Create a standalone page and embed it anywhere:

```html
<!-- Your main website -->
<iframe 
    src="https://yoursite.com/quote-form.html" 
    width="100%" 
    height="800" 
    frameborder="0"
></iframe>
```

---

## 📊 Track Lead Quality

After integration, monitor your leads:

```bash
# View all leads
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads \
  -H "X-API-Key: api-key-001"

# Get analytics
curl http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/analytics/dashboard?startDate=2025-11-01&endDate=2025-11-08 \
  -H "X-API-Key: api-key-001"
```

---

## 🔒 Security Best Practices

### **Option 1: Use Your Backend as Proxy (Recommended)**

Don't expose API key in frontend. Create a backend endpoint:

```javascript
// Your backend (Node.js/Express)
app.post('/api/submit-quote', async (req, res) => {
  try {
    const response = await fetch('http://w44okccwwsokwscks88kgswo.46.224.16.19.sslip.io:3001/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.QUOTEOTTER_API_KEY // Stored securely on server
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit lead' });
  }
});
```

Then your frontend calls your backend instead:
```javascript
fetch('/api/submit-quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(leadData)
});
```

### **Option 2: Create Domain-Specific API Keys**

In Coolify, you can create different API keys for different domains to track sources.

---

## 🎯 Next Steps

1. **Copy one of the integration methods above**
2. **Paste into your website code**
3. **Test by submitting a lead**
4. **Monitor results in Coolify dashboard**

Your leads will automatically be:
- ✅ Scored (0-100)
- ✅ Validated
- ✅ Matched to providers
- ✅ Tracked for analytics

**Need help with a specific CMS or framework? Let me know!**
