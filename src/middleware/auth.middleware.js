import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication middleware to verify JWT token
 * Use this middleware on protected routes
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header is required'
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: 'Token is required'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user info to request object
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: error.message || 'Invalid or expired token'
    });
  }
};

