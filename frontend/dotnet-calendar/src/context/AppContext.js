/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Global app context for toast notifications, connection status, and API health monitoring.
 */

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AppContext = createContext();

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {boolean} [props.disableHealthChecks=false] - Disable health monitoring for tests
 * @return {JSX.Element}
 * @constructor
 */
export const AppProvider = ({ children, disableHealthChecks = false }) => {
  const [toasts, setToasts] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: navigator.onLine,
    lastChecked: new Date(),
    apiReachable: true
  });

  const [rateLimit, setRateLimit] = useState({
    limit: null,
    remaining: null,
    reset: null,
    isLimited: false
  });

  const [apiHealth, setApiHealth] = useState({
    circuitBreakerState: 'CLOSED',
    cacheSize: 0,
    pendingRequests: 0,
    queuedRequests: 0,
    lastUpdated: new Date()
  });

  /**
   * @param {Object} toast - Toast configuration
   * @return {number} Toast ID
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

    if (newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }

    return id;
  }, []);

  /**
   * @param {string|number} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * @param {string} message - Success message
   * @param {Object} [options={}] - Additional options
   * @return {number} Toast ID
   */
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    });
  }, [addToast]);

  /**
   * @param {string} message - Error message
   * @param {Object} [options={}] - Additional options
   * @return {number} Toast ID
   */
  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      duration: 8000,
      ...options
    });
  }, [addToast]);

  /**
   * @param {string} message - Warning message
   * @param {Object} [options={}] - Additional options
   * @return {number} Toast ID
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
   * @param {string} message - Info message
   * @param {Object} [options={}] - Additional options
   * @return {number} Toast ID
   */
  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  /**
   * @return {Promise<void>}
   */
  const updateConnectionStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    let apiReachable = false;

    if (isOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await apiClient.get('/events', {
          signal: controller.signal,
          params: { page: 1, pageSize: 1 }
        });

        clearTimeout(timeoutId);
        apiReachable = true;
      } catch (error) {
        apiReachable = false;
      }
    }

    setConnectionStatus(prev => {
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
  }, []);

  /**
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

      if (newRateLimit.remaining !== null && newRateLimit.limit !== null) {
        const percentageRemaining = (newRateLimit.remaining / newRateLimit.limit) * 100;

        if (percentageRemaining <= 10) {
          showWarning(`API rate limit warning: Only ${newRateLimit.remaining} requests remaining.`);
          newRateLimit.isLimited = true;
        } else if (percentageRemaining <= 25) {
          newRateLimit.isLimited = true;
        }
      }

      setRateLimit(newRateLimit);
    }
  }, [rateLimit, showWarning]);

  /**
   * @return {void}
   */
  const updateApiHealth = useCallback(() => {
    const stats = apiClient.getStats();

    setApiHealth(prev => {
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
  }, []);

  /**
   * @constructs - Initialises connection status monitoring with event listeners and periodic checks
   */
  useEffect(() => {
    if (disableHealthChecks) return;

    updateConnectionStatus();

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    const interval = setInterval(updateConnectionStatus, 300000);

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
      clearInterval(interval);
    };
  }, [updateConnectionStatus, disableHealthChecks]);

  /**
   * @listens disableHealthChecks - Updates API health stats every 30 seconds
   */
  useEffect(() => {
    if (disableHealthChecks) return;

    updateApiHealth();

    const interval = setInterval(updateApiHealth, 30000);

    return () => clearInterval(interval);
  }, [updateApiHealth, disableHealthChecks]);

  /**
   * @listens updateRateLimit, showError - Sets up response interceptor for rate limit monitoring
   */
  useEffect(() => {
    const interceptorId = apiClient.client.interceptors.response.use(
      response => {
        updateRateLimit(response.headers);
        return response;
      },
      error => {
        if (error.response) {
          updateRateLimit(error.response.headers);

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

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    globalLoading,
    setGlobalLoading,

    connectionStatus,
    updateConnectionStatus,

    rateLimit,

    apiHealth,

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
 * @return {Object} App context value
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;