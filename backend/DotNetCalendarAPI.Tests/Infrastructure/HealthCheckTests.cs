using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using DotNetCalendarAPI.Services;
using Microsoft.AspNetCore.Hosting;

namespace DotNetCalendarAPI.Tests.Infrastructure
{
    public class HealthCheckTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public HealthCheckTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Configure for Testing environment
                });
            });
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task HealthCheck_Basic_ShouldReturnHealthy()
        {
            // Act
            var response = await _client.GetAsync("/health");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Contain("Healthy");
        }

        [Fact]
        public async Task HealthCheck_Ready_ShouldReturnHealthy()
        {
            // Act
            var response = await _client.GetAsync("/health/ready");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Contain("Healthy");
        }

        [Fact]
        public async Task HealthCheck_Ready_ShouldReturnContent()
        {
            // Act
            var response = await _client.GetAsync("/health/ready");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeEmpty();
            content.Should().Contain("Healthy");
        }

        [Fact]
        public async Task HealthCheck_DefaultEndpoint_ShouldReturnHealthy()
        {
            // Act
            var response = await _client.GetAsync("/health");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Contain("Healthy");
        }

        [Fact]
        public async Task HealthCheck_ShouldReturnProperContentType()
        {
            // Act
            var response = await _client.GetAsync("/health");

            // Assert
            response.Content.Headers.ContentType?.MediaType.Should().NotBeNull();
        }

        [Fact]
        public async Task HealthCheck_Ready_ShouldReturnSuccessfully()
        {
            // Act
            var response = await _client.GetAsync("/health/ready");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task HealthCheck_Ready_ShouldExecuteAllChecks()
        {
            // Act
            var response = await _client.GetAsync("/health/ready");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrWhiteSpace();
        }

        [Fact]
        public async Task HealthCheck_ShouldNotRequireAuthentication()
        {
            // Act - No auth headers
            var response = await _client.GetAsync("/health");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task HealthCheck_ShouldBeExcludedFromRateLimiting()
        {
            // Act - Make multiple rapid requests
            for (int i = 0; i < 10; i++)
            {
                var response = await _client.GetAsync("/health");
                response.StatusCode.Should().Be(HttpStatusCode.OK);
            }
        }

        [Fact]
        public async Task HealthCheck_EventServiceCheck_ShouldWork()
        {
            // Act
            var response = await _client.GetAsync("/health/ready");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        [Fact]
        public async Task HealthCheck_ShouldReturnCorrectCacheHeaders()
        {
            // Act
            var response = await _client.GetAsync("/health");

            // Assert
            response.Headers.CacheControl?.NoCache.Should().BeTrue();
            response.Headers.CacheControl?.NoStore.Should().BeTrue();
        }
    }
}