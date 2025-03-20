// Import axios as ES module for compatibility with newer versions
import axios from 'axios';

// Base URL for the API
const API_URL = 'http://localhost:5191/api';

// Create an axios instance with default settings
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000, // 10 seconds timeout
  validateStatus: status => status >= 200 && status < 300 // Only resolve for success status codes
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  config => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`, config.data);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for consistent error handling
axiosInstance.interceptors.response.use(
  response => {
    console.log('Response received:', response.data);
    return response;
  },
  error => {
    let errorMessage = 'An error occurred while processing your request';
    
    if (error.response) {
      // Server responded with error status
      console.error('Server error:', error.response.data);
      errorMessage = error.response.data.message || error.response.data || errorMessage;
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error:', error.request);
      errorMessage = 'Unable to connect to the server. Please check your network connection.';
    } else {
      // Error in request configuration
      console.error('Request error:', error.message);
      errorMessage = error.message;
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Service for handling event-related API calls
 * Provides methods for CRUD operations on events
 */
const EventService = {
  /**
   * Fetch all events from the API
   * @returns {Promise} Promise containing the events data
   */
  getAllEvents: async () => {
    try {
      const response = await axiosInstance.get('/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
  },

  /**
   * Fetch a specific event by ID
   * @param {number} id - The ID of the event to fetch
   * @returns {Promise} Promise containing the event data
   */
  getEventById: async (id) => {
    try {
      const response = await axiosInstance.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new event
   * @param {Object} eventData - The event data to create
   * @returns {Promise} Promise containing the created event data
   */
  createEvent: async (eventData) => {
    try {
      // Validate required fields
      if (!eventData.title || !eventData.date || !eventData.time) {
        throw new Error('Missing required fields: title, date, and time are required');
      }

      const response = await axiosInstance.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },

  /**
   * Update an existing event
   * @param {number} id - The ID of the event to update
   * @param {Object} eventData - The updated event data
   * @returns {Promise} Promise containing the updated event data
   */
  updateEvent: async (id, eventData) => {
    try {
      // Validate required fields
      if (!id) {
        throw new Error('Event ID is required for updating');
      }
      if (!eventData.title || !eventData.date || !eventData.time) {
        throw new Error('Missing required fields: title, date, and time are required');
      }

      const response = await axiosInstance.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event with ID ${id}:`, error);
      throw new Error(`Failed to update event: ${error.message}`);
    }
  },

  /**
   * Delete an event
   * @param {number} id - The ID of the event to delete
   * @returns {Promise} Promise containing the response data
   */
  deleteEvent: async (id) => {
    try {
      if (!id) {
        throw new Error('Event ID is required for deletion');
      }

      const response = await axiosInstance.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting event with ID ${id}:`, error);
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  },

  /**
   * Check if an event overlaps with existing events
   * @param {Object} eventData - The event data to check
   * @param {number} [excludeId] - Optional ID to exclude from comparison (for updates)
   * @returns {Promise<boolean>} Promise resolving to true if event overlaps
   */
  checkEventOverlap: async (eventData, excludeId = null) => {
    try {
      // For tests, return false when no valid data is provided
      if (!eventData || !eventData.date || !eventData.time) {
        return false;
      }
      
      // Get all events to check against
      const allEvents = await EventService.getAllEvents();
      
      // Parse the event date and time
      const eventDate = new Date(eventData.date);
      const [hours, minutes] = eventData.time.split(':').map(num => parseInt(num, 10));
      
      // Create Date objects for start and end time using the event's duration
      const eventStart = new Date(eventDate);
      eventStart.setHours(hours, minutes, 0, 0);
      
      // Use the event duration (in minutes) or default to 60 minutes
      const durationMinutes = eventData.duration || 60;
      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventStart.getMinutes() + durationMinutes);
      
      // Check if any existing event overlaps with this one
      return allEvents.some(existingEvent => {
        // Skip comparing to the event being updated
        if (excludeId && existingEvent.id === excludeId) return false;
        
        // Skip if existing event doesn't have proper date/time data
        if (!existingEvent.date || !existingEvent.time) return false;
        
        // Parse existing event date and time
        const existingDate = new Date(existingEvent.date);
        const [existingHours, existingMinutes] = existingEvent.time.split(':').map(num => parseInt(num, 10));
        
        const existingStart = new Date(existingDate);
        existingStart.setHours(existingHours, existingMinutes, 0, 0);
        
        // Use the existing event's duration (in minutes) or default to 60 minutes
        const existingDuration = existingEvent.duration || 60;
        const existingEnd = new Date(existingStart);
        existingEnd.setMinutes(existingStart.getMinutes() + existingDuration);
        
        // Check for overlap: existingStart < eventEnd AND existingEnd > eventStart
        return existingStart < eventEnd && existingEnd > eventStart;
      });
    } catch (error) {
      console.error('Error checking event overlap:', error);
      // In case of error, return false to allow event creation as fallback
      return false;
    }
  }
};

export default EventService;
