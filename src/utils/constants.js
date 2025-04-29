// src/utils/constants.js
export const ACTION_TYPES = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  ARCHIVE: "ARCHIVE",
  UNARCHIVE: "UNARCHIVE",
  FAILED_LOGIN: "FAILED_LOGIN",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  EXPORT: "EXPORT",
};

export const USER_TYPES = {
  REGULAR: 1,
  ADMIN: 3,
};

export const DATE_FORMATS = {
  DEFAULT: "MM/dd/yyyy",
  DISPLAY: "MMMM d, yyyy",
  DATETIME: "MM/dd/yyyy hh:mm a",
  ISO: "yyyy-MM-dd",
};

export const TIMEZONES = [
  { value: "Asia/Manila", label: "Philippine Time (PHT/GMT+8)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT/GMT+8)" },
  { value: "Asia/Tokyo", label: "Japan Time (JST/GMT+9)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AEST/GMT+10)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT/UTC+0)" },
  { value: "America/New_York", label: "Eastern Time (ET/GMT-5)" },
  { value: "America/Chicago", label: "Central Time (CT/GMT-6)" },
  { value: "America/Denver", label: "Mountain Time (MT/GMT-7)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT/GMT-8)" },
];

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
];

export const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System Default" },
];

export const PAGINATION_OPTIONS = [
  { value: 10, label: "10 per page" },
  { value: 20, label: "20 per page" },
  { value: 50, label: "50 per page" },
  { value: 100, label: "100 per page" },
];

export const EXPORT_FORMATS = [
  { value: "xlsx", label: "Excel (.xlsx)" },
  { value: "csv", label: "CSV (.csv)" },
  { value: "pdf", label: "PDF (.pdf)" },
];

export const TIME_RANGES = [
  { value: "1month", label: "Last Month" },
  { value: "3months", label: "Last 3 Months" },
  { value: "6months", label: "Last 6 Months" },
  { value: "1year", label: "Last Year" },
  { value: "all", label: "All Time" },
];
