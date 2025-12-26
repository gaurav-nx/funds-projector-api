import { query } from '../config/database.js';
import { generateOTP, isValidOTPFormat, isOTPExpired, getOTPExpiryTime } from '../utils/otp.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Send OTP to mobile number
 * POST /api/auth/send-otp
 * 
 * Request body:
 * {
 *   "mobileNumber": "+919876543210"
 * }
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { mobileNumber } = req.body;

    // Validate mobile number
    if (!mobileNumber) {
      return res.status(400).json({
        error: 'Mobile number is required'
      });
    }

    // Basic mobile number validation (format: +919876543210 or 9876543210)
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return res.status(400).json({
        error: 'Invalid mobile number format'
      });
    }

    // Normalize mobile number (ensure it starts with +)
    const normalizedMobile = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

    // Check if user exists
    const userResult = await query(
      'SELECT id, mobile_number, created_at FROM users WHERE mobile_number = $1',
      [normalizedMobile]
    );

    let userId;
    const isNewUser = userResult.rows.length === 0;

    if (isNewUser) {
      // Create new user
      const newUserResult = await query(
        'INSERT INTO users (mobile_number) VALUES ($1) RETURNING id, mobile_number, created_at',
        [normalizedMobile]
      );
      userId = newUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Generate OTP
    // In development, use a fixed test OTP for easy testing
    // In production, generate a random OTP
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.AWS_LAMBDA_FUNCTION_NAME;
    const otp = isDevelopment ? '123456' : generateOTP();
    const expiryTime = getOTPExpiryTime();

    // Store or update OTP in database
    await query(
      `INSERT INTO otps (user_id, otp, expiry_time, mobile_number)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET otp = $2, expiry_time = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, otp, expiryTime, normalizedMobile]
    );

    if (isDevelopment) {
      // In development, log the test OTP
      console.log(`[DEV MODE] Test OTP for ${normalizedMobile}: ${otp}`);
      console.log(`[DEV MODE] Use OTP: ${otp} for testing`);
    } else {
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // For production, send OTP via SMS
      console.log(`OTP for ${normalizedMobile}: ${otp}`);
      // TODO: Send SMS here
    }

    res.status(200).json({
      success: true,
      message: isDevelopment 
        ? 'OTP sent successfully (DEV MODE - Use test OTP: 123456)' 
        : 'OTP sent successfully',
      mobileNumber: normalizedMobile,
      isNewUser,
      // In development, include the test OTP in response
      ...(isDevelopment && { 
        otp,
        devMode: true,
        note: 'Using test OTP in development mode'
      })
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    next(error);
  }
};

/**
 * Verify OTP and create session
 * POST /api/auth/verify-otp
 * 
 * Request body:
 * {
 *   "mobileNumber": "+919876543210",
 *   "otp": "123456"
 * }
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { mobileNumber, otp } = req.body;

    // Validate input
    if (!mobileNumber || !otp) {
      return res.status(400).json({
        error: 'Mobile number and OTP are required'
      });
    }

    // Validate OTP format
    if (!isValidOTPFormat(otp)) {
      return res.status(400).json({
        error: 'Invalid OTP format. OTP must be 6 digits'
      });
    }

    // Normalize mobile number
    const normalizedMobile = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

    // Find user
    const userResult = await query(
      'SELECT id, mobile_number, created_at FROM users WHERE mobile_number = $1',
      [normalizedMobile]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found. Please request OTP first'
      });
    }

    const userId = userResult.rows[0].id;

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    // In development, allow test OTP "123456" to work without database check
    if (isDevelopment && otp === '123456') {
      console.log(`[DEV MODE] Accepting test OTP: ${otp} for ${normalizedMobile}`);
      // Skip database verification for test OTP in dev mode
    } else {
      // Get OTP from database
      const otpResult = await query(
        'SELECT otp, expiry_time, created_at FROM otps WHERE user_id = $1 AND mobile_number = $2',
        [userId, normalizedMobile]
      );

      if (otpResult.rows.length === 0) {
        return res.status(400).json({
          error: 'OTP not found. Please request a new OTP'
        });
      }

      const storedOtp = otpResult.rows[0].otp;
      const expiryTime = otpResult.rows[0].expiry_time;

      // Check if OTP is expired
      if (isOTPExpired(expiryTime)) {
        return res.status(400).json({
          error: 'OTP has expired. Please request a new OTP'
        });
      }

      // Verify OTP
      if (storedOtp !== otp) {
        return res.status(400).json({
          error: 'Invalid OTP'
        });
      }
    }

    // OTP verified - create session (JWT token)
    const token = generateToken({
      userId,
      mobileNumber: normalizedMobile
    });

    // Delete used OTP
    await query('DELETE FROM otps WHERE user_id = $1', [userId]);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: userId,
        mobileNumber: normalizedMobile,
        createdAt: userResult.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    next(error);
  }
};

