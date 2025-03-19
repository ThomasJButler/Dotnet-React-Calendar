import axios from 'axios';

// Base URL for the API
const API_URL = 'https://localhost:7188/api';

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
      const response = await axios.get(`${API_URL}/events`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  /**
   * Fetch a specific event by ID
   * @param {number} id - The ID of the event to fetch
   * @returns {Promise} Promise containing the event data
   */
  getEventById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/events/${id}`);
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
      const response = await axios.post(`${API_URL}/events`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
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
      const response = await axios.put(`${API_URL}/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an event
   * @param {number} id - The ID of the event to delete
   * @returns {Promise} Promise containing the response data
   */
  deleteEvent: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting event with ID ${id}:`, error);
      throw error;
    }
  }
};

export default EventService;
