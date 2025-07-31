using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using NSubstitute;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Models;
using DotNetCalendarAPI.Infrastructure.Exceptions;
using DotNetCalendarAPI.Tests.Builders;

namespace DotNetCalendarAPI.Tests.Services
{
    public class EventServiceTests
    {
        private readonly EventService _sut;
        private readonly ILogger<EventService> _logger;

        public EventServiceTests()
        {
            _logger = Substitute.For<ILogger<EventService>>();
            _sut = new EventService(_logger);
            _sut.InitializeNextId(0); // Ensure each test starts with ID 0
        }

        [Fact]
        public void GetAllEvents_WhenNoEvents_ShouldReturnEmptyList()
        {
            // Act
            var result = _sut.GetAllEvents();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetAllEvents_WithMultipleEvents_ShouldReturnOrderedByDateAndTime()
        {
            // Arrange
            var event1 = new EventBuilder()
                .WithDate(DateTime.Today.AddDays(2))
                .WithTime("14:00")
                .Build();
                
            var event2 = new EventBuilder()
                .WithDate(DateTime.Today.AddDays(1))
                .WithTime("10:00")
                .Build();
                
            var event3 = new EventBuilder()
                .WithDate(DateTime.Today.AddDays(1))
                .WithTime("09:00")
                .Build();

            _sut.AddEvent(event1);
            _sut.AddEvent(event2);
            _sut.AddEvent(event3);

            // Act
            var result = _sut.GetAllEvents();

            // Assert
            result.Should().HaveCount(3);
            result[0].Should().Be(event3); // Same day, earlier time
            result[1].Should().Be(event2); // Same day, later time
            result[2].Should().Be(event1); // Later day
        }

        [Fact]
        public void GetEventById_ExistingId_ShouldReturnEvent()
        {
            // Arrange
            var event1 = new EventBuilder().Build();
            _sut.AddEvent(event1);

            // Act
            var result = _sut.GetEventById(event1.Id);

            // Assert
            result.Should().NotBeNull();
            result.Should().Be(event1);
        }

        [Fact]
        public void GetEventById_NonExistingId_ShouldReturnNull()
        {
            // Act
            var result = _sut.GetEventById(999);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void AddEvent_ValidEvent_ShouldAddWithIncrementingId()
        {
            // Arrange
            var event1 = new EventBuilder().Build();
            var event2 = new EventBuilder().Build();

            // Act
            _sut.AddEvent(event1);
            _sut.AddEvent(event2);

            // Assert
            event1.Id.Should().Be(1);
            event2.Id.Should().Be(2);
            _sut.GetEventCount().Should().Be(2);
        }

        [Fact]
        public void AddEvent_NullEvent_ShouldThrowValidationException()
        {
            // Act & Assert
            var act = () => _sut.AddEvent(null!);
            
            act.Should().Throw<ValidationException>()
                .WithMessage("Event cannot be null");
        }

        [Fact]
        public void UpdateEvent_ExistingEvent_ShouldUpdateSuccessfully()
        {
            // Arrange
            var originalEvent = new EventBuilder()
                .WithTitle("Original Title")
                .Build();
            _sut.AddEvent(originalEvent);
            var eventId = originalEvent.Id;

            var updatedEvent = new EventBuilder()
                .WithTitle("Updated Title")
                .WithDescription("Updated Description")
                .Build();

            // Act
            var result = _sut.UpdateEvent(eventId, updatedEvent);

            // Assert
            result.Should().BeTrue();
            var retrievedEvent = _sut.GetEventById(eventId);
            retrievedEvent!.Title.Should().Be("Updated Title");
            retrievedEvent.Description.Should().Be("Updated Description");
            retrievedEvent.Id.Should().Be(eventId); // ID should remain the same
        }

        [Fact]
        public void UpdateEvent_NonExistingEvent_ShouldReturnFalse()
        {
            // Arrange
            var updatedEvent = new EventBuilder().Build();

            // Act
            var result = _sut.UpdateEvent(999, updatedEvent);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void UpdateEvent_NullEvent_ShouldThrowValidationException()
        {
            // Act & Assert
            var act = () => _sut.UpdateEvent(1, null!);
            
            act.Should().Throw<ValidationException>()
                .WithMessage("Updated event cannot be null");
        }

        [Fact]
        public void DeleteEvent_ExistingEvent_ShouldDeleteSuccessfully()
        {
            // Arrange
            var event1 = new EventBuilder().Build();
            _sut.AddEvent(event1);
            var eventId = event1.Id;

            // Act
            var result = _sut.DeleteEvent(eventId);

            // Assert
            result.Should().BeTrue();
            _sut.GetEventById(eventId).Should().BeNull();
            _sut.GetEventCount().Should().Be(0);
        }

        [Fact]
        public void DeleteEvent_NonExistingEvent_ShouldReturnFalse()
        {
            // Act
            var result = _sut.DeleteEvent(999);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("10:00", 60, "10:30", 60, true)]  // Partial overlap
        [InlineData("10:00", 60, "11:00", 60, false)] // Adjacent, no overlap
        [InlineData("10:00", 60, "09:00", 60, false)] // Before, no overlap
        [InlineData("10:00", 120, "11:00", 60, true)] // Contained within
        [InlineData("10:00", 60, "10:00", 60, true)]  // Exact same time
        public void DoesEventOverlap_VariousScenarios_ShouldDetectCorrectly(
            string existingTime, int existingDuration, 
            string newTime, int newDuration, 
            bool expectedOverlap)
        {
            // Arrange
            var date = DateTime.Today.AddDays(1);
            var existingEvent = new EventBuilder()
                .WithDate(date)
                .WithTime(existingTime)
                .WithDuration(existingDuration)
                .Build();
            _sut.AddEvent(existingEvent);

            var newEvent = new EventBuilder()
                .WithDate(date)
                .WithTime(newTime)
                .WithDuration(newDuration)
                .Build();

            // Act
            var result = _sut.DoesEventOverlap(newEvent);

            // Assert
            result.Should().Be(expectedOverlap);
        }

        [Fact]
        public void DoesEventOverlap_DifferentDays_ShouldNotOverlap()
        {
            // Arrange
            var existingEvent = new EventBuilder()
                .WithDate(DateTime.Today)
                .WithTime("10:00")
                .Build();
            _sut.AddEvent(existingEvent);

            var newEvent = new EventBuilder()
                .WithDate(DateTime.Today.AddDays(1))
                .WithTime("10:00")
                .Build();

            // Act
            var result = _sut.DoesEventOverlap(newEvent);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void DoesEventOverlap_WithExcludeId_ShouldIgnoreSpecifiedEvent()
        {
            // Arrange
            var event1 = new EventBuilder()
                .WithDate(DateTime.Today)
                .WithTime("10:00")
                .Build();
            _sut.AddEvent(event1);

            // Check if the same event overlaps with itself (should when not excluded)
            var checkEvent = new EventBuilder()
                .WithDate(DateTime.Today)
                .WithTime("10:00")
                .Build();

            // Act & Assert
            _sut.DoesEventOverlap(checkEvent).Should().BeTrue();
            _sut.DoesEventOverlap(checkEvent, event1.Id).Should().BeFalse();
        }

        [Fact]
        public async Task ConcurrentOperations_ShouldBeThreadSafe()
        {
            // Arrange
            var tasks = new List<Task>();
            var eventCount = 100;

            // Act - Add events concurrently
            for (int i = 0; i < eventCount; i++)
            {
                tasks.Add(Task.Run(() =>
                {
                    var evt = new EventBuilder().AsRandomEvent().Build();
                    _sut.AddEvent(evt);
                }));
            }

            await Task.WhenAll(tasks);

            // Assert
            _sut.GetEventCount().Should().Be(eventCount);
            
            // All events should have unique IDs
            var allEvents = _sut.GetAllEvents();
            var uniqueIds = allEvents.Select(e => e.Id).Distinct().Count();
            uniqueIds.Should().Be(eventCount);
        }

        [Fact]
        public void InitializeNextId_ShouldSetStartingId()
        {
            // Arrange
            _sut.InitializeNextId(100);

            // Act
            var event1 = new EventBuilder().Build();
            _sut.AddEvent(event1);

            // Assert
            event1.Id.Should().Be(101);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("invalid:time")]
        [InlineData("25:00")]
        [InlineData("12:60")]
        public void DoesEventOverlap_InvalidTimeFormat_ShouldHandleGracefully(string invalidTime)
        {
            // Arrange
            var existingEvent = new EventBuilder()
                .WithTime("10:00")
                .Build();
            _sut.AddEvent(existingEvent);

            var newEvent = new EventBuilder()
                .WithTime(invalidTime ?? "")
                .Build();

            // Act & Assert - Should not throw
            var result = _sut.DoesEventOverlap(newEvent);
            result.Should().BeFalse();
        }

        [Fact]
        public void GetEventCount_ShouldReturnCorrectCount()
        {
            // Arrange & Act
            _sut.GetEventCount().Should().Be(0);
            
            _sut.AddEvent(new EventBuilder().Build());
            _sut.GetEventCount().Should().Be(1);
            
            _sut.AddEvent(new EventBuilder().Build());
            _sut.GetEventCount().Should().Be(2);
            
            _sut.DeleteEvent(1);
            _sut.GetEventCount().Should().Be(1);
        }
    }
}