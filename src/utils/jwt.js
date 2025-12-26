/**
 * JWT token generation and verification utility
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load .env file for local development
if (process.env.NODE_ENV === 'development' || !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  dotenv.config();
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days

/**
 * Generate JWT token for user session
 * @param {Object} payload - Token payload (user id, mobile number, etc.)
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
export function decodeToken(token) {
  return jwt.decode(token);
}

