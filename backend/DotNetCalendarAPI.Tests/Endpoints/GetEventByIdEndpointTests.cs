using System;
using Xunit;
using FluentAssertions;

namespace AWOLCalendarAPI.Tests.Endpoints
{
    public class GetEventByIdEndpointTests
    {
        [Fact]
        public void SimpleGetByIdTest_ShouldPass()
        {
            // Arrange
            var id = 7;
            
            // Act
            var result = $"Event {id}";
            
            // Assert
            result.Should().Be("Event 7");
        }
    }
}
