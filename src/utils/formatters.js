// src/utils/formatters.js
import { format, parseISO } from "date-fns";

/**
 * Format a date using a specified format string
 * @param {Date|string|number} date - The date to format
 * @param {string} formatStr - The format string (default: 'MM/dd/yyyy')
 * @returns {string} The formatted date string
 */
export const formatDate = (date, formatStr = "MM/dd/yyyy") => {
  if (!date) return "N/A";

  try {
    // Handle different date input types
    const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
    return format(dateObj, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

/**
 * Format a currency value
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'PHP')
 * @param {string} locale - The locale (default: 'en-PH')
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, currency = "PHP", locale = "en-PH") => {
  if (amount === null || amount === undefined) return "N/A";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `${currency} ${amount}`;
  }
};

/**
 * Format a number with commas and decimal places
 * @param {number} number - The number to format
 * @param {number} decimals - The number of decimal places (default: 2)
 * @returns {string} The formatted number string
 */
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined) return "N/A";

  try {
    return number.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.error("Error formatting number:", error);
    return number.toString();
  }
};

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 * @param {Date|string|number} date - The date to format
 * @returns {string} The relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Invalid Date";
  }
};
