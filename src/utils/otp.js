/**
 * OTP generation and validation utility
 */

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate OTP format (6 digits)
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
export function isValidOTPFormat(otp) {
  return /^\d{6}$/.test(otp);
}

/**
 * Check if OTP is expired
 * @param {Date} expiryTime - OTP expiry timestamp
 * @returns {boolean} True if expired
 */
export function isOTPExpired(expiryTime) {
  return new Date() > new Date(expiryTime);
}

/**
 * Get OTP expiry time (15 minutes from now)
 * @returns {Date} Expiry timestamp
 */
export function getOTPExpiryTime() {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 15); // 15 minutes expiry
  return expiryTime;
}

