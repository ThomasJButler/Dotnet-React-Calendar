import axios from 'axios';
import errorTracking from './errorTracking';

// Circuit breaker implementation
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN. Service unavailable.');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.reset();
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.warn(`Circuit breaker opened. Will retry at ${new Date(this.nextAttempt)}`);
    }
  }

  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
    this.nextAttempt = null;
  }
}

// Request queue for managing concurrent requests
class RequestQueue {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    if (this.running >= this.maxConcurrent) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const resolve = this.queue.shift();
        resolve();
      }
    }
  }
}

// Retry logic with exponential backoff
class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.factor = options.factor || 2;
    this.onServerCold = options.onServerCold || null;
  }

  async execute(fn, context = {}) {
    let lastError;
    let serverWarmingAttempts = 0;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // If we were warming, notify that we're connected
        if (serverWarmingAttempts > 0 && this.onServerCold) {
          this.onServerCold(false, 0);
        }
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if server needs warming
        const isServerCold = this.isServerCold(error);
        if (isServerCold && this.onServerCold) {
          serverWarmingAttempts++;
          this.onServerCold(true, serverWarmingAttempts);
        }
        
        // Don't retry on client errors (4xx) unless it's server warming
        if (!isServerCold && error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }
        
        if (attempt < this.maxRetries || (isServerCold && serverWarmingAttempts < 10)) {
          const delay = isServerCold ? 3000 : this.calculateDelay(attempt); // Shorter delay for cold starts
          console.log(`${isServerCold ? 'Server warming' : 'Retry'} attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }
    
    // If we failed after all attempts, notify warming is done
    if (serverWarmingAttempts > 0 && this.onServerCold) {
      this.onServerCold(false, 0);
    }
    
    throw lastError;
  }

  isServerCold(error) {
    if (!error.response && error.code === 'ECONNABORTED') {
      return true; // Timeout likely due to cold start
    }
    if (error.response?.status === 503) {
      return true; // Service unavailable
    }
    if (!error.response && error.message.includes('Network Error')) {
      return true; // Could be cold start
    }
    return false;
  }

  calculateDelay(attempt) {
    const exponentialDelay = this.baseDelay * Math.pow(this.factor, attempt);
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter
    return Math.min(jitteredDelay, this.maxDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cache manager for API responses
class CacheManager {
  constructor(defaultTTL = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  generateKey(config) {
    const { method, url, params } = config;
    return `${method}:${url}:${JSON.stringify(params || {})}`;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Create enhanced API client
class EnhancedApiClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:5191/api';
    this.timeout = config.timeout || 10000;
    
    // Initialize components
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.requestQueue = new RequestQueue(config.maxConcurrent);
    this.retryManager = new RetryManager(config.retry);
    this.cacheManager = new CacheManager(config.cacheTTL);
    
    // Request deduplication
    this.pendingRequests = new Map();
    
    // Server warming state
    this.serverWarmingState = {
      isWarming: false,
      attempt: 0,
      maxAttempts: 10,
      listeners: new Set()
    };
    
    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.setupInterceptors();
    
    // Periodic cache cleanup
    setInterval(() => this.cacheManager.cleanup(), 60000); // Every minute
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        // Add correlation ID
        config.headers['X-Correlation-Id'] = this.generateCorrelationId();
        
        // Add timestamp for performance tracking
        config.metadata = { startTime: Date.now() };
        
        console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
          correlationId: config.headers['X-Correlation-Id']
        });
        
        return config;
      },
      error => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        const duration = Date.now() - response.config.metadata.startTime;
        
        console.log(`[API] Response ${response.status} in ${duration}ms`, {
          url: response.config.url,
          correlationId: response.headers['x-correlation-id']
        });
        
        // Handle ETag caching
        if (response.headers.etag) {
          response.config.headers['If-None-Match'] = response.headers.etag;
        }
        
        return response;
      },
      error => {
        if (error.config && error.config.metadata) {
          const duration = Date.now() - error.config.metadata.startTime;
          console.error(`[API] Error ${error.response?.status} in ${duration}ms`, {
            url: error.config.url,
            message: error.message,
            correlationId: error.response?.headers['x-correlation-id']
          });
          
          // Track API errors
          errorTracking.trackApiError(error, error.config.url, {
            method: error.config.method,
            data: error.config.data,
            duration,
            correlationId: error.response?.headers['x-correlation-id']
          });
        }
        
        return Promise.reject(this.enhanceError(error));
      }
    );
  }

  generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  enhanceError(error) {
    if (error.response?.data?.detail) {
      error.message = error.response.data.detail;
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    
    error.isNetworkError = !error.response;
    error.isServerError = error.response?.status >= 500;
    error.isClientError = error.response?.status >= 400 && error.response?.status < 500;
    
    return error;
  }

  async request(config) {
    // Check cache for GET requests
    if (config.method === 'get' || config.method === 'GET') {
      const cacheKey = this.cacheManager.generateKey(config);
      const cachedData = this.cacheManager.get(cacheKey);
      
      if (cachedData) {
        console.log('[API] Cache hit:', cacheKey);
        return { data: cachedData, cached: true };
      }
    }

    // Request deduplication
    const requestKey = this.cacheManager.generateKey(config);
    if (this.pendingRequests.has(requestKey)) {
      console.log('[API] Deduplicating request:', requestKey);
      return this.pendingRequests.get(requestKey);
    }

    // Create request promise
    const requestPromise = this.requestQueue.add(async () => {
      return this.circuitBreaker.execute(async () => {
        return this.retryManager.execute(async () => {
          const response = await this.client.request(config);
          
          // Cache successful GET responses
          if (config.method === 'get' || config.method === 'GET') {
            const cacheKey = this.cacheManager.generateKey(config);
            this.cacheManager.set(cacheKey, response.data);
          }
          
          return response;
        });
      });
    });

    // Store pending request
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(requestKey);
    }
  }

  // Convenience methods
  async get(url, config = {}) {
    return this.request({ ...config, method: 'get', url });
  }

  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'post', url, data });
  }

  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'put', url, data });
  }

  async delete(url, config = {}) {
    return this.request({ ...config, method: 'delete', url });
  }

  async patch(url, data, config = {}) {
    return this.request({ ...config, method: 'patch', url, data });
  }

  // Bulk operations helper
  async bulk(operations) {
    const results = await Promise.allSettled(
      operations.map(op => this.request(op))
    );
    
    return results.map((result, index) => ({
      ...operations[index],
      success: result.status === 'fulfilled',
      response: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Clear cache
  clearCache() {
    this.cacheManager.clear();
  }

  // Reset circuit breaker
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }

  // Get client statistics
  getStats() {
    return {
      circuitBreakerState: this.circuitBreaker.state,
      cacheSize: this.cacheManager.cache.size,
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.queue.length,
      serverWarming: this.serverWarmingState.isWarming
    };
  }

  // Server warming management
  setServerWarming(isWarming, attempt = 0) {
    this.serverWarmingState.isWarming = isWarming;
    this.serverWarmingState.attempt = attempt;
    this.notifyWarmingListeners();
  }

  onServerWarmingChange(listener) {
    this.serverWarmingState.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.serverWarmingState.listeners.delete(listener);
    };
  }

  notifyWarmingListeners() {
    this.serverWarmingState.listeners.forEach(listener => {
      listener({
        isWarming: this.serverWarmingState.isWarming,
        attempt: this.serverWarmingState.attempt,
        maxAttempts: this.serverWarmingState.maxAttempts
      });
    });
  }

  // Check if server is cold (needs warming)
  isServerCold(error) {
    if (!error.response && error.code === 'ECONNABORTED') {
      return true; // Timeout likely due to cold start
    }
    if (error.response?.status === 503) {
      return true; // Service unavailable
    }
    if (!error.response && error.message.includes('Network Error')) {
      return true; // Could be cold start
    }
    return false;
  }
}

// Create singleton instance
const apiClient = new EnhancedApiClient({
  maxConcurrent: 5,
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    onServerCold: null // Will be set below
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000
  },
  cacheTTL: 300000 // 5 minutes
});

// Set up server cold callback after instance is created
apiClient.retryManager.onServerCold = (isWarming, attempt) => {
  apiClient.setServerWarming(isWarming, attempt);
};

export default apiClient;