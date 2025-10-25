/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description React context provider for global event state management.
 *              Handles CRUD operations with optimistic updates and rollback support.
 */

import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import EventService from '../services/eventService';

const EventContext = createContext();

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @return {JSX.Element}
 * @constructor
 */
export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);

  const [loadingStates, setLoadingStates] = useState({
    fetch: false,
    create: false,
    update: false,
    delete: false,
    search: false,
    bulk: false
  });

  const [errors, setErrors] = useState({
    fetch: null,
    create: null,
    update: null,
    delete: null,
    search: null,
    bulk: null
  });

  const [searchParams, setSearchParams] = useState({});
  const [searchResults, setSearchResults] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 100,
    totalCount: 0,
    totalPages: 0
  });

  const rollbackRef = useRef({});
  const [apiStats, setApiStats] = useState(null);

  const updateLoadingState = useCallback((operation, isLoading) => {
    setLoadingStates(prev => ({ ...prev, [operation]: isLoading }));
  }, []);

  const updateErrorState = useCallback((operation, error) => {
    setErrors(prev => ({ ...prev, [operation]: error }));
  }, []);

  /**
   * @param {Object} [options={}] - Fetch options
   * @return {Promise<Array>} Event data
   */
  const fetchEvents = async (options = {}) => {
    try {
      updateLoadingState('fetch', true);
      updateErrorState('fetch', null);
      
      const data = await EventService.getAllEvents(options);
      setEvents(data);

      if (data._pagination) {
        setPagination(data._pagination);
      }
      
      return data;
    } catch (err) {
      const errorMessage = 'Failed to fetch events. Please try again later.';
      updateErrorState('fetch', errorMessage);
      console.error('Error in fetchEvents:', err);
      throw err;
    } finally {
      updateLoadingState('fetch', false);
    }
  };

  /**
   * @param {Object} eventData - Event data to create
   * @return {Promise<Object>} Created event
   */
  const addEvent = async (eventData) => {
    try {
      updateLoadingState('create', true);
      updateErrorState('create', null);

      const tempId = `temp-${Date.now()}`;
      const tempEvent = { ...eventData, id: tempId, isTemp: true };
      setEvents(prev => [...prev, tempEvent]);

      rollbackRef.current[tempId] = () => {
        setEvents(prev => prev.filter(e => e.id !== tempId));
      };

      const newEvent = await EventService.createEvent(eventData);
      setEvents(prev => prev.map(e => e.id === tempId ? newEvent : e));
      delete rollbackRef.current[tempId];


      return newEvent;
    } catch (err) {
      const tempId = Object.keys(rollbackRef.current).find(key => key.startsWith('temp-'));
      if (tempId && rollbackRef.current[tempId]) {
        rollbackRef.current[tempId]();
        delete rollbackRef.current[tempId];
      }

      const errorMessage = err.message || 'Failed to add event. Please try again.';
      updateErrorState('create', errorMessage);
      console.error('Error in addEvent:', err);
      throw err;
    } finally {
      updateLoadingState('create', false);
    }
  };

  /**
   * Update an existing event with optimistic update
   * @param {number} id - The ID of the event to update
   * @param {Object} eventData - The updated event data
   */
  const updateEvent = async (id, eventData) => {
    try {
      updateLoadingState('update', true);
      updateErrorState('update', null);
      
      // Store original event for rollback
      const originalEvent = events.find(e => e.id === id);
      rollbackRef.current[`update-${id}`] = originalEvent;
      
      // Optimistic update
      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...eventData } : e));
      
      // Update actual event
      const updatedEvent = await EventService.updateEvent(id, eventData);
      
      // Replace with server response
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      delete rollbackRef.current[`update-${id}`];
      
      return updatedEvent;
    } catch (err) {
      // Rollback optimistic update
      const rollbackKey = `update-${id}`;
      if (rollbackRef.current[rollbackKey]) {
        const original = rollbackRef.current[rollbackKey];
        setEvents(prev => prev.map(e => e.id === id ? original : e));
        delete rollbackRef.current[rollbackKey];
      }
      
      const errorMessage = err.message || 'Failed to update event. Please try again.';
      updateErrorState('update', errorMessage);
      console.error('Error in updateEvent:', err);
      throw err;
    } finally {
      updateLoadingState('update', false);
    }
  };

  /**
   * Delete an event with optimistic update
   * @param {number} id - The ID of the event to delete
   */
  const deleteEvent = async (id) => {
    try {
      updateLoadingState('delete', true);
      updateErrorState('delete', null);
      
      // Store event for rollback
      const eventToDelete = events.find(e => e.id === id);
      rollbackRef.current[`delete-${id}`] = eventToDelete;
      
      // Optimistic update
      setEvents(prev => prev.filter(e => e.id !== id));
      
      // Delete actual event
      await EventService.deleteEvent(id);
      
      // Clear rollback
      delete rollbackRef.current[`delete-${id}`];
    } catch (err) {
      // Rollback optimistic update
      const rollbackKey = `delete-${id}`;
      if (rollbackRef.current[rollbackKey]) {
        const deletedEvent = rollbackRef.current[rollbackKey];
        setEvents(prev => [...prev, deletedEvent].sort((a, b) => a.id - b.id));
        delete rollbackRef.current[rollbackKey];
      }
      
      const errorMessage = err.message || 'Failed to delete event. Please try again.';
      updateErrorState('delete', errorMessage);
      console.error('Error in deleteEvent:', err);
      throw err;
    } finally {
      updateLoadingState('delete', false);
    }
  };

  /**
   * Search events with advanced filtering
   * @param {Object} params - Search parameters
   */
  const searchEvents = async (params) => {
    try {
      updateLoadingState('search', true);
      updateErrorState('search', null);
      
      setSearchParams(params);
      const results = await EventService.searchEvents(params);
      setSearchResults(results);
      
      // Update pagination from search results
      if (results.page !== undefined) {
        setPagination({
          page: results.page,
          pageSize: results.pageSize,
          totalCount: results.totalCount,
          totalPages: results.totalPages
        });
      }
      
      return results;
    } catch (err) {
      const errorMessage = err.message || 'Failed to search events. Please try again.';
      updateErrorState('search', errorMessage);
      console.error('Error in searchEvents:', err);
      throw err;
    } finally {
      updateLoadingState('search', false);
    }
  };

  /**
   * Bulk create events
   * @param {Array} eventsData - Array of event objects to create
   */
  const bulkCreateEvents = async (eventsData) => {
    try {
      updateLoadingState('bulk', true);
      updateErrorState('bulk', null);
      
      const results = await EventService.bulkCreateEvents(eventsData);
      
      // Refresh events list after bulk operation
      await fetchEvents();
      
      return results;
    } catch (err) {
      const errorMessage = err.message || 'Failed to bulk create events. Please try again.';
      updateErrorState('bulk', errorMessage);
      console.error('Error in bulkCreateEvents:', err);
      throw err;
    } finally {
      updateLoadingState('bulk', false);
    }
  };

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    setSearchParams({});
    setSearchResults(null);
  }, []);

  /**
   * Get current loading state
   */
  const isLoading = useCallback((operation) => {
    if (operation) {
      return loadingStates[operation] || false;
    }
    return Object.values(loadingStates).some(state => state);
  }, [loadingStates]);

  /**
   * Get current error state
   */
  const getError = useCallback((operation) => {
    if (operation) {
      return errors[operation];
    }
    return Object.values(errors).find(error => error !== null);
  }, [errors]);

  /**
   * Clear specific error
   */
  const clearError = useCallback((operation) => {
    if (operation) {
      updateErrorState(operation, null);
    } else {
      setErrors({
        fetch: null,
        create: null,
        update: null,
        delete: null,
        search: null,
        bulk: null
      });
    }
  }, [updateErrorState]);

  /**
   * Update API statistics
   */
  const updateApiStats = useCallback(async () => {
    const stats = EventService.getApiStats();
    setApiStats(stats);
  }, []);

  // Fetch all events on component mount with error handling
  useEffect(() => {
    const initFetch = async () => {
      try {
        await fetchEvents();
      } catch (error) {
        console.error('Failed to fetch initial events:', error);
        // Don't throw - let the app render with empty events
      }
    };
    
    // Add a small delay to ensure API is ready
    const timer = setTimeout(initFetch, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchEvents doesn't need to be a dependency as it only uses stable callbacks

  // Update API stats periodically
  useEffect(() => {
    const interval = setInterval(updateApiStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateApiStats]);

  // Value object to be provided to consumers
  const value = {
    // State
    events,
    loadingStates,
    errors,
    searchParams,
    searchResults,
    pagination,
    apiStats,
    
    // Actions
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    searchEvents,
    bulkCreateEvents,
    clearSearch,
    
    // Utilities
    isLoading,
    getError,
    clearError,
    
    // Backward compatibility
    loading: isLoading('fetch'),
    error: getError('fetch')
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