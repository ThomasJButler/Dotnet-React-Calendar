import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';

// Create the context
const AppContext = createContext();

/**
 * AppProvider component for global app state management
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const AppProvider = ({ children, disableHealthChecks = false }) => {
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  
  // Global loading state
  const [globalLoading, setGlobalLoading] = useState(false);
  
  // Connection status
  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: navigator.onLine,
    lastChecked: new Date(),
    apiReachable: true
  });
  
  // Rate limit info
  const [rateLimit, setRateLimit] = useState({
    limit: null,
    remaining: null,
    reset: null,
    isLimited: false
  });
  
  // API health status
  const [apiHealth, setApiHealth] = useState({
    circuitBreakerState: 'CLOSED',
    cacheSize: 0,
    pendingRequests: 0,
    queuedRequests: 0,
    lastUpdated: new Date()
  });

  /**
   * Add a toast notification
   * @param {Object} toast - Toast configuration
   */
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }
    
    return id;
  }, []);

  /**
   * Remove a toast notification
   * @param {string|number} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {Object} options - Additional options
   */
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    });
  }, [addToast]);

  /**
   * Show error toast
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   */
  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 8000, // Errors stay longer
      ...options
    });
  }, [addToast]);

  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @param {Object} options - Additional options
   */
  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  /**
   * Show info toast
   * @param {string} message - Info message
   * @param {Object} options - Additional options
   */
  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  /**
   * Update connection status
   */
  const updateConnectionStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    let apiReachable = false;
    
    if (isOnline) {
      try {
        // Check API reachability by getting events with minimal data
        // This uses the existing endpoint with caching support
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        await apiClient.get('/events', {
          signal: controller.signal,
          params: { page: 1, pageSize: 1 } // Minimal data request
        });
        
        clearTimeout(timeoutId);
        apiReachable = true;
      } catch (error) {
        apiReachable = false;
      }
    }
    
    setConnectionStatus(prev => {
      // Show notification if connection status changed
      if (!isOnline && prev.isOnline) {
        showWarning('You are offline. Some features may be unavailable.');
      } else if (isOnline && !prev.isOnline) {
        showSuccess('Connection restored.');
      } else if (isOnline && !apiReachable && prev.apiReachable) {
        showError('Cannot reach the API server. Please check your connection.');
      }
      
      return {
        isOnline,
        apiReachable,
        lastChecked: new Date()
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies needed - toast functions are stable

  /**
   * Update rate limit info from response headers
   * @param {Object} headers - Response headers
   */
  const updateRateLimit = useCallback((headers) => {
    const limit = headers['x-ratelimit-limit'];
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    
    if (limit || remaining || reset) {
      const newRateLimit = {
        limit: limit ? parseInt(limit, 10) : rateLimit.limit,
        remaining: remaining ? parseInt(remaining, 10) : rateLimit.remaining,
        reset: reset ? new Date(parseInt(reset, 10) * 1000) : rateLimit.reset,
        isLimited: false
      };
      
      // Check if we're approaching the limit
      if (newRateLimit.remaining !== null && newRateLimit.limit !== null) {
        const percentageRemaining = (newRateLimit.remaining / newRateLimit.limit) * 100;
        
        if (percentageRemaining <= 10) {
          showWarning(`API rate limit warning: Only ${newRateLimit.remaining} requests remaining.`);
          newRateLimit.isLimited = true;
        } else if (percentageRemaining <= 25) {
          // Silent warning - just update the state
          newRateLimit.isLimited = true;
        }
      }
      
      setRateLimit(newRateLimit);
    }
  }, [rateLimit, showWarning]);

  /**
   * Update API health status
   */
  const updateApiHealth = useCallback(() => {
    const stats = apiClient.getStats();
    
    setApiHealth(prev => {
      // Show warning if circuit breaker state changed
      if (stats.circuitBreakerState === 'OPEN' && prev.circuitBreakerState !== 'OPEN') {
        showError('API circuit breaker is open. Service may be experiencing issues.');
      } else if (stats.circuitBreakerState === 'CLOSED' && prev.circuitBreakerState === 'OPEN') {
        showSuccess('API service recovered.');
      }
      
      return {
        ...stats,
        lastUpdated: new Date()
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies needed

  // Monitor connection status
  useEffect(() => {
    if (disableHealthChecks) return;
    
    // Initial check
    updateConnectionStatus();
    
    // Setup event listeners
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Periodic check every 5 minutes (300000ms) instead of 30 seconds
    const interval = setInterval(updateConnectionStatus, 300000);
    
    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
      clearInterval(interval);
    };
  }, [updateConnectionStatus, disableHealthChecks]);

  // Monitor API health
  useEffect(() => {
    if (disableHealthChecks) return;
    
    // Initial check
    updateApiHealth();
    
    // Update every 30 seconds (30000ms) instead of 5 seconds
    const interval = setInterval(updateApiHealth, 30000);
    
    return () => clearInterval(interval);
  }, [updateApiHealth, disableHealthChecks]);

  // Setup axios interceptor for rate limit headers
  useEffect(() => {
    const interceptorId = apiClient.client.interceptors.response.use(
      response => {
        updateRateLimit(response.headers);
        return response;
      },
      error => {
        if (error.response) {
          updateRateLimit(error.response.headers);
          
          // Check for rate limit error
          if (error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const message = retryAfter 
              ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
              : 'Rate limit exceeded. Please try again later.';
            showError(message, { duration: 10000 });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.client.interceptors.response.eject(interceptorId);
    };
  }, [updateRateLimit, showError]);

  // Value object to be provided to consumers
  const value = {
    // Toast notifications
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Global loading
    globalLoading,
    setGlobalLoading,
    
    // Connection status
    connectionStatus,
    updateConnectionStatus,
    
    // Rate limiting
    rateLimit,
    
    // API health
    apiHealth,
    
    // Utilities
    isOffline: !connectionStatus.isOnline,
    isApiReachable: connectionStatus.apiReachable,
    isRateLimited: rateLimit.isLimited
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to use the app context
 * @returns {Object} App context value
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;