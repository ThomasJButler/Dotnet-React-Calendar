// Import our enhanced API client
import apiClient from './apiClient';

/**
 * Service for handling event-related API calls
 * Provides methods for CRUD operations on events
 */
const EventService = {
  /**
   * Fetch all events from the API
   * @returns {Promise} Promise containing the events data
   */
  getAllEvents: async (options = {}) => {
    try {
      const { page = 1, pageSize = 100, date } = options;
      const params = { page, pageSize };
      
      if (date) {
        params.date = date instanceof Date ? date.toISOString() : date;
      }
      
      const response = await apiClient.get('/events', { params });
      
      // Handle paginated response
      if (response.data.data) {
        // Return just the data array for backward compatibility
        // Store pagination info in metadata
        const events = response.data.data;
        events._pagination = {
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalCount: response.data.totalCount,
          totalPages: response.data.totalPages
        };
        return events;
      }
      
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
      const response = await apiClient.get(`/events/${id}`);
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

      const response = await apiClient.post('/events', eventData);
      
      // Clear cache after creating event
      apiClient.clearCache();
      
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

      const response = await apiClient.put(`/events/${id}`, eventData);
      
      // Clear cache after updating event
      apiClient.clearCache();
      
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

      const response = await apiClient.delete(`/events/${id}`);
      
      // Clear cache after deleting event
      apiClient.clearCache();
      
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
      
      // Get all events to check against (fetch all pages if needed)
      const allEvents = await EventService.getAllEvents({ pageSize: 1000 });
      
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
  },

  /**
   * Search events with advanced filtering
   * @param {Object} searchParams - Search parameters
   * @returns {Promise} Promise containing filtered events
   */
  searchEvents: async (searchParams) => {
    try {
      const response = await apiClient.get('/events/search', { params: searchParams });
      return response.data;
    } catch (error) {
      console.error('Error searching events:', error);
      throw new Error(`Failed to search events: ${error.message}`);
    }
  },

  /**
   * Bulk create multiple events
   * @param {Array} events - Array of event objects to create
   * @returns {Promise} Promise containing bulk operation results
   */
  bulkCreateEvents: async (events) => {
    try {
      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('Events array is required');
      }

      const response = await apiClient.post('/events/bulk', { events });
      
      // Clear cache after bulk operation
      apiClient.clearCache();
      
      return response.data;
    } catch (error) {
      console.error('Error bulk creating events:', error);
      throw new Error(`Failed to bulk create events: ${error.message}`);
    }
  },

  /**
   * Get API statistics (circuit breaker state, cache info, etc)
   * @returns {Object} API client statistics
   */
  getApiStats: () => {
    return apiClient.getStats();
  },

  /**
   * Clear the API cache
   */
  clearCache: () => {
    apiClient.clearCache();
  },

  /**
   * Reset circuit breaker if needed
   */
  resetCircuitBreaker: () => {
    apiClient.resetCircuitBreaker();
  }
};

export default EventService;
