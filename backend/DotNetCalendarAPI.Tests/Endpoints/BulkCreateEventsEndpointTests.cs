using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Models.Requests;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Tests.TestUtilities;
using DotNetCalendarAPI.Tests.Builders;
using DotNetCalendarAPI.Tests.Extensions;

namespace DotNetCalendarAPI.Tests.Endpoints
{
    public class BulkCreateEventsEndpointTests : TestBase
    {
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        [Fact]
        public async Task BulkCreateEvents_ValidEvents_ShouldCreateAllEvents()
        {
            // Arrange
            var events = new List<CreateEventRequest>
            {
                new()
                {
                    Title = "Event 1",
                    DateString = DateTime.Today.AddDays(1).ToString("yyyy-MM-dd"),
                    Time = "10:00",
                    Description = "First event",
                    Duration = 60
                },
                new()
                {
                    Title = "Event 2",
                    DateString = DateTime.Today.AddDays(2).ToString("yyyy-MM-dd"),
                    Time = "14:00",
                    Description = "Second event",
                    Duration = 90
                }
            };

            var request = new { events };
            var content = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await Client.PostAsync("/api/events/bulk", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<BulkCreateEventsResponse>(responseContent, _jsonOptions);
            
            result.Should().NotBeNull();
            result!.TotalRequested.Should().Be(2);
            result.SuccessCount.Should().Be(2);
            result.FailureCount.Should().Be(0);
            result.Results.Should().HaveCount(2);
            result.Results.Should().OnlyContain(r => r.Success);
            
            // Verify events were actually created
            var eventService = GetEventService();
            eventService.GetEventCount().Should().Be(2);
        }

        [Fact]
        public async Task BulkCreateEvents_WithSomeInvalidEvents_ShouldReturnPartialSuccess()
        {
            // Arrange
            var events = new List<CreateEventRequest>
            {
                new()
                {
                    Title = "Valid Event",
                    DateString = DateTime.Today.AddDays(1).ToString("yyyy-MM-dd"),
                    Time = "10:00",
                    Duration = 60
                },
                new()
                {
                    Title = "", // Invalid - empty title
                    DateString = DateTime.Today.AddDays(2).ToString("yyyy-MM-dd"),
                    Time = "14:00",
                    Duration = 90
                },
                new()
                {
                    Title = "Another Valid Event",
                    DateString = DateTime.Today.AddDays(3).ToString("yyyy-MM-dd"),
                    Time = "15:00",
                    Duration = 60
                }
            };

            var request = new { events };
            var content = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await Client.PostAsync("/api/events/bulk", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var result = JsonSerializer.Deserialize<BulkCreateEventsResponse>(
                await response.Content.ReadAsStringAsync(), _jsonOptions);
            
            result!.TotalRequested.Should().Be(3);
            result.SuccessCount.Should().Be(2);
            result.FailureCount.Should().Be(1);
            
            result.Results[0].Success.Should().BeTrue();
            result.Results[1].Success.Should().BeFalse();
            result.Results[1].Error.Should().Be("Title is required");
            result.Results[2].Success.Should().BeTrue();
        }

        [Fact]
        public async Task BulkCreateEvents_WithOverlappingEvents_ShouldFailForOverlaps()
        {
            // Arrange
            var sameDate = DateTime.Today.AddDays(5).ToString("yyyy-MM-dd");
            var events = new List<CreateEventRequest>
            {
                new()
                {
                    Title = "Event 1",
                    DateString = sameDate,
                    Time = "10:00",
                    Duration = 60
                },
                new()
                {
                    Title = "Event 2 (Overlapping)",
                    DateString = sameDate,
                    Time = "10:30",
                    Duration = 60
                },
                new()
                {
                    Title = "Event 3 (Non-overlapping)",
                    DateString = sameDate,
                    Time = "12:00",
                    Duration = 60
                }
            };

            var request = new { events };
            var content = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await Client.PostAsync("/api/events/bulk", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var result = JsonSerializer.Deserialize<BulkCreateEventsResponse>(
                await response.Content.ReadAsStringAsync(), _jsonOptions);
            
            result!.SuccessCount.Should().Be(2);
            result.FailureCount.Should().Be(1);
            
            result.Results[0].Success.Should().BeTrue();
            result.Results[1].Success.Should().BeFalse();
            result.Results[1].Error.Should().Be("Event overlaps with an existing event");
            result.Results[2].Success.Should().BeTrue();
        }

        [Fact]
        public async Task BulkCreateEvents_EmptyList_ShouldReturnBadRequest()
        {
            // Arrange
            var request = new { events = new List<CreateEventRequest>() };
            var content = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await Client.PostAsync("/api/events/bulk", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            
            var problemDetails = await response.GetProblemDetails();
            problemDetails.Detail.Should().Contain("At least one event must be provided");
        }

        [Fact]
        public async Task BulkCreateEvents_MoreThan100Events_ShouldReturnBadRequest()
        {
            // Arrange
            var events = Enumerable.Range(1, 101).Select(i => new CreateEventRequest
            {
                Title = $"Event {i}",
                DateString = DateTime.Today.AddDays(i).ToString("yyyy-MM-dd"),
                Time = "10:00",
                Duration = 60
            }).ToList();

            var request = new { events };
            var content = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await Client.PostAsync("/api/events/bulk", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            
            var problemDetails = await response.GetProblemDetails();
            problemDetails.Detail.Should().Contain("Cannot create more than 100 events");
        }

        [Fact]
        public async Task BulkCreateEvents_ShouldMaintainOrderInResults()
        {
            // Arrange
            var events = new List<CreateEventRequest>
            {
                new() { Title = "First", DateString = DateTime.Today.AddDays(1).ToString("yyyy-MM-dd"), Time = "10:00" },
                new() { Title = "Second", DateString = DateTime.Today.AddDays(2).ToString("yyyy-MM-dd"), Time = "11:00" },
                new() { Title = "Third", DateString = DateTime.Today.AddDays(3).ToString("yyyy-MM-dd"), Time = "12:00" }
            };

            var request = new { events };
            var content = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await Client.PostAsync("/api/events/bulk", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var result = JsonSerializer.Deserialize<BulkCreateEventsResponse>(
                await response.Content.ReadAsStringAsync(), _jsonOptions);
            
            result!.Results.Should().HaveCount(3);
            result.Results[0].Index.Should().Be(0);
            result.Results[1].Index.Should().Be(1);
            result.Results[2].Index.Should().Be(2);
        }

        [Fact]
        public async Task BulkCreateEvents_ShouldReturnCreatedEventIds()
        {
            // Arrange
            var events = new List<CreateEventRequest>
            {
                new()
                {
                    Title = "Event with ID",
                    DateString = DateTime.Today.AddDays(1).ToString("yyyy-MM-dd"),
                    Time = "10:00",
                    Duration = 60
                }
            };

            var request = new { events };
            var content = new StringContent(
                JsonSerializer.Serialize(request, _jsonOptions),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await Client.PostAsync("/api/events/bulk", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var result = JsonSerializer.Deserialize<BulkCreateEventsResponse>(
                await response.Content.ReadAsStringAsync(), _jsonOptions);
            
            result!.Results[0].Success.Should().BeTrue();
            result.Results[0].EventId.Should().HaveValue();
            result.Results[0].EventId.Should().BeGreaterThan(0);
        }
    }

    // Response DTOs for deserialization
    public class BulkCreateEventsResponse
    {
        public int TotalRequested { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<BulkOperationResult> Results { get; set; } = new();
    }

    public class BulkOperationResult
    {
        public int Index { get; set; }
        public bool Success { get; set; }
        public int? EventId { get; set; }
        public string? Error { get; set; }
    }
}