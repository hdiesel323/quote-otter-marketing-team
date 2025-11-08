const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class AnalyticsService {
  constructor(db) {
    this.db = db;
  }

  async getLeadMetrics(filters = {}) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const { startDate, endDate, serviceCategory, providerId, groupBy = 'day' } = filters;

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    let query = `
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as period,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_leads,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_leads,
        COUNT(CASE WHEN status = 'flagged' THEN 1 END) as flagged_leads,
        AVG(score) as avg_score,
        COUNT(CASE WHEN intent = 'hot' THEN 1 END) as hot_leads,
        COUNT(CASE WHEN intent = 'warm' THEN 1 END) as warm_leads,
        COUNT(CASE WHEN intent = 'cool' THEN 1 END) as cool_leads
      FROM leads
      WHERE created_at >= $1 AND created_at <= $2
    `;

    const values = [startDate, endDate];
    let paramCount = 3;

    if (serviceCategory) {
      query += ` AND service_category = $${paramCount++}`;
      values.push(serviceCategory);
    }

    query += ` GROUP BY period ORDER BY period ASC`;

    try {
      const result = await this.db.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get lead metrics:', error);
      throw new AppError('Failed to get lead metrics', 500);
    }
  }

  async getConversionMetrics(filters = {}) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const { startDate, endDate, providerId } = filters;

    let query = `
      SELECT 
        COUNT(DISTINCT la.lead_id) as total_assigned,
        COUNT(CASE WHEN la.status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN la.status = 'converted' THEN 1 END) as converted,
        COUNT(CASE WHEN la.status = 'rejected' THEN 1 END) as rejected,
        AVG(la.response_time_seconds) as avg_response_time_seconds,
        AVG(CASE WHEN la.status = 'converted' THEN la.time_to_convert_hours END) as avg_time_to_convert_hours
      FROM lead_assignments la
      WHERE la.assigned_at >= $1 AND la.assigned_at <= $2
    `;

    const values = [startDate, endDate];

    if (providerId) {
      query += ' AND la.provider_id = $3';
      values.push(providerId);
    }

    try {
      const result = await this.db.query(query, values);
      const metrics = result.rows[0];

      metrics.acceptance_rate = metrics.total_assigned > 0 
        ? (metrics.accepted / metrics.total_assigned * 100).toFixed(2)
        : 0;

      metrics.conversion_rate = metrics.accepted > 0
        ? (metrics.converted / metrics.accepted * 100).toFixed(2)
        : 0;

      return metrics;
    } catch (error) {
      logger.error('Failed to get conversion metrics:', error);
      throw new AppError('Failed to get conversion metrics', 500);
    }
  }

  async getServiceCategoryBreakdown(filters = {}) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const { startDate, endDate } = filters;

    const query = `
      SELECT 
        service_category,
        COUNT(*) as total_leads,
        AVG(score) as avg_score,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_leads
      FROM leads
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY service_category
      ORDER BY total_leads DESC
    `;

    try {
      const result = await this.db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get service category breakdown:', error);
      throw new AppError('Failed to get service category breakdown', 500);
    }
  }

  async getProviderPerformance(filters = {}) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const { startDate, endDate } = filters;

    const query = `
      SELECT 
        p.id,
        p.business_name,
        COUNT(DISTINCT la.lead_id) as leads_assigned,
        COUNT(CASE WHEN la.status = 'accepted' THEN 1 END) as leads_accepted,
        COUNT(CASE WHEN la.status = 'converted' THEN 1 END) as leads_converted,
        AVG(la.response_time_seconds) as avg_response_time_seconds,
        SUM(CASE WHEN la.status = 'converted' THEN p.lead_price ELSE 0 END) as total_revenue
      FROM providers p
      LEFT JOIN lead_assignments la ON p.id = la.provider_id
      WHERE la.assigned_at >= $1 AND la.assigned_at <= $2
      GROUP BY p.id, p.business_name
      ORDER BY leads_converted DESC
    `;

    try {
      const result = await this.db.query(query, [startDate, endDate]);
      
      result.rows.forEach(row => {
        row.acceptance_rate = row.leads_assigned > 0
          ? ((row.leads_accepted / row.leads_assigned) * 100).toFixed(2)
          : 0;
        
        row.conversion_rate = row.leads_accepted > 0
          ? ((row.leads_converted / row.leads_accepted) * 100).toFixed(2)
          : 0;
      });

      return result.rows;
    } catch (error) {
      logger.error('Failed to get provider performance:', error);
      throw new AppError('Failed to get provider performance', 500);
    }
  }

  async getRevenueMetrics(filters = {}) {
    if (!this.db) {
      throw new AppError('Database not configured', 500);
    }

    const { startDate, endDate, providerId } = filters;

    let query = `
      SELECT 
        COUNT(CASE WHEN la.status = 'converted' THEN 1 END) as total_conversions,
        SUM(CASE WHEN la.status = 'converted' THEN p.lead_price ELSE 0 END) as total_revenue,
        AVG(CASE WHEN la.status = 'converted' THEN p.lead_price END) as avg_revenue_per_conversion,
        SUM(p.lead_price) as total_potential_revenue
      FROM lead_assignments la
      JOIN providers p ON la.provider_id = p.id
      WHERE la.assigned_at >= $1 AND la.assigned_at <= $2
    `;

    const values = [startDate, endDate];

    if (providerId) {
      query += ' AND la.provider_id = $3';
      values.push(providerId);
    }

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get revenue metrics:', error);
      throw new AppError('Failed to get revenue metrics', 500);
    }
  }

  async getDashboardSummary(filters = {}) {
    const { startDate, endDate } = filters;

    try {
      const [leadMetrics, conversionMetrics, categoryBreakdown, revenueMetrics] = await Promise.all([
        this.getLeadMetrics({ startDate, endDate, groupBy: 'day' }),
        this.getConversionMetrics({ startDate, endDate }),
        this.getServiceCategoryBreakdown({ startDate, endDate }),
        this.getRevenueMetrics({ startDate, endDate }),
      ]);

      return {
        period: { startDate, endDate },
        leadMetrics,
        conversionMetrics,
        categoryBreakdown,
        revenueMetrics,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get dashboard summary:', error);
      throw new AppError('Failed to get dashboard summary', 500);
    }
  }
}

module.exports = AnalyticsService;
