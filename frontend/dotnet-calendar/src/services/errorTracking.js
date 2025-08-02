/**
 * Error Tracking Service
 * Provides integration with error tracking services like Sentry
 * Falls back to console logging in development
 */

class ErrorTrackingService {
  constructor() {
    this.initialized = false;
    this.errorQueue = [];
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.userId = null;
    this.metadata = {};
  }

  /**
   * Initialize error tracking service
   * @param {Object} config - Configuration options
   */
  initialize(config = {}) {
    const { dsn, environment, release, userId } = config;
    
    if (this.isDevelopment && !config.enableInDev) {
      console.log('[ErrorTracking] Running in development mode - errors will be logged to console');
      this.initialized = true;
      return;
    }

    // Check if Sentry is available
    if (window.Sentry && dsn) {
      try {
        window.Sentry.init({
          dsn,
          environment: environment || process.env.NODE_ENV,
          release: release || process.env.REACT_APP_VERSION,
          integrations: [
            new window.Sentry.BrowserTracing(),
            new window.Sentry.Replay({
              maskAllText: false,
              blockAllMedia: false,
            }),
          ],
          tracesSampleRate: this.isDevelopment ? 1.0 : 0.1,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          beforeSend: (event, hint) => {
            // Filter out certain errors
            if (this.shouldFilterError(event, hint)) {
              return null;
            }
            return event;
          },
        });
        
        this.initialized = true;
        this.setUserId(userId);
        
        // Process queued errors
        this.processErrorQueue();
        
        console.log('[ErrorTracking] Sentry initialized successfully');
      } catch (error) {
        console.error('[ErrorTracking] Failed to initialize Sentry:', error);
      }
    } else {
      console.warn('[ErrorTracking] Sentry not available or no DSN provided');
      this.initialized = true;
    }
  }

  /**
   * Check if error should be filtered
   */
  shouldFilterError(event, hint) {
    const error = hint.originalException;
    
    // Filter network errors that are expected
    if (error?.message?.includes('NetworkError') || 
        error?.message?.includes('Failed to fetch')) {
      return true;
    }
    
    // Filter ResizeObserver errors (common and usually harmless)
    if (error?.message?.includes('ResizeObserver loop limit exceeded')) {
      return true;
    }
    
    // Filter errors from browser extensions
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      frame => frame.filename?.includes('extension://')
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Process queued errors
   */
  processErrorQueue() {
    while (this.errorQueue.length > 0) {
      const { method, args } = this.errorQueue.shift();
      this[method](...args);
    }
  }

  /**
   * Queue error if not initialized
   */
  queueError(method, args) {
    if (this.errorQueue.length < 100) { // Limit queue size
      this.errorQueue.push({ method, args });
    }
  }

  /**
   * Capture exception
   * @param {Error} error - The error to capture
   * @param {Object} context - Additional context
   */
  captureException(error, context = {}) {
    if (!this.initialized) {
      this.queueError('captureException', [error, context]);
      return;
    }

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      ...context,
      ...this.metadata,
      timestamp: new Date().toISOString(),
    };

    if (this.isDevelopment || !window.Sentry) {
      console.error('[ErrorTracking] Exception:', error, errorInfo);
      return;
    }

    window.Sentry.captureException(error, {
      contexts: {
        custom: errorInfo
      },
      tags: {
        component: context.component || 'unknown',
        action: context.action || 'unknown',
      },
    });
  }

  /**
   * Capture message
   * @param {string} message - The message to capture
   * @param {string} level - Severity level
   * @param {Object} context - Additional context
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.initialized) {
      this.queueError('captureMessage', [message, level, context]);
      return;
    }

    const messageInfo = {
      message,
      level,
      ...context,
      ...this.metadata,
      timestamp: new Date().toISOString(),
    };

    if (this.isDevelopment || !window.Sentry) {
      console.log(`[ErrorTracking] ${level.toUpperCase()}:`, message, messageInfo);
      return;
    }

    window.Sentry.captureMessage(message, {
      level,
      contexts: {
        custom: messageInfo
      },
    });
  }

  /**
   * Set user context
   * @param {string} userId - User identifier
   * @param {Object} userData - Additional user data
   */
  setUserId(userId, userData = {}) {
    this.userId = userId;
    
    if (window.Sentry) {
      window.Sentry.setUser({
        id: userId,
        ...userData
      });
    }
  }

  /**
   * Set global metadata
   * @param {Object} metadata - Metadata to include with all errors
   */
  setMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    
    if (window.Sentry) {
      window.Sentry.setContext('metadata', this.metadata);
    }
  }

  /**
   * Add breadcrumb for debugging
   * @param {Object} breadcrumb - Breadcrumb data
   */
  addBreadcrumb(breadcrumb) {
    const crumb = {
      timestamp: new Date().toISOString(),
      ...breadcrumb
    };

    if (this.isDevelopment || !window.Sentry) {
      console.log('[ErrorTracking] Breadcrumb:', crumb);
      return;
    }

    window.Sentry.addBreadcrumb(crumb);
  }

  /**
   * Track API errors
   * @param {Object} error - API error object
   * @param {string} endpoint - API endpoint
   * @param {Object} request - Request details
   */
  trackApiError(error, endpoint, request = {}) {
    const context = {
      component: 'api',
      action: 'request',
      endpoint,
      method: request.method || 'GET',
      status: error.response?.status,
      statusText: error.response?.statusText,
      requestData: request.data,
      responseData: error.response?.data,
    };

    this.captureException(error, context);
  }

  /**
   * Track React component errors
   * @param {Error} error - The error
   * @param {Object} errorInfo - React error info
   * @param {string} componentName - Component name
   */
  trackComponentError(error, errorInfo, componentName) {
    const context = {
      component: componentName,
      action: 'render',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    };

    this.captureException(error, context);
  }

  /**
   * Track performance issues
   * @param {string} metric - Performance metric name
   * @param {number} value - Metric value
   * @param {Object} context - Additional context
   */
  trackPerformance(metric, value, context = {}) {
    if (value > this.getPerformanceThreshold(metric)) {
      this.captureMessage(
        `Performance degradation: ${metric}`,
        'warning',
        {
          metric,
          value,
          threshold: this.getPerformanceThreshold(metric),
          ...context
        }
      );
    }
  }

  /**
   * Get performance threshold for metric
   */
  getPerformanceThreshold(metric) {
    const thresholds = {
      'api.response': 3000, // 3 seconds
      'component.render': 500, // 500ms
      'route.transition': 1000, // 1 second
    };
    
    return thresholds[metric] || 1000;
  }

  /**
   * Create error boundary handler
   */
  createErrorBoundaryHandler(componentName) {
    return (error, errorInfo) => {
      this.trackComponentError(error, errorInfo, componentName);
    };
  }

  /**
   * Wrap async function with error tracking
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.captureException(error, {
          function: fn.name || 'anonymous',
          arguments: args,
          ...context
        });
        throw error;
      }
    };
  }

  /**
   * Test error tracking
   */
  testError() {
    this.captureMessage('Test error tracking message', 'info', {
      test: true,
      timestamp: new Date().toISOString()
    });
  }
}

// Create singleton instance
const errorTracking = new ErrorTrackingService();

// Auto-initialize in production with env variables
if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
  errorTracking.initialize({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT,
    release: process.env.REACT_APP_VERSION,
  });
}

export default errorTracking;