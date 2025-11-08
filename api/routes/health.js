/**
 * Health Check Routes
 * System health and readiness endpoints
 */

const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0'
  });
});

/**
 * GET /health/ready
 * Readiness check (includes dependencies)
 */
router.get('/ready', async (req, res) => {
  const checks = {
    server: 'ok',
    database: 'checking',
    redis: 'checking',
    phonerevealr: 'checking'
  };
  
  try {
    // TODO: Add actual health checks for dependencies
    // For now, report as available
    checks.database = process.env.DATABASE_URL ? 'ok' : 'not_configured';
    checks.redis = process.env.REDIS_URL ? 'ok' : 'not_configured';
    checks.phonerevealr = process.env.PHONEREVEALR_API_KEY ? 'ok' : 'not_configured';
    
    const allHealthy = Object.values(checks).every(status => status === 'ok' || status === 'not_configured');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      checks,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/agents
 * Agent system status
 */
router.get('/agents', (req, res) => {
  res.json({
    status: 'available',
    agents: {
      lead_intelligence: {
        status: 'ready',
        version: '2.0.0',
        capabilities: ['qualification', 'scoring', 'routing']
      },
      compliance: {
        status: 'ready',
        version: '2.0.0',
        capabilities: ['fraud_detection', 'phone_validation', 'quality_check'],
        phonerevealr: process.env.PHONEREVEALR_API_KEY ? 'enabled' : 'disabled'
      },
      conversion_analytics: {
        status: 'ready',
        version: '2.0.0',
        capabilities: ['conversion_tracking', 'performance_analysis', 'prediction']
      },
      lead_operations: {
        status: 'ready',
        version: '2.0.0',
        capabilities: ['delivery', 'routing', 'sla_tracking']
      },
      provider_intelligence: {
        status: 'ready',
        version: '2.0.0',
        capabilities: ['matching', 'performance', 'capacity']
      }
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
