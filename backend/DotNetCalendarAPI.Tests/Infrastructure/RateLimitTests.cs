using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;

namespace DotNetCalendarAPI.Tests.Infrastructure
{
    public class RateLimitTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public RateLimitTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task RateLimit_ExceedingLimit_ShouldReturn429()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 5, period: "1m");
            
            // Act - Make requests up to the limit
            for (int i = 0; i < 5; i++)
            {
                var response = await client.GetAsync("/api/events");
                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }

            // Make one more request that should be rate limited
            var rateLimitedResponse = await client.GetAsync("/api/events");

            // Assert
            rateLimitedResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        }

        [Fact]
        public async Task RateLimit_ShouldIncludeRetryAfterHeader()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 1, period: "1m");
            
            // Act
            await client.GetAsync("/api/events"); // First request OK
            var response = await client.GetAsync("/api/events"); // Should be rate limited

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
            response.Headers.Should().ContainKey("Retry-After");
        }

        [Fact]
        public async Task RateLimit_ShouldIncludeRateLimitHeaders()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 10, period: "1m");
            
            // Act
            var response = await client.GetAsync("/api/events");

            // Assert
            response.Headers.Should().ContainKey("X-Rate-Limit-Limit");
            response.Headers.Should().ContainKey("X-Rate-Limit-Remaining");
            response.Headers.Should().ContainKey("X-Rate-Limit-Reset");
        }

        [Fact]
        public async Task RateLimit_RemainingCountShouldDecrease()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 10, period: "1m");
            
            // Act
            var response1 = await client.GetAsync("/api/events");
            var remaining1 = int.Parse(response1.Headers.GetValues("X-Rate-Limit-Remaining").First());
            
            var response2 = await client.GetAsync("/api/events");
            var remaining2 = int.Parse(response2.Headers.GetValues("X-Rate-Limit-Remaining").First());

            // Assert
            remaining1.Should().Be(9);
            remaining2.Should().Be(8);
        }

        [Fact]
        public async Task RateLimit_DifferentEndpoints_ShouldHaveSeparateLimits()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 2, period: "1m");
            
            // Act - Exhaust limit for one endpoint
            await client.GetAsync("/api/events");
            await client.GetAsync("/api/events");
            var rateLimited = await client.GetAsync("/api/events");

            // Try different endpoint
            var differentEndpoint = await client.GetAsync("/api/events/1");

            // Assert
            rateLimited.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
            differentEndpoint.StatusCode.Should().Be(HttpStatusCode.NotFound); // Not rate limited
        }

        [Fact]
        public async Task RateLimit_HealthEndpoints_ShouldBeExempt()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 1, period: "1m");
            
            // Act - Exhaust general limit
            await client.GetAsync("/api/events");
            await client.GetAsync("/api/events"); // Should be rate limited

            // Health endpoints should still work
            var healthResponse = await client.GetAsync("/health");
            var readyResponse = await client.GetAsync("/health/ready");

            // Assert
            healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            readyResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task RateLimit_PostRequests_ShouldBeLimited()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 2, period: "1m");
            var content = new StringContent("{\"title\":\"Test\"}", System.Text.Encoding.UTF8, "application/json");
            
            // Act
            for (int i = 0; i < 2; i++)
            {
                var response = await client.PostAsync("/api/events", content);
                response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.BadRequest);
            }

            var rateLimitedResponse = await client.PostAsync("/api/events", content);

            // Assert
            rateLimitedResponse.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        }

        [Fact]
        public async Task RateLimit_ResetTime_ShouldBeInFuture()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 5, period: "1m");
            
            // Act
            var response = await client.GetAsync("/api/events");
            var resetTimeHeader = response.Headers.GetValues("X-Rate-Limit-Reset").First();
            var resetTime = DateTimeOffset.FromUnixTimeSeconds(long.Parse(resetTimeHeader));

            // Assert
            resetTime.Should().BeAfter(DateTimeOffset.UtcNow);
            resetTime.Should().BeBefore(DateTimeOffset.UtcNow.AddMinutes(2));
        }

        [Fact]
        public async Task RateLimit_ErrorResponse_ShouldBeProblemDetails()
        {
            // Arrange
            var client = CreateClientWithRateLimitConfig(limit: 1, period: "1m");
            
            // Act
            await client.GetAsync("/api/events");
            var response = await client.GetAsync("/api/events");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
        }

        private HttpClient CreateClientWithRateLimitConfig(int limit, string period)
        {
            var configOverrides = new Dictionary<string, string>
            {
                ["IpRateLimiting:GeneralRules:0:Endpoint"] = "*",
                ["IpRateLimiting:GeneralRules:0:Period"] = period,
                ["IpRateLimiting:GeneralRules:0:Limit"] = limit.ToString()
            };

            var customFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Configure for Testing environment
                });
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(configOverrides!);
                });
            });

            return customFactory.CreateClient();
        }
    }
}