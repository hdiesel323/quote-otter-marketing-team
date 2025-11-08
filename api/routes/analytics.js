const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateQuery } = require('../middleware/validation');
const { apiKeyAuth } = require('../middleware/auth');
const { analyticsQuerySchema } = require('../models/schemas');

module.exports = (analyticsService) => {
  router.get(
    '/leads',
    apiKeyAuth,
    validateQuery(analyticsQuerySchema),
    asyncHandler(async (req, res) => {
      const metrics = await analyticsService.getLeadMetrics(req.query);
      res.json({
        status: 'success',
        data: { metrics },
      });
    })
  );

  router.get(
    '/conversions',
    apiKeyAuth,
    validateQuery(analyticsQuerySchema),
    asyncHandler(async (req, res) => {
      const metrics = await analyticsService.getConversionMetrics(req.query);
      res.json({
        status: 'success',
        data: { metrics },
      });
    })
  );

  router.get(
    '/categories',
    apiKeyAuth,
    validateQuery(analyticsQuerySchema),
    asyncHandler(async (req, res) => {
      const breakdown = await analyticsService.getServiceCategoryBreakdown(req.query);
      res.json({
        status: 'success',
        data: { breakdown },
      });
    })
  );

  router.get(
    '/providers',
    apiKeyAuth,
    validateQuery(analyticsQuerySchema),
    asyncHandler(async (req, res) => {
      const performance = await analyticsService.getProviderPerformance(req.query);
      res.json({
        status: 'success',
        data: { performance },
      });
    })
  );

  router.get(
    '/revenue',
    apiKeyAuth,
    validateQuery(analyticsQuerySchema),
    asyncHandler(async (req, res) => {
      const metrics = await analyticsService.getRevenueMetrics(req.query);
      res.json({
        status: 'success',
        data: { metrics },
      });
    })
  );

  router.get(
    '/dashboard',
    apiKeyAuth,
    validateQuery(analyticsQuerySchema),
    asyncHandler(async (req, res) => {
      const summary = await analyticsService.getDashboardSummary(req.query);
      res.json({
        status: 'success',
        data: summary,
      });
    })
  );

  return router;
};
