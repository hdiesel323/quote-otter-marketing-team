const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, validateParams } = require('../middleware/validation');
const { apiKeyAuth } = require('../middleware/auth');
const {
  providerSchema,
  providerUpdateSchema,
  idParamSchema,
} = require('../models/schemas');

module.exports = (providerService) => {
  router.post(
    '/',
    apiKeyAuth,
    validate(providerSchema),
    asyncHandler(async (req, res) => {
      const provider = await providerService.createProvider(req.body);
      res.status(201).json({
        status: 'success',
        data: { provider },
      });
    })
  );

  router.get(
    '/',
    apiKeyAuth,
    asyncHandler(async (req, res) => {
      const { page, limit, status, serviceCategory, zipCode } = req.query;
      const result = await providerService.getProviders({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        serviceCategory,
        zipCode,
      });
      res.json({
        status: 'success',
        data: result,
      });
    })
  );

  router.get(
    '/:id',
    apiKeyAuth,
    validateParams(idParamSchema),
    asyncHandler(async (req, res) => {
      const provider = await providerService.getProviderById(req.params.id);
      res.json({
        status: 'success',
        data: { provider },
      });
    })
  );

  router.get(
    '/:id/stats',
    apiKeyAuth,
    validateParams(idParamSchema),
    asyncHandler(async (req, res) => {
      const stats = await providerService.getProviderStats(req.params.id);
      res.json({
        status: 'success',
        data: { stats },
      });
    })
  );

  router.patch(
    '/:id',
    apiKeyAuth,
    validateParams(idParamSchema),
    validate(providerUpdateSchema),
    asyncHandler(async (req, res) => {
      const provider = await providerService.updateProvider(req.params.id, req.body);
      res.json({
        status: 'success',
        data: { provider },
      });
    })
  );

  router.delete(
    '/:id',
    apiKeyAuth,
    validateParams(idParamSchema),
    asyncHandler(async (req, res) => {
      await providerService.deleteProvider(req.params.id);
      res.status(204).send();
    })
  );

  return router;
};
