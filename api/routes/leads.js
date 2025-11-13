/**
 * Lead Routes
 * Endpoints for lead submission, validation, and routing
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { apiKeyAuth } = require('../middleware/auth');
const { leadSchema, leadQuerySchema, idParamSchema, leadStatusUpdateSchema } = require('../models/schemas');

module.exports = (leadService) => {
  const router = express.Router();

  /**
   * POST /api/leads
   * Submit and validate a new lead
   */
  router.post(
    '/',
    apiKeyAuth,
    validate(leadSchema),
    asyncHandler(async (req, res) => {
      const lead = await leadService.createLead(req.body);
      res.status(201).json({
        status: 'success',
        data: { lead },
      });
    })
  );

  /**
   * GET /api/leads
   * List leads with filters
   */
  router.get(
    '/',
    apiKeyAuth,
    validateQuery(leadQuerySchema),
    asyncHandler(async (req, res) => {
      const result = await leadService.getLeads(req.query);
      res.json({
        status: 'success',
        data: result,
      });
    })
  );

  /**
   * GET /api/leads/:id
   * Get lead details and status
   */
  router.get(
    '/:id',
    apiKeyAuth,
    validateParams(idParamSchema),
    asyncHandler(async (req, res) => {
      const lead = await leadService.getLeadById(req.params.id);
      res.json({
        status: 'success',
        data: { lead },
      });
    })
  );

  /**
   * PATCH /api/leads/:id/status
   * Update lead status
   */
  router.patch(
    '/:id/status',
    apiKeyAuth,
    validateParams(idParamSchema),
    validate(leadStatusUpdateSchema),
    asyncHandler(async (req, res) => {
      const { status, flagReason } = req.body;
      const lead = await leadService.updateLeadStatus(req.params.id, status, flagReason);
      res.json({
        status: 'success',
        data: { lead },
      });
    })
  );

  return router;
};
