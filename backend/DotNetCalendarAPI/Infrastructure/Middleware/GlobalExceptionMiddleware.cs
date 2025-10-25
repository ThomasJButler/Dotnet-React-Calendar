/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Middleware for centralised exception handling with RFC 7807 problem details responses
/// </summary>
using System.Net;
using System.Text.Json;
using DotNetCalendarAPI.Infrastructure.Exceptions;
using DotNetCalendarAPI.Models.Responses;

namespace DotNetCalendarAPI.Infrastructure.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var correlationId = context.TraceIdentifier;
            
            _logger.LogError(exception, "An error occurred. CorrelationId: {CorrelationId}", correlationId);

            context.Response.ContentType = "application/problem+json";
            
            var response = exception switch
            {
                ApiException apiException => new ProblemDetailsResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                    Title = GetTitle(apiException.StatusCode),
                    Status = apiException.StatusCode,
                    Detail = apiException.Message,
                    Instance = context.Request.Path,
                    Extensions = new Dictionary<string, object?>
                    {
                        ["errorCode"] = apiException.ErrorCode,
                        ["correlationId"] = correlationId,
                        ["details"] = apiException.Details
                    }
                },
                _ => new ProblemDetailsResponse
                {
                    Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                    Title = "An error occurred while processing your request",
                    Status = 500,
                    Detail = _env.IsDevelopment() ? exception.Message : "An internal server error occurred",
                    Instance = context.Request.Path,
                    Extensions = new Dictionary<string, object?>
                    {
                        ["errorCode"] = "INTERNAL_ERROR",
                        ["correlationId"] = correlationId,
                        ["stackTrace"] = _env.IsDevelopment() ? exception.StackTrace : null
                    }
                }
            };

            context.Response.StatusCode = response.Status ?? 500;
            
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };
            
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }

        private static string GetTitle(int statusCode) => statusCode switch
        {
            400 => "Bad Request",
            404 => "Not Found",
            409 => "Conflict",
            500 => "Internal Server Error",
            _ => "Error"
        };
    }
}