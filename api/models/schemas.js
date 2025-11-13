const Joi = require('joi');

const leadSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
  serviceCategory: Joi.string().valid(
    'roofing', 'hvac', 'plumbing', 'electrical', 'solar',
    'windows', 'siding', 'flooring', 'painting', 'remodeling',
    'auto-insurance', 'home-insurance', 'health-insurance', 'life-insurance',
    'moving-local', 'moving-long-distance', 'moving-international',
    'personal-injury', 'bankruptcy', 'estate-planning', 'family-law',
    'mortgage', 'refinance', 'personal-loan', 'business-loan',
    'medicare', 'pest-control', 'landscaping', 'tree-service'
  ).required(),
  serviceDetails: Joi.string().max(500).optional(),
  projectTimeline: Joi.string().valid('immediate', 'within-week', 'within-month', 'flexible').optional(),
  budget: Joi.string().optional(),
  notes: Joi.string().max(1000).optional(),
  source: Joi.string().max(100).optional(),
  utmSource: Joi.string().max(100).optional(),
  utmMedium: Joi.string().max(100).optional(),
  utmCampaign: Joi.string().max(100).optional(),
});

const phoneValidationSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
});

const providerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  businessName: Joi.string().min(2).max(150).required(),
  serviceCategories: Joi.array().items(Joi.string()).min(1).required(),
  serviceZipCodes: Joi.array().items(Joi.string().pattern(/^\d{5}$/)).min(1).required(),
  maxLeadsPerDay: Joi.number().integer().min(1).max(100).default(10),
  leadPrice: Joi.number().min(0).required(),
  qualityThreshold: Joi.number().min(0).max(100).default(50),
  status: Joi.string().valid('active', 'paused', 'suspended').default('active'),
});

const providerUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  serviceCategories: Joi.array().items(Joi.string()).min(1).optional(),
  serviceZipCodes: Joi.array().items(Joi.string().pattern(/^\d{5}$/)).min(1).optional(),
  maxLeadsPerDay: Joi.number().integer().min(1).max(100).optional(),
  leadPrice: Joi.number().min(0).optional(),
  qualityThreshold: Joi.number().min(0).max(100).optional(),
  status: Joi.string().valid('active', 'paused', 'suspended').optional(),
});

const analyticsQuerySchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  serviceCategory: Joi.string().optional(),
  providerId: Joi.string().uuid().optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'service', 'provider').default('day'),
});

const leadQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged', 'distributed').optional(),
  serviceCategory: Joi.string().optional(),
  minScore: Joi.number().min(0).max(100).optional(),
  maxScore: Joi.number().min(0).max(100).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  sortBy: Joi.string().valid('createdAt', 'score', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

const idParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const leadStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'flagged', 'distributed').required(),
  flagReason: Joi.string().max(500).optional(),
});

const providerQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('active', 'paused', 'suspended').optional(),
  serviceCategory: Joi.string().optional(),
  zipCode: Joi.string().pattern(/^\d{5}$/).optional(),
});

module.exports = {
  leadSchema,
  phoneValidationSchema,
  providerSchema,
  providerUpdateSchema,
  analyticsQuerySchema,
  leadQuerySchema,
  idParamSchema,
  leadStatusUpdateSchema,
  providerQuerySchema,
};
