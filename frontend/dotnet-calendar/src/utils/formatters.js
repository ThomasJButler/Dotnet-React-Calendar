/**
 * Formatting utilities for dates, times, and other data
 */

/**
 * Format time from 24-hour to 12-hour format
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format with AM/PM
 */
export const formatTime12Hour = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(num => parseInt(num, 10));
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
};

/**
 * Format date for display in lists
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if date is today
  if (dateObj.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if date is tomorrow
  if (dateObj.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
  // Otherwise return formatted date
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = dateObj - now;
  const diffMins = Math.round(diffMs / 60000);
  
  if (Math.abs(diffMins) < 1) return 'now';
  
  const units = [
    { name: 'year', mins: 525600 },
    { name: 'month', mins: 43200 },
    { name: 'week', mins: 10080 },
    { name: 'day', mins: 1440 },
    { name: 'hour', mins: 60 },
    { name: 'minute', mins: 1 }
  ];
  
  for (const unit of units) {
    const value = Math.floor(Math.abs(diffMins) / unit.mins);
    if (value >= 1) {
      const plural = value > 1 ? 's' : '';
      return diffMs > 0 
        ? `in ${value} ${unit.name}${plural}`
        : `${value} ${unit.name}${plural} ago`;
    }
  }
  
  return 'just now';
};

/**
 * Parse time string to hours and minutes
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {Object} Object with hours and minutes
 */
export const parseTime = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  
  const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10) || 0);
  return { hours, minutes };
};

/**
 * Convert event to calendar format for export
 * @param {Object} event - Event object
 * @returns {Object} Formatted event for calendar export
 */
export const formatEventForExport = (event) => {
  const startDate = new Date(event.date);
  const { hours, minutes } = parseTime(event.time);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  const duration = event.duration || 60;
  endDate.setMinutes(endDate.getMinutes() + duration);
  
  return {
    title: event.title,
    start: startDate,
    end: endDate,
    description: event.description || '',
    id: event.id
  };
};

/**
 * Convert CSV row to event object
 * @param {Object} row - CSV row object
 * @param {Array} headers - CSV headers
 * @returns {Object} Event object
 */
export const csvRowToEvent = (row, headers) => {
  const event = {};
  
  headers.forEach((header, index) => {
    const value = row[index]?.trim();
    
    switch (header.toLowerCase()) {
      case 'title':
        event.title = value;
        break;
      case 'date':
        event.date = value;
        break;
      case 'time':
        event.time = value;
        break;
      case 'duration':
        event.duration = parseInt(value, 10) || 60;
        break;
      case 'description':
        event.description = value;
        break;
      default:
        break;
    }
  });
  
  return event;
};

/**
 * Convert events to CSV format
 * @param {Array} events - Array of events
 * @returns {string} CSV string
 */
export const eventsToCSV = (events) => {
  const headers = ['Title', 'Date', 'Time', 'Duration', 'Description'];
  const rows = events.map(event => [
    event.title,
    formatDate(event.date, { year: 'numeric', month: '2-digit', day: '2-digit' }),
    event.time,
    event.duration || 60,
    event.description || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};