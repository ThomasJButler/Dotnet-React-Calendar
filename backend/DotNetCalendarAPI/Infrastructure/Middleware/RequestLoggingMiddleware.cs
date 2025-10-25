/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Middleware for logging HTTP requests and responses with performance metrics
/// </summary>
using System.Diagnostics;

namespace DotNetCalendarAPI.Infrastructure.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = Stopwatch.StartNew();
            var correlationId = context.TraceIdentifier;
            
            context.Items["CorrelationId"] = correlationId;
            context.Response.Headers.Append("X-Correlation-Id", correlationId);

            _logger.LogInformation(
                "Request started: {Method} {Path} {QueryString} - CorrelationId: {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString,
                correlationId);

            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();
                
                _logger.LogInformation(
                    "Request completed: {Method} {Path} {StatusCode} - Duration: {Duration}ms - CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds,
                    correlationId);

                if (stopwatch.ElapsedMilliseconds > 1000)
                {
                    _logger.LogWarning(
                        "Slow request detected: {Method} {Path} took {Duration}ms - CorrelationId: {CorrelationId}",
                        context.Request.Method,
                        context.Request.Path,
                        stopwatch.ElapsedMilliseconds,
                        correlationId);
                }
            }
        }
    }
}