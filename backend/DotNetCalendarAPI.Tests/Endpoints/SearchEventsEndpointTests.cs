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
    public class SearchEventsEndpointTests : TestBase
    {
        [Fact]
        public async Task SearchEvents_NoQuery_ShouldReturnAllEvents()
        {
            // Arrange
            var eventService = GetEventService();
            var events = new EventBuilder().BuildMany(5);
            foreach (var evt in events)
            {
                eventService.AddEvent(evt);
            }

            // Act
            var response = await Client.GetAsync("/api/events/search");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(5);
        }

        [Fact]
        public async Task SearchEvents_WithTextQuery_ShouldReturnMatchingEvents()
        {
            // Arrange
            var eventService = GetEventService();
            
            eventService.AddEvent(new EventBuilder()
                .WithTitle("Team Meeting")
                .WithDescription("Discuss project roadmap")
                .Build());
            
            eventService.AddEvent(new EventBuilder()
                .WithTitle("Client Call")
                .WithDescription("Review deliverables")
                .Build());
            
            eventService.AddEvent(new EventBuilder()
                .WithTitle("Lunch Break")
                .WithDescription("Team lunch at restaurant")
                .Build());

            // Act
            var response = await Client.GetAsync("/api/events/search?query=team");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(2);
            content.Data.Should().Contain(e => e.Title == "Team Meeting");
            content.Data.Should().Contain(e => e.Title == "Lunch Break");
        }

        [Fact]
        public async Task SearchEvents_WithDateRange_ShouldReturnEventsInRange()
        {
            // Arrange
            var eventService = GetEventService();
            
            var baseDate = DateTime.Today.AddDays(10);
            
            eventService.AddEvent(new EventBuilder().WithDate(baseDate.AddDays(-5)).Build());
            eventService.AddEvent(new EventBuilder().WithDate(baseDate).Build());
            eventService.AddEvent(new EventBuilder().WithDate(baseDate.AddDays(5)).Build());
            eventService.AddEvent(new EventBuilder().WithDate(baseDate.AddDays(10)).Build());

            // Act
            var startDate = baseDate.AddDays(-2).ToString("yyyy-MM-dd");
            var endDate = baseDate.AddDays(7).ToString("yyyy-MM-dd");
            var response = await Client.GetAsync($"/api/events/search?startDate={startDate}&endDate={endDate}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(2);
        }

        [Theory]
        [InlineData("morning", "08:00", "09:00", "11:00", 2)]
        [InlineData("afternoon", "08:00", "14:00", "18:00", 1)]
        [InlineData("evening", "08:00", "14:00", "19:00", 1)]
        public async Task SearchEvents_WithTimeOfDay_ShouldReturnCorrectEvents(
            string timeOfDay, string time1, string time2, string time3, int expectedCount)
        {
            // Arrange
            var eventService = GetEventService();
            var date = DateTime.Today.AddDays(1);
            
            eventService.AddEvent(new EventBuilder().WithDate(date).WithTime(time1).Build());
            eventService.AddEvent(new EventBuilder().WithDate(date).WithTime(time2).Build());
            eventService.AddEvent(new EventBuilder().WithDate(date).WithTime(time3).Build());

            // Act
            var response = await Client.GetAsync($"/api/events/search?timeOfDay={timeOfDay}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(expectedCount);
        }

        [Fact]
        public async Task SearchEvents_WithDurationFilter_ShouldReturnMatchingEvents()
        {
            // Arrange
            var eventService = GetEventService();
            
            eventService.AddEvent(new EventBuilder().WithDuration(30).Build());
            eventService.AddEvent(new EventBuilder().WithDuration(60).Build());
            eventService.AddEvent(new EventBuilder().WithDuration(90).Build());
            eventService.AddEvent(new EventBuilder().WithDuration(120).Build());

            // Act
            var response = await Client.GetAsync("/api/events/search?minDuration=60&maxDuration=90");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(2);
            content.Data.Should().OnlyContain(e => e.Duration >= 60 && e.Duration <= 90);
        }

        [Theory]
        [InlineData("title", false)]
        [InlineData("date", false)]
        [InlineData("duration", true)]
        public async Task SearchEvents_WithSorting_ShouldReturnSortedResults(string sortBy, bool descending)
        {
            // Arrange
            var eventService = GetEventService();
            
            var events = new[]
            {
                new EventBuilder().WithTitle("Alpha").WithDate(DateTime.Today.AddDays(3)).WithDuration(60).Build(),
                new EventBuilder().WithTitle("Beta").WithDate(DateTime.Today.AddDays(1)).WithDuration(90).Build(),
                new EventBuilder().WithTitle("Gamma").WithDate(DateTime.Today.AddDays(2)).WithDuration(30).Build()
            };
            
            foreach (var evt in events)
            {
                eventService.AddEvent(evt);
            }

            // Act
            var response = await Client.GetAsync($"/api/events/search?sortBy={sortBy}&sortDescending={descending}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(3);
            
            if (sortBy == "title")
            {
                if (descending)
                    content.Data.First().Title.Should().Be("Gamma");
                else
                    content.Data.First().Title.Should().Be("Alpha");
            }
            else if (sortBy == "duration")
            {
                if (descending)
                    content.Data.First().Duration.Should().Be(90);
                else
                    content.Data.First().Duration.Should().Be(30);
            }
        }

        [Fact]
        public async Task SearchEvents_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange
            var eventService = GetEventService();
            var events = new EventBuilder().BuildMany(25);
            foreach (var evt in events)
            {
                eventService.AddEvent(evt);
            }

            // Act
            var response = await Client.GetAsync("/api/events/search?page=2&pageSize=10");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(10);
            content.Page.Should().Be(2);
            content.HasPrevious.Should().BeTrue();
            content.HasNext.Should().BeTrue();
        }

        [Fact]
        public async Task SearchEvents_CombinedFilters_ShouldApplyAllFilters()
        {
            // Arrange
            var eventService = GetEventService();
            var targetDate = DateTime.Today.AddDays(5);
            
            // Add various events
            eventService.AddEvent(new EventBuilder()
                .WithTitle("Team Meeting")
                .WithDate(targetDate)
                .WithTime("10:00")
                .WithDuration(60)
                .Build());
            
            eventService.AddEvent(new EventBuilder()
                .WithTitle("Team Lunch")
                .WithDate(targetDate)
                .WithTime("12:00")
                .WithDuration(90)
                .Build());
            
            eventService.AddEvent(new EventBuilder()
                .WithTitle("Client Meeting")
                .WithDate(targetDate)
                .WithTime("14:00")
                .WithDuration(60)
                .Build());
            
            eventService.AddEvent(new EventBuilder()
                .WithTitle("Team Retrospective")
                .WithDate(targetDate.AddDays(1))
                .WithTime("10:00")
                .WithDuration(60)
                .Build());

            // Act - Search for "team" events on specific date in morning with 60min duration
            var response = await Client.GetAsync(
                $"/api/events/search?query=team&startDate={targetDate:yyyy-MM-dd}&endDate={targetDate:yyyy-MM-dd}&timeOfDay=morning&minDuration=60&maxDuration=60");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var content = await response.DeserializeContent<PaginatedResponse<EventResponse>>();
            content.Data.Should().HaveCount(1);
            content.Data.First().Title.Should().Be("Team Meeting");
        }

        [Fact]
        public async Task SearchEvents_ShouldIncludeSearchMetadataHeaders()
        {
            // Arrange
            var eventService = GetEventService();
            eventService.AddEvent(new EventBuilder().Build());

            // Act
            var response = await Client.GetAsync("/api/events/search?query=test");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.ShouldHaveHeader("X-Search-Query", "test");
            response.ShouldHaveHeader("X-Total-Count");
        }
    }
}