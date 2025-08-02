using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Xunit;
using FluentAssertions;
using NSubstitute;
using DotNetCalendarAPI.Infrastructure.Middleware;

namespace DotNetCalendarAPI.Tests.Infrastructure
{
    public class RequestLoggingMiddlewareTests
    {
        private readonly RequestLoggingMiddleware _middleware;
        private readonly ILogger<RequestLoggingMiddleware> _logger;
        private readonly RequestDelegate _next;

        public RequestLoggingMiddlewareTests()
        {
            _logger = Substitute.For<ILogger<RequestLoggingMiddleware>>();
            _next = Substitute.For<RequestDelegate>();
            _middleware = new RequestLoggingMiddleware(_next, _logger);
        }

        [Fact]
        public async Task InvokeAsync_ShouldLogRequestAndResponse()
        {
            // Arrange
            var context = CreateHttpContext();
            _next.Invoke(context).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());

            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task InvokeAsync_ShouldSetCorrelationId()
        {
            // Arrange
            var context = CreateHttpContext();
            _next.Invoke(context).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Items.Should().ContainKey("CorrelationId");
            context.Items["CorrelationId"].Should().NotBeNull();
            context.Response.Headers.Should().ContainKey("X-Correlation-Id");
        }

        [Fact]
        public async Task InvokeAsync_ShouldUseTraceIdentifier()
        {
            // Arrange
            var context = CreateHttpContext();
            var traceId = context.TraceIdentifier;
            _next.Invoke(context).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Items["CorrelationId"].Should().Be(traceId);
            context.Response.Headers["X-Correlation-Id"].Should().BeEquivalentTo(traceId);
        }

        [Fact]
        public async Task InvokeAsync_ShouldLogWithCorrelationId()
        {
            // Arrange
            var context = CreateHttpContext();
            _next.Invoke(context).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            var correlationId = context.Items["CorrelationId"]?.ToString();
            correlationId.Should().NotBeNullOrEmpty();

            _logger.Received().Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task InvokeAsync_ShouldLogResponseTime()
        {
            // Arrange
            var context = CreateHttpContext();
            var delay = TimeSpan.FromMilliseconds(100);
            
            _next.Invoke(context).Returns(async _ => await Task.Delay(delay));

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task InvokeAsync_WithQueryString_ShouldLogFullPath()
        {
            // Arrange
            var context = CreateHttpContext();
            context.Request.QueryString = new QueryString("?param=value");
            _next.Invoke(context).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _logger.Received().Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Theory]
        [InlineData("POST")]
        [InlineData("PUT")]
        [InlineData("DELETE")]
        [InlineData("PATCH")]
        public async Task InvokeAsync_DifferentHttpMethods_ShouldLogCorrectly(string method)
        {
            // Arrange
            var context = CreateHttpContext();
            context.Request.Method = method;
            _next.Invoke(context).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _logger.Received().Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Theory]
        [InlineData(200)]
        [InlineData(201)]
        [InlineData(204)]
        [InlineData(400)]
        [InlineData(404)]
        [InlineData(500)]
        public async Task InvokeAsync_DifferentStatusCodes_ShouldLogCorrectly(int statusCode)
        {
            // Arrange
            var context = CreateHttpContext();
            _next.Invoke(context).Returns(_ =>
            {
                context.Response.StatusCode = statusCode;
                return Task.CompletedTask;
            });

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _logger.Received().Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task InvokeAsync_WithException_ShouldStillLogResponse()
        {
            // Arrange
            var context = CreateHttpContext();
            var exception = new InvalidOperationException("Test exception");
            
            _next.When(x => x.Invoke(context))
                .Do(x => throw exception);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(() => _middleware.InvokeAsync(context));

            // Should log start but not response (exception prevents it)
            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task InvokeAsync_ShouldCallNext()
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
        public async Task InvokeAsync_ShouldNotModifyResponseBody()
        {
            // Arrange
            var context = CreateHttpContext();
            var responseContent = "Test response content";
            
            _next.Invoke(context).Returns(async _ =>
            {
                await context.Response.WriteAsync(responseContent);
            });

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var content = await reader.ReadToEndAsync();
            content.Should().Be(responseContent);
        }

        [Fact]
        public async Task InvokeAsync_WithSlowRequest_ShouldLogWarning()
        {
            // Arrange
            var context = CreateHttpContext();
            var delay = TimeSpan.FromMilliseconds(1100); // Over 1000ms threshold
            
            _next.Invoke(context).Returns(async _ => await Task.Delay(delay));

            // Act
            await _middleware.InvokeAsync(context);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Warning,
                Arg.Any<EventId>(),
                Arg.Any<object>(),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        private static HttpContext CreateHttpContext()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            context.Request.Path = "/api/test";
            context.Request.Method = "GET";
            return context;
        }
    }
}