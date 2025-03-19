import React, { createContext, useState, useEffect, useContext } from 'react';
import EventService from '../services/eventService';

// Create the context
const EventContext = createContext();

/**
 * EventProvider component to wrap the application and provide event state
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const EventProvider = ({ children }) => {
  // State for events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  /**
   * Fetch all events from the API
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await EventService.getAllEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events. Please try again later.');
      console.error('Error in fetchEvents:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new event
   * @param {Object} eventData - The event data to add
   */
  const addEvent = async (eventData) => {
    try {
      setLoading(true);
      const newEvent = await EventService.createEvent(eventData);
      setEvents([...events, newEvent]);
      return newEvent;
    } catch (err) {
      setError('Failed to add event. Please try again.');
      console.error('Error in addEvent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing event
   * @param {number} id - The ID of the event to update
   * @param {Object} eventData - The updated event data
   */
  const updateEvent = async (id, eventData) => {
    try {
      setLoading(true);
      const updatedEvent = await EventService.updateEvent(id, eventData);
      setEvents(events.map(event => event.id === id ? updatedEvent : event));
      return updatedEvent;
    } catch (err) {
      setError('Failed to update event. Please try again.');
      console.error('Error in updateEvent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an event
   * @param {number} id - The ID of the event to delete
   */
  const deleteEvent = async (id) => {
    try {
      setLoading(true);
      await EventService.deleteEvent(id);
      setEvents(events.filter(event => event.id !== id));
    } catch (err) {
      setError('Failed to delete event. Please try again.');
      console.error('Error in deleteEvent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Value object to be provided to consumers
  const value = {
    events,
    loading,
    error,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

/**
 * Custom hook to use the event context
 * @returns {Object} Event context value
 */
export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export default EventContext;
