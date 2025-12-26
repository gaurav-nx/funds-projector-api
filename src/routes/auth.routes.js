import express from 'express';
import { sendOtp, verifyOtp } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to mobile number
 * @access  Public
 */
router.post('/send-otp', sendOtp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and create session
 * @access  Public
 */
router.post('/verify-otp', verifyOtp);

export default router;

