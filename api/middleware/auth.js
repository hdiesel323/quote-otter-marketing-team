const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-api-key']) {
    token = req.headers['x-api-key'];
  }

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw new AppError('Invalid or expired token', 401);
  }

  req.user = decoded;
  next();
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
};

const apiKeyAuth = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    throw new AppError('API key required', 401);
  }

  const validApiKeys = process.env.VALID_API_KEYS ? 
    process.env.VALID_API_KEYS.split(',') : [];

  if (!validApiKeys.includes(apiKey)) {
    throw new AppError('Invalid API key', 401);
  }

  req.apiKey = apiKey;
  next();
});

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorizeRoles,
  apiKeyAuth,
};
