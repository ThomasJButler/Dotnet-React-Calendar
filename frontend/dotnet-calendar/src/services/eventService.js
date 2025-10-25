/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Event service providing CRUD operations and search functionality for calendar events.
 */

import apiClient from './apiClient';

const EventService = {
  /**
   * @param {Object} [options={}] - Fetch options
   * @return {Promise<Array>} Event data with pagination metadata
   */
  getAllEvents: async (options = {}) => {
    try {
      const { page = 1, pageSize = 100, date } = options;
      const params = { page, pageSize };
      
      if (date) {
        params.date = date instanceof Date ? date.toISOString() : date;
      }
      
      const response = await apiClient.get('/events', { params });

      if (response.data.data) {
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
   * @param {number} id - Event ID
   * @return {Promise<Object>} Event data
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
   * @param {Object} eventData - Event data to create
   * @return {Promise<Object>} Created event
   */
  createEvent: async (eventData) => {
    try {
      if (!eventData.title || !eventData.date || !eventData.time) {
        throw new Error('Missing required fields: title, date, and time are required');
      }

      const response = await apiClient.post('/events', eventData);

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

      apiClient.clearCache();

      return response.data;
    } catch (error) {
      console.error(`Error updating event with ID ${id}:`, error);
      throw new Error(`Failed to update event: ${error.message}`);
    }
  },

  /**
   * @param {number} id - Event ID
   * @return {Promise<Object>} Response data
   */
  deleteEvent: async (id) => {
    try {
      if (!id) {
        throw new Error('Event ID is required for deletion');
      }

      const response = await apiClient.delete(`/events/${id}`);

      apiClient.clearCache();

      return response.data;
    } catch (error) {
      console.error(`Error deleting event with ID ${id}:`, error);
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  },

  /**
   * @param {Object} eventData - Event data to check
   * @param {number} [excludeId=null] - Event ID to exclude from comparison (for updates)
   * @return {Promise<boolean>} True if overlap detected
   */
  checkEventOverlap: async (eventData, excludeId = null) => {
    try {
      if (!eventData || !eventData.date || !eventData.time) {
        return false;
      }

      const allEvents = await EventService.getAllEvents({ pageSize: 1000 });

      const eventDate = new Date(eventData.date);
      const [hours, minutes] = eventData.time.split(':').map(num => parseInt(num, 10));

      const eventStart = new Date(eventDate);
      eventStart.setHours(hours, minutes, 0, 0);

      const durationMinutes = eventData.duration || 60;
      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventStart.getMinutes() + durationMinutes);

      return allEvents.some(existingEvent => {
        if (excludeId && existingEvent.id === excludeId) return false;

        if (!existingEvent.date || !existingEvent.time) return false;

        const existingDate = new Date(existingEvent.date);
        const [existingHours, existingMinutes] = existingEvent.time.split(':').map(num => parseInt(num, 10));

        const existingStart = new Date(existingDate);
        existingStart.setHours(existingHours, existingMinutes, 0, 0);

        const existingDuration = existingEvent.duration || 60;
        const existingEnd = new Date(existingStart);
        existingEnd.setMinutes(existingStart.getMinutes() + existingDuration);

        return existingStart < eventEnd && existingEnd > eventStart;
      });
    } catch (error) {
      console.error('Error checking event overlap:', error);
      return false;
    }
  },

  /**
   * @param {Object} searchParams - Search parameters
   * @return {Promise<Object>} Filtered events with pagination
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
   * @param {Array} events - Array of event objects
   * @return {Promise<Object>} Bulk operation results
   */
  bulkCreateEvents: async (events) => {
    try {
      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('Events array is required');
      }

      const response = await apiClient.post('/events/bulk', { events });

      apiClient.clearCache();

      return response.data;
    } catch (error) {
      console.error('Error bulk creating events:', error);
      throw new Error(`Failed to bulk create events: ${error.message}`);
    }
  },

  /**
   * @return {Object} API client statistics
   */
  getApiStats: () => {
    return apiClient.getStats();
  },

  clearCache: () => {
    apiClient.clearCache();
  },

  resetCircuitBreaker: () => {
    apiClient.resetCircuitBreaker();
  }
};

export default EventService;
