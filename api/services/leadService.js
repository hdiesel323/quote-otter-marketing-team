const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class LeadService {
  constructor(db, phoneRevealrClient) {
    this.db = db;
    this.phoneRevealr = phoneRevealrClient;
  }

  async createLead(leadData) {
    const leadId = uuidv4();
    
    logger.info(`Creating lead ${leadId}`, { leadData });

    const lead = {
      id: leadId,
      ...leadData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const scoredLead = await this.scoreLead(lead);
    const validatedLead = await this.validatePhone(scoredLead);
    
    await this.saveLead(validatedLead);

    if (validatedLead.status === 'approved') {
      await this.distributeLead(validatedLead);
    }

    return validatedLead;
  }

  async scoreLead(lead) {
    logger.info(`Scoring lead ${lead.id}`);

    let score = 0;

    if (lead.phone && lead.email && lead.firstName && lead.lastName) {
      score += 25;
    } else {
      score += 10;
    }

    if (lead.serviceCategory && lead.zipCode) {
      score += 25;
    }

    if (lead.serviceDetails && lead.serviceDetails.length > 20) {
      score += 15;
    }

    if (lead.projectTimeline === 'immediate') {
      score += 25;
    } else if (lead.projectTimeline === 'within-week') {
      score += 15;
    } else if (lead.projectTimeline === 'within-month') {
      score += 10;
    }

    if (lead.budget) {
      score += 10;
    }

    const intent = this.detectIntent(lead);
    lead.intent = intent;
    lead.score = Math.min(score, 100);

    logger.info(`Lead ${lead.id} scored: ${lead.score}, intent: ${intent}`);

    return lead;
  }

  detectIntent(lead) {
    const urgentKeywords = ['emergency', 'urgent', 'asap', 'immediately', 'broken', 'leak', 'not working'];
    const text = `${lead.serviceDetails || ''} ${lead.notes || ''}`.toLowerCase();

    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      return 'hot';
    }

    if (lead.projectTimeline === 'immediate' || lead.projectTimeline === 'within-week') {
      return 'warm';
    }

    return 'cool';
  }

  async validatePhone(lead) {
    if (!this.phoneRevealr) {
      logger.warn('PhoneRevealr not configured, skipping validation');
      lead.phoneValidation = { status: 'skipped' };
      return lead;
    }

    try {
      logger.info(`Validating phone for lead ${lead.id}: ${lead.phone}`);
      
      const validation = await this.phoneRevealr.validatePhone(lead.phone);
      lead.phoneValidation = validation;

      if (validation.isVoip && validation.riskScore > 70) {
        lead.status = 'flagged';
        lead.flagReason = 'High-risk VoIP number detected';
        logger.warn(`Lead ${lead.id} flagged: High-risk VoIP`);
      } else if (validation.isValid && lead.score >= 50) {
        lead.status = 'approved';
      } else if (lead.score < 30) {
        lead.status = 'rejected';
        lead.flagReason = 'Low quality score';
      } else {
        lead.status = 'pending';
      }

    } catch (error) {
      logger.error(`Phone validation failed for lead ${lead.id}:`, error);
      lead.phoneValidation = { status: 'error', error: error.message };
      lead.status = 'pending';
    }

    return lead;
  }

  async saveLead(lead) {
    if (!this.db) {
      logger.warn('Database not configured, lead not saved');
      return lead;
    }

    const query = `
      INSERT INTO leads (
        id, first_name, last_name, email, phone, zip_code,
        service_category, service_details, project_timeline, budget,
        notes, source, utm_source, utm_medium, utm_campaign,
        score, intent, status, flag_reason,
        phone_validation, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      )
      RETURNING *
    `;

    const values = [
      lead.id,
      lead.firstName,
      lead.lastName,
      lead.email,
      lead.phone,
      lead.zipCode,
      lead.serviceCategory,
      lead.serviceDetails,
      lead.projectTimeline,
      lead.budget,
      lead.notes,
      lead.source,
      lead.utmSource,
      lead.utmMedium,
      lead.utmCampaign,
      lead.score,
      lead.intent,
      lead.status,
      lead.flagReason,
      JSON.stringify(lead.phoneValidation),
      lead.createdAt,
      lead.updatedAt,
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info(`Lead ${lead.id} saved to database`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to save lead ${lead.id}:`, error);
      throw new AppError('Failed to save lead', 500);
    }
  }

  async distributeLead(lead) {
    logger.info(`Distributing lead ${lead.id}`);

    const providers = await this.findMatchingProviders(lead);

    if (providers.length === 0) {
      logger.warn(`No providers found for lead ${lead.id}`);
      await this.updateLeadStatus(lead.id, 'pending', 'No matching providers');
      return;
    }

    for (const provider of providers) {
      await this.assignLeadToProvider(lead.id, provider.id);
    }

    await this.updateLeadStatus(lead.id, 'distributed');
    logger.info(`Lead ${lead.id} distributed to ${providers.length} providers`);
  }

  async findMatchingProviders(lead) {
    if (!this.db) {
      return [];
    }

    const query = `
      SELECT p.* FROM providers p
      WHERE p.status = 'active'
        AND $1 = ANY(p.service_categories)
        AND $2 = ANY(p.service_zip_codes)
        AND p.leads_today < p.max_leads_per_day
        AND $3 >= p.quality_threshold
      ORDER BY p.conversion_rate DESC, p.response_time_avg ASC
      LIMIT 3
    `;

    try {
      const result = await this.db.query(query, [
        lead.serviceCategory,
        lead.zipCode,
        lead.score,
      ]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to find matching providers:', error);
      return [];
    }
  }

  async assignLeadToProvider(leadId, providerId) {
    if (!this.db) {
      return;
    }

    const query = `
      INSERT INTO lead_assignments (id, lead_id, provider_id, assigned_at, status)
      VALUES ($1, $2, $3, $4, 'pending')
    `;

    try {
      await this.db.query(query, [uuidv4(), leadId, providerId, new Date().toISOString()]);
      logger.info(`Lead ${leadId} assigned to provider ${providerId}`);
    } catch (error) {
      logger.error(`Failed to assign lead ${leadId} to provider ${providerId}:`, error);
    }
  }

  async updateLeadStatus(leadId, status, flagReason = null) {
    if (!this.db) {
      return;
    }

    const query = `
      UPDATE leads
      SET status = $1, flag_reason = $2, updated_at = $3
      WHERE id = $4
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, [status, flagReason, new Date().toISOString(), leadId]);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to update lead status ${leadId}:`, error);
      throw new AppError('Failed to update lead status', 500);
    }
  }

  async getLeadById(leadId) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const query = 'SELECT * FROM leads WHERE id = $1';
    
    try {
      const result = await this.db.query(query, [leadId]);
      if (result.rows.length === 0) {
        throw new AppError('Lead not found', 404);
      }
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to get lead ${leadId}:`, error);
      throw error;
    }
  }

  async getLeads(filters = {}) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const { page = 1, limit = 20, status, serviceCategory, minScore, maxScore, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM leads WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    if (serviceCategory) {
      query += ` AND service_category = $${paramCount++}`;
      values.push(serviceCategory);
    }

    if (minScore !== undefined) {
      query += ` AND score >= $${paramCount++}`;
      values.push(minScore);
    }

    if (maxScore !== undefined) {
      query += ` AND score <= $${paramCount++}`;
      values.push(maxScore);
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      values.push(endDate);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()} LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    try {
      const result = await this.db.query(query, values);
      const countQuery = 'SELECT COUNT(*) FROM leads WHERE 1=1';
      const countResult = await this.db.query(countQuery);
      
      return {
        leads: result.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get leads:', error);
      throw new AppError('Failed to get leads', 500);
    }
  }
}

module.exports = LeadService;
