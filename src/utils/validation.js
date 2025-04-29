// src/utils/validation.js
/**
 * Validate an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a password meets requirements
 * @param {string} password - The password to validate
 * @returns {Object} Object with validation results
 */
export const validatePassword = (password) => {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
};

/**
 * Check if password meets all requirements
 * @param {string} password - The password to check
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPassword = (password) => {
  const results = validatePassword(password);
  return Object.values(results).every((result) => result === true);
};

/**
 * Validate a Philippine mobile number
 * @param {string} mobileNumber - The mobile number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPhMobileNumber = (mobileNumber) => {
  // Philippine mobile numbers start with +63 or 0, followed by 10 digits
  const mobileRegex = /^(?:\+?63|0)[0-9]{10}$/;
  return mobileRegex.test(mobileNumber);
};

/**
 * Sanitize HTML input to prevent XSS attacks
 * @param {string} input - The HTML string to sanitize
 * @returns {string} The sanitized string
 */
export const sanitizeHTML = (input) => {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
