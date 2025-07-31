using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Xunit;
using FluentAssertions;
using NSubstitute;
using DotNetCalendarAPI.Infrastructure.Middleware;
using DotNetCalendarAPI.Infrastructure.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;

namespace DotNetCalendarAPI.Tests.Infrastructure
{
    public class GlobalExceptionMiddlewareTests
    {
        private readonly GlobalExceptionMiddleware _middleware;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly RequestDelegate _next;

        public GlobalExceptionMiddlewareTests()
        {
            _logger = Substitute.For<ILogger<GlobalExceptionMiddleware>>();
            _env = Substitute.For<IWebHostEnvironment>();
            _next = Substitute.For<RequestDelegate>();
            _env.EnvironmentName.Returns("Testing");
            _middleware = new GlobalExceptionMiddleware(_next, _logger, _env);
        }

        [Fact]
        public async Task InvokeAsync_NoException_ShouldCallNext()
        {
            // Arrange
            var context = CreateHttpContext();
            _next.Invoke(context).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            await _next.Received(1).Invoke(context);
        }

        [Fact]
        public async Task InvokeAsync_NotFoundException_ShouldReturn404()
        {
            // Arrange
            var context = CreateHttpContext();
            var exception = new NotFoundException("Event not found");
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw exception);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.StatusCode.Should().Be(404);
            
            var responseJson = await ReadResponseAsJson(context);
            responseJson.RootElement.GetProperty("status").GetInt32().Should().Be(404);
            responseJson.RootElement.GetProperty("title").GetString().Should().Be("Not Found");
            responseJson.RootElement.GetProperty("detail").GetString().Should().Be("Event not found");
            responseJson.RootElement.GetProperty("extensions").GetProperty("errorCode").GetString().Should().Be("NOT_FOUND");
        }

        [Fact]
        public async Task InvokeAsync_ValidationException_ShouldReturn400()
        {
            // Arrange
            var context = CreateHttpContext();
            var exception = new ValidationException("Title is required");
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw exception);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.StatusCode.Should().Be(400);
            
            var responseJson = await ReadResponseAsJson(context);
            responseJson.RootElement.GetProperty("status").GetInt32().Should().Be(400);
            responseJson.RootElement.GetProperty("title").GetString().Should().Be("Validation Error");
            responseJson.RootElement.GetProperty("detail").GetString().Should().Be("Title is required");
            responseJson.RootElement.GetProperty("extensions").GetProperty("errorCode").GetString().Should().Be("VALIDATION_ERROR");
        }

        [Fact]
        public async Task InvokeAsync_ConflictException_ShouldReturn409()
        {
            // Arrange
            var context = CreateHttpContext();
            var exception = new ConflictException("Event overlaps");
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw exception);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.StatusCode.Should().Be(409);
            
            var responseJson = await ReadResponseAsJson(context);
            responseJson.RootElement.GetProperty("status").GetInt32().Should().Be(409);
            responseJson.RootElement.GetProperty("title").GetString().Should().Be("Conflict");
            responseJson.RootElement.GetProperty("detail").GetString().Should().Be("Event overlaps");
            responseJson.RootElement.GetProperty("extensions").GetProperty("errorCode").GetString().Should().Be("CONFLICT");
        }

        [Fact]
        public async Task InvokeAsync_ApiException_ShouldReturnCustomStatusCode()
        {
            // Arrange
            var context = CreateHttpContext();
            var exception = new ApiException(422, "Custom error", "CUSTOM_ERROR", new { field = "test" });
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw exception);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.StatusCode.Should().Be(422);
            
            var responseJson = await ReadResponseAsJson(context);
            responseJson.RootElement.GetProperty("status").GetInt32().Should().Be(422);
            responseJson.RootElement.GetProperty("detail").GetString().Should().Be("Custom error");
            responseJson.RootElement.GetProperty("extensions").GetProperty("errorCode").GetString().Should().Be("CUSTOM_ERROR");
            responseJson.RootElement.GetProperty("extensions").TryGetProperty("details", out _).Should().BeTrue();
        }

        [Fact]
        public async Task InvokeAsync_UnhandledException_ShouldReturn500()
        {
            // Arrange
            var context = CreateHttpContext();
            var exception = new InvalidOperationException("Unexpected error");
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw exception);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.StatusCode.Should().Be(500);
            
            var responseJson = await ReadResponseAsJson(context);
            responseJson.RootElement.GetProperty("status").GetInt32().Should().Be(500);
            responseJson.RootElement.GetProperty("title").GetString().Should().Be("An error occurred while processing your request");
            responseJson.RootElement.GetProperty("detail").GetString().Should().Be("An internal server error occurred");
            responseJson.RootElement.GetProperty("extensions").GetProperty("errorCode").GetString().Should().Be("INTERNAL_ERROR");
        }

        [Fact]
        public async Task InvokeAsync_ShouldIncludeCorrelationId()
        {
            // Arrange
            var context = CreateHttpContext();
            var correlationId = context.TraceIdentifier;
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw new NotFoundException("Not found"));

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            var responseJson = await ReadResponseAsJson(context);
            responseJson.RootElement.GetProperty("extensions").GetProperty("correlationId").GetString().Should().Be(correlationId);
        }

        [Fact]
        public async Task InvokeAsync_ShouldLogError()
        {
            // Arrange
            var context = CreateHttpContext();
            var exception = new InvalidOperationException("Test error");
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw exception);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _logger.Received().Log(
                LogLevel.Error,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                exception,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task InvokeAsync_ShouldSetContentType()
        {
            // Arrange
            var context = CreateHttpContext();
            _next.When(x => x.Invoke(context))
                .Do(x => throw new NotFoundException("Not found"));

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.ContentType.Should().Be("application/problem+json");
        }

        [Fact]
        public async Task InvokeAsync_ShouldClearResponseBeforeWriting()
        {
            // Arrange
            var context = CreateHttpContext();
            context.Response.StatusCode = 200;
            context.Response.Headers["Test-Header"] = "Test-Value";
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw new NotFoundException("Not found"));

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.Headers.Should().NotContainKey("Test-Header");
        }

        private static HttpContext CreateHttpContext()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            context.Request.Path = "/api/test";
            context.Request.Method = "GET";
            return context;
        }

        private static async Task<T> ReadResponseAs<T>(HttpContext context)
        {
            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var content = await reader.ReadToEndAsync();
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            })!;
        }

        private static async Task<JsonDocument> ReadResponseAsJson(HttpContext context)
        {
            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var content = await reader.ReadToEndAsync();
            return JsonDocument.Parse(content);
        }
    }
}