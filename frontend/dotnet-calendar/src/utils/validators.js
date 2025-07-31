/**
 * Validation utilities for event data
 */

/**
 * Validate event data
 * @param {Object} eventData - Event data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateEvent = (eventData) => {
  const errors = {};
  
  // Title validation
  if (!eventData.title || eventData.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (eventData.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
  }
  
  // Date validation
  if (!eventData.date) {
    errors.date = 'Date is required';
  } else {
    const eventDate = new Date(eventData.date);
    if (isNaN(eventDate.getTime())) {
      errors.date = 'Invalid date';
    }
  }
  
  // Time validation
  if (!eventData.time) {
    errors.time = 'Time is required';
  } else if (!isValidTime(eventData.time)) {
    errors.time = 'Invalid time format (HH:MM expected)';
  }
  
  // Duration validation
  if (eventData.duration !== undefined) {
    if (typeof eventData.duration !== 'number' || eventData.duration < 0) {
      errors.duration = 'Duration must be a positive number';
    } else if (eventData.duration > 1440) { // 24 hours in minutes
      errors.duration = 'Duration cannot exceed 24 hours';
    }
  }
  
  // Description validation (optional)
  if (eventData.description && eventData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} Whether the time is valid
 */
export const isValidTime = (time) => {
  if (!time || typeof time !== 'string') return false;
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Validation result
 */
export const validateDateRange = (startDate, endDate) => {
  const errors = {};
  
  if (!startDate) {
    errors.startDate = 'Start date is required';
  }
  
  if (!endDate) {
    errors.endDate = 'End date is required';
  }
  
  if (startDate && endDate && startDate > endDate) {
    errors.dateRange = 'Start date must be before end date';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate bulk event data
 * @param {Array} events - Array of events to validate
 * @returns {Object} Validation result with valid and invalid events
 */
export const validateBulkEvents = (events) => {
  if (!Array.isArray(events)) {
    return {
      isValid: false,
      error: 'Events must be an array',
      validEvents: [],
      invalidEvents: []
    };
  }
  
  const validEvents = [];
  const invalidEvents = [];
  
  events.forEach((event, index) => {
    const validation = validateEvent(event);
    if (validation.isValid) {
      validEvents.push(event);
    } else {
      invalidEvents.push({
        index,
        event,
        errors: validation.errors
      });
    }
  });
  
  return {
    isValid: invalidEvents.length === 0,
    validEvents,
    invalidEvents,
    summary: {
      total: events.length,
      valid: validEvents.length,
      invalid: invalidEvents.length
    }
  };
};

/**
 * Validate CSV data for import
 * @param {string} csvData - CSV string data
 * @returns {Object} Validation result
 */
export const validateCSVData = (csvData) => {
  if (!csvData || typeof csvData !== 'string') {
    return {
      isValid: false,
      error: 'CSV data is required'
    };
  }
  
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    return {
      isValid: false,
      error: 'CSV must contain header and at least one data row'
    };
  }
  
  // Check for required headers
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const requiredHeaders = ['title', 'date', 'time'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      error: `Missing required headers: ${missingHeaders.join(', ')}`
    };
  }
  
  return {
    isValid: true,
    headers,
    rowCount: lines.length - 1
  };
};