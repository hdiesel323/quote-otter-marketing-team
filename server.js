/**
 * QuoteOtter AI Agent System - Main Server
 * 
 * REST API server for lead validation, fraud detection, and provider matching
 * Integrates with QuoteOtter Next.js platform
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import utilities and database
const logger = require('./api/utils/logger');
const database = require('./api/utils/database');

// Import middleware
const { errorHandler, notFoundHandler } = require('./api/middleware/errorHandler');

// Import services
const LeadService = require('./api/services/leadService');
const ProviderService = require('./api/services/providerService');
const AnalyticsService = require('./api/services/analyticsService');

// Import routes (as factory functions)
const healthRoutes = require('./api/routes/health');

// PhoneRevealr integration (optional)
let phoneRevealrClient = null;
if (process.env.ENABLE_PHONEREVEALR === 'true' && process.env.PHONEREVEALR_API_KEY) {
  try {
    const PhoneRevealr = require('./integrations/phonerevealr');
    phoneRevealrClient = new PhoneRevealr(process.env.PHONEREVEALR_API_KEY);
    logger.info('PhoneRevealr client initialized');
  } catch (error) {
    logger.warn('PhoneRevealr client not available:', error.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.API_RATE_LIMIT || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Initialize database and services
let db = null;
let leadService = null;
let providerService = null;
let analyticsService = null;

async function initializeServices() {
  try {
    db = database.getPool();
    if (db) {
      const isConnected = await database.testConnection();
      if (isConnected) {
        logger.info('Database connected successfully');
        
        // Initialize services with database
        leadService = new LeadService(db, phoneRevealrClient);
        providerService = new ProviderService(db);
        analyticsService = new AnalyticsService(db);
        
        logger.info('Services initialized');
      } else {
        logger.warn('Database connection failed, services running in limited mode');
        leadService = new LeadService(null, phoneRevealrClient);
        providerService = new ProviderService(null);
        analyticsService = new AnalyticsService(null);
      }
    } else {
      logger.warn('Database not configured, services running in limited mode');
      leadService = new LeadService(null, phoneRevealrClient);
      providerService = new ProviderService(null);
      analyticsService = new AnalyticsService(null);
    }
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    leadService = new LeadService(null, phoneRevealrClient);
    providerService = new ProviderService(null);
    analyticsService = new AnalyticsService(null);
  }
}

// Health check (no auth required)
app.use('/health', healthRoutes);

// API routes (initialized after services are ready)
app.use('/api/leads', (req, res, next) => {
  if (!leadService) {
    return res.status(503).json({ error: 'Service not initialized' });
  }
  const leadRoutes = require('./api/routes/leads');
  leadRoutes(leadService)(req, res, next);
});

app.use('/api/phone', (req, res, next) => {
  if (!phoneRevealrClient) {
    return res.status(503).json({ error: 'PhoneRevealr service not available' });
  }
  const phoneRoutes = require('./api/routes/phone');
  phoneRoutes(phoneRevealrClient)(req, res, next);
});

app.use('/api/providers', (req, res, next) => {
  if (!providerService) {
    return res.status(503).json({ error: 'Service not initialized' });
  }
  const providerRoutes = require('./api/routes/providers');
  providerRoutes(providerService)(req, res, next);
});

app.use('/api/analytics', (req, res, next) => {
  if (!analyticsService) {
    return res.status(503).json({ error: 'Service not initialized' });
  }
  const analyticsRoutes = require('./api/routes/analytics');
  analyticsRoutes(analyticsService)(req, res, next);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'QuoteOtter AI Agent System',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      leads: '/api/leads',
      phone: '/api/phone',
      providers: '/api/providers',
      analytics: '/api/analytics'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  await initializeServices();
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 QuoteOtter Agent System running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`PhoneRevealr: ${process.env.ENABLE_PHONEREVEALR === 'true' ? 'Enabled' : 'Disabled'}`);
    logger.info(`Database: ${db ? 'Connected' : 'Disabled'}`);
  });

  return server;
}

let server;
startServer().then(s => server = s).catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await database.closePool();
      process.exit(0);
    });
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await database.closePool();
      process.exit(0);
    });
  }
});

module.exports = app;
