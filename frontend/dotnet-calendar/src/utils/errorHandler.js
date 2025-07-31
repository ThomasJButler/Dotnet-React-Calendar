/**
 * Error handling utilities
 */

/**
 * Extract user-friendly error message from error object
 * @param {Error|Object} error - The error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Check for custom error message
  if (error.message) {
    return error.message;
  }
  
  // Check for API response error
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Check for network errors
  if (error.isNetworkError) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Check for server errors
  if (error.isServerError) {
    return 'Server error. Please try again later.';
  }
  
  // Check for client errors
  if (error.isClientError) {
    if (error.response?.status === 400) {
      return 'Invalid request. Please check your input.';
    }
    if (error.response?.status === 401) {
      return 'Unauthorized. Please log in.';
    }
    if (error.response?.status === 403) {
      return 'Access denied.';
    }
    if (error.response?.status === 404) {
      return 'Resource not found.';
    }
    if (error.response?.status === 409) {
      return 'Conflict. The resource already exists or is in use.';
    }
    if (error.response?.status === 429) {
      return 'Too many requests. Please slow down.';
    }
  }
  
  // Default error message
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Log error for debugging/monitoring
 * @param {Error|Object} error - The error object
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }
  
  // Here you could send to a logging service
  // sendToLoggingService(errorInfo);
};

/**
 * Create standardized error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Error} Standardized error object
 */
export const createError = (message, code = 'UNKNOWN_ERROR', details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  error.timestamp = new Date().toISOString();
  return error;
};

/**
 * Check if error is retryable
 * @param {Error|Object} error - The error object
 * @returns {boolean} Whether the error is retryable
 */
export const isRetryableError = (error) => {
  // Network errors are usually retryable
  if (error.isNetworkError) {
    return true;
  }
  
  // Server errors (5xx) are often temporary
  if (error.isServerError) {
    return true;
  }
  
  // Specific status codes that might be retryable
  const retryableStatusCodes = [408, 429, 502, 503, 504];
  if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
    return true;
  }
  
  return false;
};