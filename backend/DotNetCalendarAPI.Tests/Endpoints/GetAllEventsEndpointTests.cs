using System;
using System.Collections.Generic;
using System.Linq;
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
    public class GetAllEventsEndpointTests : TestBase
    {

        [Fact]
        public async Task GetAllEvents_NoEvents_ShouldReturnEmptyPaginatedResponse()
        {
            // Act
            var response = await Client.GetAsync("/api/events");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Should().NotBeNull();
            content.Data.Should().BeEmpty();
            content.TotalCount.Should().Be(0);
            content.Page.Should().Be(1);
            content.HasNext.Should().BeFalse();
            content.HasPrevious.Should().BeFalse();
            
            response.ShouldHavePaginationHeaders();
        }

        [Fact]
        public async Task GetAllEvents_WithEvents_ShouldReturnPaginatedList()
        {
            // Arrange
            var eventService = GetEventService();
            
            var events = new EventBuilder().BuildMany(15);
            foreach (var evt in events)
            {
                eventService.AddEvent(evt);
            }

            // Act
            var response = await Client.GetAsync("/api/events?page=1&pageSize=10");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(10);
            content.TotalCount.Should().Be(15);
            content.Page.Should().Be(1);
            content.PageSize.Should().Be(10);
            content.TotalPages.Should().Be(2);
            content.HasNext.Should().BeTrue();
            content.HasPrevious.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllEvents_SecondPage_ShouldReturnCorrectData()
        {
            // Arrange
            var eventService = GetEventService();
            
            var events = new EventBuilder().BuildMany(15);
            foreach (var evt in events)
            {
                eventService.AddEvent(evt);
            }

            // Act
            var response = await Client.GetAsync("/api/events?page=2&pageSize=10");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(5);
            content.Page.Should().Be(2);
            content.HasNext.Should().BeFalse();
            content.HasPrevious.Should().BeTrue();
        }

        [Fact]
        public async Task GetAllEvents_FilterByDate_ShouldReturnFilteredEvents()
        {
            // Arrange
            var eventService = GetEventService();
            
            var targetDate = DateTime.Today.AddDays(5);
            
            // Add events on different dates
            eventService.AddEvent(new EventBuilder().WithDate(targetDate).Build());
            eventService.AddEvent(new EventBuilder().WithDate(targetDate).Build());
            eventService.AddEvent(new EventBuilder().WithDate(targetDate.AddDays(1)).Build());
            eventService.AddEvent(new EventBuilder().WithDate(targetDate.AddDays(-1)).Build());

            // Act
            var response = await Client.GetAsync($"/api/events?date={targetDate:yyyy-MM-dd}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(2);
            content.Data.Should().OnlyContain(e => e.Date.Date == targetDate.Date);
        }

        [Theory]
        [InlineData(0, 10)]
        [InlineData(-1, 10)]
        [InlineData(1, 0)]
        [InlineData(1, -5)]
        public async Task GetAllEvents_InvalidPagination_ShouldUseDefaults(int page, int pageSize)
        {
            // Act
            var response = await Client.GetAsync($"/api/events?page={page}&pageSize={pageSize}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Page.Should().BeGreaterThan(0);
            content.PageSize.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task GetAllEvents_ShouldReturnEventsOrderedByDateAndTime()
        {
            // Arrange
            var eventService = GetEventService();
            
            var laterEvent = new EventBuilder()
                .WithDate(DateTime.Today.AddDays(2))
                .WithTime("10:00")
                .Build();
                
            var earlierEvent = new EventBuilder()
                .WithDate(DateTime.Today.AddDays(1))
                .WithTime("14:00")
                .Build();
                
            var earliestEvent = new EventBuilder()
                .WithDate(DateTime.Today.AddDays(1))
                .WithTime("09:00")
                .Build();

            eventService.AddEvent(laterEvent);
            eventService.AddEvent(earlierEvent);
            eventService.AddEvent(earliestEvent);

            // Act
            var response = await Client.GetAsync("/api/events");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(3);
            
            // Verify order
            content.Data[0].Id.Should().Be(earliestEvent.Id);
            content.Data[1].Id.Should().Be(earlierEvent.Id);
            content.Data[2].Id.Should().Be(laterEvent.Id);
        }

        [Fact]
        public async Task GetAllEvents_LargePageSize_ShouldReturnAllEvents()
        {
            // Arrange
            var eventService = GetEventService();
            
            var events = new EventBuilder().BuildMany(50);
            foreach (var evt in events)
            {
                eventService.AddEvent(evt);
            }

            // Act
            var response = await Client.GetAsync("/api/events?pageSize=100");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(50);
            content.TotalPages.Should().Be(1);
            content.HasNext.Should().BeFalse();
        }

        [Fact]
        public async Task GetAllEvents_ShouldIncludeCorrelationId()
        {
            // Act
            var response = await Client.GetAsync("/api/events");

            // Assert
            response.ShouldHaveCorrelationId();
        }

        [Fact]
        public async Task GetAllEvents_ShouldReturnSuccessStatusCode()
        {
            // Act
            var response = await Client.GetAsync("/api/events");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}