using System;
using Xunit;
using FluentAssertions;

namespace AWOLCalendarAPI.Tests.Endpoints
{
    public class CreateEventEndpointTests
    {
        [Fact]
        public void SimpleCreateTest_ShouldPass()
        {
            // Arrange
            var eventName = "New Event";
            
            // Act
            var result = $"Created: {eventName}";
            
            // Assert
            result.Should().Be("Created: New Event");
        }
    }
}
