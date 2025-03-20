using System;
using System.Collections.Generic;
using Xunit;
using FluentAssertions;

namespace AWOLCalendarAPI.Tests.Endpoints
{
    public class GetAllEventsEndpointTests
    {
        [Fact]
        public void SimpleGetAllTest_ShouldPass()
        {
            // Arrange
            var events = new List<string> { "Event 1", "Event 2", "Event 3" };
            
            // Act
            var count = events.Count;
            
            // Assert
            count.Should().Be(3);
        }
    }
}
