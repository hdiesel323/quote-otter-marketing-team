/**
 * Phone Validation Routes
 * PhoneRevealr integration endpoints
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate } = require('../middleware/validation');
const { apiKeyAuth } = require('../middleware/auth');
const { phoneValidationSchema } = require('../models/schemas');

module.exports = (phoneRevealrClient) => {
  const router = express.Router();

  /**
   * POST /api/phone/validate
   * Validate a phone number using PhoneRevealr
   */
  router.post(
    '/validate',
    apiKeyAuth,
    validate(phoneValidationSchema),
    asyncHandler(async (req, res) => {
      const { phone } = req.body;
      const validation = await phoneRevealrClient.validatePhone(phone);
      
      res.json({
        status: 'success',
        data: {
          phone,
          validation,
        },
      });
    })
  );

  /**
   * POST /api/phone/validate/batch
   * Validate multiple phone numbers
   */
  router.post(
    '/validate/batch',
    apiKeyAuth,
    asyncHandler(async (req, res) => {
      const { phones } = req.body;
      
      if (!Array.isArray(phones) || phones.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'phones array is required and must not be empty',
        });
      }
      
      if (phones.length > 100) {
        return res.status(400).json({
          status: 'fail',
          message: 'Maximum 100 phone numbers per batch',
        });
      }
      
      const results = await phoneRevealrClient.validateBatch(phones);
      
      res.json({
        status: 'success',
        data: {
          count: phones.length,
          results: Array.from(results.entries()).map(([phone, validation]) => ({
            phone,
            ...validation,
          })),
        },
      });
    })
  );

  /**
   * GET /api/phone/cache/stats
   * Get cache statistics
   */
  router.get(
    '/cache/stats',
    apiKeyAuth,
    asyncHandler(async (req, res) => {
      const stats = phoneRevealrClient.getCacheStats();
      res.json({
        status: 'success',
        data: { stats },
      });
    })
  );

  /**
   * DELETE /api/phone/cache
   * Clear validation cache
   */
  router.delete(
    '/cache',
    apiKeyAuth,
    asyncHandler(async (req, res) => {
      phoneRevealrClient.clearCache();
      res.json({
        status: 'success',
        message: 'Cache cleared',
      });
    })
  );

  return router;
};
