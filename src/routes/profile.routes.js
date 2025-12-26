import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { saveProfile, getProfile } from '../controllers/profile.controller.js';

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private (Authenticated users only)
 */
router.get('/', getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Save or update user profile
 * @access  Private (Authenticated users only)
 */
router.put('/', saveProfile);

export default router;

