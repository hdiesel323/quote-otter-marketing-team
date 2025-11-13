/**
 * PhoneRevealr Integration for QuoteOtter
 * 
 * Provides phone validation and fraud detection using PhoneRevealr API
 * https://phonerevealr.com
 */

class PhoneRevealrClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.PHONEREVEALR_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://phonerevealr.com/api';
    this.timeout = config.timeout || 5000; // 5 second timeout
    this.cacheTTL = config.cacheTTL || 3600000; // 1 hour cache
    this.cache = new Map();
  }

  /**
   * Validate a phone number using PhoneRevealr
   */
  async validatePhone(phoneNumber) {
    // Normalize phone number
    const normalized = this.normalizePhone(phoneNumber);
    
    // Check cache first
    const cached = this.cache.get(normalized);
    if (cached) {
      return cached;
    }

    try {
      // Call PhoneRevealr API
      const response = await this.callPhoneRevealrAPI(normalized);
      
      // Analyze results and determine risk
      const result = this.analyzePhoneData(response);
      
      // Cache result
      this.cache.set(normalized, result);
      setTimeout(() => this.cache.delete(normalized), this.cacheTTL);
      
      return result;
    } catch (error) {
      // Fallback to basic validation if API fails
      console.error('PhoneRevealr API error:', error);
      return this.fallbackValidation(normalized);
    }
  }

  /**
   * Batch validate multiple phone numbers
   */
  async validateBatch(phoneNumbers) {
    const results = new Map();
    
    // Process in parallel with concurrency limit
    const concurrency = 10;
    const chunks = this.chunk(phoneNumbers, concurrency);
    
    for (const chunk of chunks) {
      const promises = chunk.map(phone => 
        this.validatePhone(phone).then(result => ({ phone, result }))
      );
      
      const chunkResults = await Promise.all(promises);
      chunkResults.forEach(({ phone, result }) => {
        results.set(phone, result);
      });
    }
    
    return results;
  }

  /**
   * Call PhoneRevealr API
   */
  async callPhoneRevealrAPI(phone) {
    const url = `${this.baseUrl}/validate?phone=${encodeURIComponent(phone)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`PhoneRevealr API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Analyze PhoneRevealr data and determine risk level
   */
  analyzePhoneData(response) {
    if (!response.success || !response.data) {
      return {
        isValid: false,
        riskLevel: 'critical',
        riskScore: 0,
        lineType: 'invalid',
        carrier: 'unknown',
        isVoip: false,
        recommendation: 'reject',
        reason: 'Phone validation failed or returned invalid data',
      };
    }

    const data = response.data;
    let riskScore = 100;
    let riskLevel = 'low';
    let recommendation = 'approve';
    let reason = '';

    // Invalid or disconnected phone
    if (!data.valid || data.line_type === 'invalid') {
      return {
        isValid: false,
        riskLevel: 'critical',
        riskScore: 0,
        lineType: data.line_type,
        carrier: data.carrier,
        isVoip: data.is_voip,
        recommendation: 'reject',
        reason: 'Invalid or disconnected phone number',
        phoneRevealrData: data,
      };
    }

    // Mobile or Landline - Best case
    if (data.line_type === 'mobile' || data.line_type === 'landline') {
      riskScore = 95;
      riskLevel = 'low';
      recommendation = 'approve';
      reason = `Valid ${data.line_type} number from ${data.carrier}`;
    }
    
    // VoIP - Requires scrutiny
    else if (data.line_type === 'voip' || data.is_voip) {
      riskScore = 60;
      riskLevel = 'medium';
      recommendation = 'flag';
      reason = `VoIP number detected (${data.carrier}). Requires manual review for fraud risk.`;
      
      // Known problematic VoIP services
      const highRiskVoIP = ['google voice', 'skype', 'vonage', 'magic jack'];
      const carrierLower = data.carrier.toLowerCase();
      
      if (highRiskVoIP.some(service => carrierLower.includes(service))) {
        riskScore = 40;
        riskLevel = 'high';
        reason = `High-risk VoIP service detected (${data.carrier}). Common in fraud.`;
      }
    }
    
    // Unknown line type
    else {
      riskScore = 50;
      riskLevel = 'medium';
      recommendation = 'flag';
      reason = 'Unable to determine line type. Requires manual verification.';
    }

    // Check for international (if US-only service)
    if (data.country !== 'US') {
      riskScore = Math.min(riskScore, 30);
      riskLevel = 'high';
      recommendation = 'reject';
      reason = `International phone number from ${data.country}. Service is US-only.`;
    }

    // Use PhoneRevealr risk score if available
    if (data.risk_score !== undefined) {
      // PhoneRevealr risk_score: 0-100, lower = riskier
      // Blend with our score
      riskScore = Math.round((riskScore + data.risk_score) / 2);
    }

    // Final risk level determination
    if (riskScore >= 85) {
      riskLevel = 'low';
      recommendation = 'approve';
    } else if (riskScore >= 65) {
      riskLevel = 'medium';
      recommendation = 'flag';
    } else if (riskScore >= 40) {
      riskLevel = 'high';
      recommendation = 'reject';
    } else {
      riskLevel = 'critical';
      recommendation = 'reject';
    }

    return {
      isValid: true,
      riskLevel,
      riskScore,
      lineType: data.line_type,
      carrier: data.carrier,
      isVoip: data.is_voip,
      recommendation,
      reason,
      phoneRevealrData: data,
    };
  }

  /**
   * Fallback validation when API is unavailable
   */
  fallbackValidation(phone) {
    // Basic format check only
    const isValid = /^\+?1?\d{10,11}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
    
    if (!isValid) {
      return {
        isValid: false,
        riskLevel: 'critical',
        riskScore: 0,
        lineType: 'invalid',
        carrier: 'unknown',
        isVoip: false,
        recommendation: 'reject',
        reason: 'Invalid phone format (API unavailable for full validation)',
      };
    }

    return {
      isValid: true,
      riskLevel: 'medium',
      riskScore: 60,
      lineType: 'unknown',
      carrier: 'unknown',
      isVoip: false,
      recommendation: 'flag',
      reason: 'PhoneRevealr API unavailable. Basic format check passed but requires manual review.',
    };
  }

  /**
   * Normalize phone number to E.164 format
   */
  normalizePhone(phone) {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // Add US country code if missing
    if (digits.length === 10) {
      digits = '1' + digits;
    }
    
    // Add + prefix
    return '+' + digits;
  }

  /**
   * Split array into chunks
   */
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Express middleware for phone validation
 */
function validatePhoneMiddleware(phoneField = 'phone') {
  return async (req, res, next) => {
    const phone = req.body[phoneField];
    
    if (!phone) {
      return res.status(400).json({
        error: 'Phone number required',
        field: phoneField,
      });
    }

    try {
      const phoneRevealrInstance = req.app.get('phoneRevealrClient');
      if (!phoneRevealrInstance) {
        throw new Error('PhoneRevealr client not initialized');
      }

      const validation = await phoneRevealrInstance.validatePhone(phone);
      
      // Attach validation result to request
      req.phoneValidation = validation;
      
      // Auto-reject if recommendation is reject
      if (validation.recommendation === 'reject') {
        return res.status(400).json({
          error: 'Phone validation failed',
          reason: validation.reason,
          riskLevel: validation.riskLevel,
        });
      }
      
      // Flag for manual review
      if (validation.recommendation === 'flag') {
        req.phoneValidation.needsReview = true;
      }
      
      next();
    } catch (error) {
      // Don't block on validation errors, but flag for review
      console.error('Phone validation error:', error);
      req.phoneValidation = {
        isValid: true,
        riskLevel: 'medium',
        riskScore: 60,
        lineType: 'unknown',
        carrier: 'unknown',
        isVoip: false,
        recommendation: 'flag',
        reason: 'Validation service error',
        needsReview: true,
      };
      next();
    }
  };
}

module.exports = PhoneRevealrClient;
module.exports.PhoneRevealrClient = PhoneRevealrClient;
module.exports.validatePhoneMiddleware = validatePhoneMiddleware;
