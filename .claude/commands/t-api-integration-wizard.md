# API Integration Wizard: Seamless Connection Framework

## Parameters
- `$ARGUMENTS`: Integration configuration
  - Format: `[api-type] [auth-method] [features]`
  - API types: rest, graphql, websocket, grpc, all
  - Auth methods: oauth2, jwt, apikey, basic, custom
  - Default: rest oauth2 full-features
  - Examples: `"graphql jwt caching"`, `"websocket apikey real-time"`

## Description
Comprehensive API integration system for connecting services, managing authentication, implementing caching strategies, and ensuring reliable communication with monitoring and error handling.

## Execution Steps

1. **API Discovery & Analysis**
   - **Endpoint Mapping**
     - Scan API documentation
     - Identify available endpoints
     - Analyze request/response schemas
     - Document rate limits
     - Test authentication methods
   - **Capability Assessment**
     - Feature availability
     - Performance benchmarks
     - Reliability metrics
     - Cost analysis
     - Compliance requirements

2. **Authentication Implementation**
   - **OAuth 2.0 Flow**
     - Authorization setup
     - Token management
     - Refresh handling
     - Scope configuration
     - PKCE implementation
   - **JWT Management**
     - Token validation
     - Claims parsing
     - Expiry handling
     - Key rotation
     - Signature verification
   - **API Key Handling**
     - Secure storage
     - Key rotation
     - Environment config
     - Access control
     - Usage tracking

3. **Connection Framework**
   - **Client Implementation**
     - HTTP client setup
     - Retry mechanisms
     - Timeout configuration
     - Connection pooling
     - Request queuing
   - **Error Handling**
     - Retry strategies
     - Circuit breakers
     - Fallback options
     - Error logging
     - Alert systems
   - **Performance Optimization**
     - Response caching
     - Request batching
     - Compression
     - CDN integration
     - Load balancing

4. **Data Transformation**
   - **Request Building**
     - Parameter validation
     - Schema mapping
     - Data serialization
     - Header management
     - Query construction
   - **Response Processing**
     - Data parsing
     - Type conversion
     - Error extraction
     - Pagination handling
     - Stream processing

5. **Monitoring & Analytics**
   - **Performance Tracking**
     - Response times
     - Success rates
     - Error patterns
     - Usage statistics
     - Cost tracking
   - **Health Monitoring**
     - Endpoint availability
     - Latency tracking
     - Error rates
     - SLA compliance
     - Alerting rules

6. **Testing & Documentation**
   - **Integration Tests**
     - End-to-end testing
     - Mock services
     - Load testing
     - Security testing
     - Compliance checks
   - **Documentation**
     - API wrappers
     - Usage examples
     - Error handling
     - Best practices
     - Troubleshooting

## Expected Output
- API client libraries
- Authentication modules
- Caching layer
- Monitoring dashboard
- Test suite
- Documentation
- Example implementations

## Configuration Options
- `cache_ttl`: Cache time-to-live in seconds (default: 3600)
- `retry_attempts`: Max retry attempts (default: 3)
- `timeout_seconds`: Request timeout (default: 30)
- `rate_limit_buffer`: Rate limit safety margin (default: 0.8)
- `monitoring_enabled`: Enable monitoring (default: true)

## Integration Patterns

### **RESTful API**
```javascript
const apiClient = new APIClient({
  baseURL: 'https://api.example.com',
  auth: new OAuth2Provider(config),
  cache: new RedisCache(),
  retry: exponentialBackoff
});
```

### **GraphQL**
```javascript
const graphqlClient = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  auth: new JWTAuth(token),
  cache: new InMemoryCache(),
  subscriptions: true
});
```

### **WebSocket**
```javascript
const wsClient = new WebSocketClient({
  url: 'wss://api.example.com/stream',
  auth: new APIKeyAuth(key),
  reconnect: true,
  heartbeat: 30000
});
```

## Common Integrations
1. **Payment Gateways**: Stripe, PayPal, Square
2. **Cloud Services**: AWS, Azure, GCP
3. **Communication**: Twilio, SendGrid, Slack
4. **Analytics**: Google Analytics, Mixpanel
5. **CRM Systems**: Salesforce, HubSpot

## Best Practices
- Always implement rate limiting
- Use exponential backoff for retries
- Cache responses when possible
- Monitor API usage and costs
- Implement proper error handling
- Keep authentication secure
- Document all integrations
- Test edge cases thoroughly