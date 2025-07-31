using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Tests.TestUtilities;
using DotNetCalendarAPI.Tests.Builders;
using DotNetCalendarAPI.Tests.Extensions;

namespace DotNetCalendarAPI.Tests.Endpoints
{
    public class GetEventByIdEndpointTests : TestBase
    {

        [Fact]
        public async Task GetEventById_ExistingEvent_ShouldReturnEvent()
        {
            // Arrange
            var eventService = GetEventService();
            
            var testEvent = new EventBuilder()
                .WithTitle("Test Event")
                .WithDescription("Test Description")
                .Build();
            eventService.AddEvent(testEvent);

            // Act
            var response = await Client.GetAsync($"/api/events/{testEvent.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<EventResponse>();
            content.Should().NotBeNull();
            content.Id.Should().Be(testEvent.Id);
            content.Title.Should().Be("Test Event");
            content.Description.Should().Be("Test Description");
        }

        [Fact]
        public async Task GetEventById_NonExistingEvent_ShouldReturn404WithProblemDetails()
        {
            // Act
            var response = await Client.GetAsync("/api/events/99999");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
            
            var problemDetails = await response.GetProblemDetails();
            problemDetails.Should().NotBeNull();
            problemDetails.Status.Should().Be(404);
            problemDetails.Title.Should().Be("Not Found");
            problemDetails.Detail.Should().Contain("Event with ID 99999 not found");
            problemDetails.Extensions.Should().ContainKey("errorCode");
            problemDetails.Extensions!["errorCode"].ToString().Should().Be("NOT_FOUND");
            problemDetails.Extensions.Should().ContainKey("correlationId");
        }

        [Fact]
        public async Task GetEventById_ShouldIncludeETagHeader()
        {
            // Arrange
            var eventService = GetEventService();
            
            var testEvent = new EventBuilder().Build();
            eventService.AddEvent(testEvent);

            // Act
            var response = await Client.GetAsync($"/api/events/{testEvent.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Headers.Should().ContainKey("ETag");
            response.Headers.ETag.Should().NotBeNull();
        }

        [Fact]
        public async Task GetEventById_WithIfNoneMatch_ShouldReturn304WhenNotModified()
        {
            // Arrange
            var eventService = GetEventService();
            
            var testEvent = new EventBuilder().Build();
            eventService.AddEvent(testEvent);

            // First request to get ETag
            var firstResponse = await Client.GetAsync($"/api/events/{testEvent.Id}");
            var etag = firstResponse.Headers.ETag?.Tag;
            etag.Should().NotBeNull();

            // Act - Second request with If-None-Match
            var request = new HttpRequestMessage(HttpMethod.Get, $"/api/events/{testEvent.Id}");
            request.Headers.Add("If-None-Match", etag);
            var response = await Client.SendAsync(request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }

        [Fact]
        public async Task GetEventById_ShouldIncludeCacheControlHeader()
        {
            // Arrange
            var eventService = GetEventService();
            
            var testEvent = new EventBuilder().Build();
            eventService.AddEvent(testEvent);

            // Act
            var response = await Client.GetAsync($"/api/events/{testEvent.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Headers.Should().ContainKey("Cache-Control");
            response.Headers.CacheControl.Should().NotBeNull();
            response.Headers.CacheControl!.Private.Should().BeTrue();
            response.Headers.CacheControl.MaxAge.Should().HaveValue();
        }

        [Theory]
        [InlineData("abc")]
        public async Task GetEventById_InvalidId_ShouldReturn400(string invalidId)
        {
            // Act
            var response = await Client.GetAsync($"/api/events/{invalidId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
        
        [Theory]
        [InlineData("-1")]
        [InlineData("0")]
        [InlineData("99999")]
        public async Task GetEventById_ValidButNonExistentId_ShouldReturn404(string nonExistentId)
        {
            // Act
            var response = await Client.GetAsync($"/api/events/{nonExistentId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetEventById_ShouldIncludeCorrelationId()
        {
            // Arrange
            var eventService = GetEventService();
            
            var testEvent = new EventBuilder().Build();
            eventService.AddEvent(testEvent);

            // Act
            var response = await Client.GetAsync($"/api/events/{testEvent.Id}");

            // Assert
            response.ShouldHaveCorrelationId();
        }

        [Fact]
        public async Task GetEventById_ShouldReturnCorrectEventData()
        {
            // Arrange
            var eventService = GetEventService();
            
            var testDate = DateTime.Today.AddDays(7);
            var testEvent = new EventBuilder()
                .WithTitle("Important Meeting")
                .WithDate(testDate)
                .WithTime("14:30")
                .WithDescription("Quarterly review meeting")
                .WithDuration(90)
                .Build();
            eventService.AddEvent(testEvent);

            // Act
            var response = await Client.GetAsync($"/api/events/{testEvent.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<EventResponse>();
            content.Title.Should().Be("Important Meeting");
            content.Date.Date.Should().Be(testDate.Date);
            content.Time.Should().Be("14:30");
            content.Description.Should().Be("Quarterly review meeting");
            content.Duration.Should().Be(90);
        }

        [Fact]
        public async Task GetEventById_AfterDeletion_ShouldReturn404()
        {
            // Arrange
            var eventService = GetEventService();
            
            var testEvent = new EventBuilder().Build();
            eventService.AddEvent(testEvent);
            var eventId = testEvent.Id;
            
            // Delete the event
            eventService.DeleteEvent(eventId);

            // Act
            var response = await Client.GetAsync($"/api/events/{eventId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }
    }
}