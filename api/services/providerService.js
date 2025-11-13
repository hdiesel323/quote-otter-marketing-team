const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class ProviderService {
  constructor(db) {
    this.db = db;
  }

  async createProvider(providerData) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const providerId = uuidv4();

    const query = `
      INSERT INTO providers (
        id, name, email, phone, business_name,
        service_categories, service_zip_codes,
        max_leads_per_day, lead_price, quality_threshold,
        status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING *
    `;

    const values = [
      providerId,
      providerData.name,
      providerData.email,
      providerData.phone,
      providerData.businessName,
      providerData.serviceCategories,
      providerData.serviceZipCodes,
      providerData.maxLeadsPerDay || 10,
      providerData.leadPrice,
      providerData.qualityThreshold || 50,
      providerData.status || 'active',
      new Date().toISOString(),
      new Date().toISOString(),
    ];

    try {
      const result = await this.db.query(query, values);
      logger.info(`Provider ${providerId} created: ${providerData.businessName}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create provider:', error);
      throw new AppError('Failed to create provider', 500);
    }
  }

  async getProviderById(providerId) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const query = 'SELECT * FROM providers WHERE id = $1';

    try {
      const result = await this.db.query(query, [providerId]);
      if (result.rows.length === 0) {
        throw new AppError('Provider not found', 404);
      }
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to get provider ${providerId}:`, error);
      throw error;
    }
  }

  async getProviders(filters = {}) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const { page = 1, limit = 20, status, serviceCategory, zipCode } = filters;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM providers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM providers WHERE 1=1';
    const values = [];
    const countValues = [];
    let paramCount = 1;
    let countParamCount = 1;

    if (status) {
      query += ` AND status = $${paramCount++}`;
      countQuery += ` AND status = $${countParamCount++}`;
      values.push(status);
      countValues.push(status);
    }

    if (serviceCategory) {
      query += ` AND $${paramCount++} = ANY(service_categories)`;
      countQuery += ` AND $${countParamCount++} = ANY(service_categories)`;
      values.push(serviceCategory);
      countValues.push(serviceCategory);
    }

    if (zipCode) {
      query += ` AND $${paramCount++} = ANY(service_zip_codes)`;
      countQuery += ` AND $${countParamCount++} = ANY(service_zip_codes)`;
      values.push(zipCode);
      countValues.push(zipCode);
    }

    query += ` ORDER BY conversion_rate DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    try {
      const result = await this.db.query(query, values);
      const countResult = await this.db.query(countQuery, countValues);

      return {
        providers: result.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get providers:', error);
      throw new AppError('Failed to get providers', 500);
    }
  }

  async updateProvider(providerId, updateData) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const allowedFields = [
      'name', 'phone', 'service_categories', 'service_zip_codes',
      'max_leads_per_day', 'lead_price', 'quality_threshold', 'status'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        updates.push(`${snakeKey} = $${paramCount++}`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date().toISOString());
    values.push(providerId);

    const query = `
      UPDATE providers
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        throw new AppError('Provider not found', 404);
      }
      logger.info(`Provider ${providerId} updated`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to update provider ${providerId}:`, error);
      throw error;
    }
  }

  async deleteProvider(providerId) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const query = 'DELETE FROM providers WHERE id = $1 RETURNING *';

    try {
      const result = await this.db.query(query, [providerId]);
      if (result.rows.length === 0) {
        throw new AppError('Provider not found', 404);
      }
      logger.info(`Provider ${providerId} deleted`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to delete provider ${providerId}:`, error);
      throw new AppError('Failed to delete provider', 500);
    }
  }

  async getProviderStats(providerId) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const query = `
      SELECT 
        p.*,
        COUNT(la.id) as total_leads_assigned,
        COUNT(CASE WHEN la.status = 'accepted' THEN 1 END) as leads_accepted,
        COUNT(CASE WHEN la.status = 'converted' THEN 1 END) as leads_converted,
        AVG(la.response_time_seconds) as avg_response_time,
        SUM(CASE WHEN la.status = 'converted' THEN p.lead_price ELSE 0 END) as total_revenue
      FROM providers p
      LEFT JOIN lead_assignments la ON p.id = la.provider_id
      WHERE p.id = $1
      GROUP BY p.id
    `;

    try {
      const result = await this.db.query(query, [providerId]);
      if (result.rows.length === 0) {
        throw new AppError('Provider not found', 404);
      }
      return result.rows[0];
    } catch (error) {
      logger.error(`Failed to get provider stats ${providerId}:`, error);
      throw new AppError('Failed to get provider stats', 500);
    }
  }
}

module.exports = ProviderService;
