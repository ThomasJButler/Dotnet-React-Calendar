/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Error tracking service with Sentry integration for production monitoring.
 *              Falls back to console logging in development.
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
   * @param {Object} [config={}] - Configuration options
   */
  initialize(config = {}) {
    const { dsn, environment, release, userId } = config;

    if (this.isDevelopment && !config.enableInDev) {
      console.log('[ErrorTracking] Running in development mode - errors will be logged to console');
      this.initialized = true;
      return;
    }

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
            if (this.shouldFilterError(event, hint)) {
              return null;
            }
            return event;
          },
        });

        this.initialized = true;
        this.setUserId(userId);

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
   * @param {Object} event - Sentry event
   * @param {Object} hint - Event hint
   * @return {boolean} True if error should be filtered
   */
  shouldFilterError(event, hint) {
    const error = hint.originalException;

    if (error?.message?.includes('NetworkError') ||
        error?.message?.includes('Failed to fetch')) {
      return true;
    }

    if (error?.message?.includes('ResizeObserver loop limit exceeded')) {
      return true;
    }

    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      frame => frame.filename?.includes('extension://')
    )) {
      return true;
    }

    return false;
  }

  processErrorQueue() {
    while (this.errorQueue.length > 0) {
      const { method, args } = this.errorQueue.shift();
      this[method](...args);
    }
  }

  /**
   * @param {string} method - Method name
   * @param {Array} args - Arguments
   */
  queueError(method, args) {
    if (this.errorQueue.length < 100) {
      this.errorQueue.push({ method, args });
    }
  }

  /**
   * @param {Error} error - Error to capture
   * @param {Object} [context={}] - Additional context
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
   * @param {string} message - Message to capture
   * @param {string} [level='info'] - Severity level
   * @param {Object} [context={}] - Additional context
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
   * @param {string} userId - User identifier
   * @param {Object} [userData={}] - Additional user data
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
   * @param {Object} metadata - Metadata to include with all errors
   */
  setMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };

    if (window.Sentry) {
      window.Sentry.setContext('metadata', this.metadata);
    }
  }

  /**
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
   * @param {Object} error - API error
   * @param {string} endpoint - API endpoint
   * @param {Object} [request={}] - Request details
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
   * @param {Error} error - Component error
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
   * @param {string} metric - Performance metric name
   * @param {number} value - Metric value
   * @param {Object} [context={}] - Additional context
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
   * @param {string} metric - Metric name
   * @return {number} Threshold in milliseconds
   */
  getPerformanceThreshold(metric) {
    const thresholds = {
      'api.response': 3000, // 3 seconds
      'component.render': 500,
      'route.transition': 1000,
    };

    return thresholds[metric] || 1000;
  }

  /**
   * @param {string} componentName - Component name
   * @return {Function} Error handler function
   */
  createErrorBoundaryHandler(componentName) {
    return (error, errorInfo) => {
      this.trackComponentError(error, errorInfo, componentName);
    };
  }

  /**
   * @param {Function} fn - Async function to wrap
   * @param {Object} [context={}] - Additional context
   * @return {Function} Wrapped function
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

  testError() {
    this.captureMessage('Test error tracking message', 'info', {
      test: true,
      timestamp: new Date().toISOString()
    });
  }
}

const errorTracking = new ErrorTrackingService();

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
  errorTracking.initialize({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT,
    release: process.env.REACT_APP_VERSION,
  });
}

export default errorTracking;