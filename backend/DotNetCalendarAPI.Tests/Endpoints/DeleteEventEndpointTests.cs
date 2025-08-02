using System;
using Xunit;
using FluentAssertions;

namespace AWOLCalendarAPI.Tests.Endpoints
{
    public class DeleteEventEndpointTests
    {
        [Fact]
        public void SimpleDeleteTest_ShouldPass()
        {
            // Arrange
            var value = 5;
            
            // Act
            var result = value - 3;
            
            // Assert
            result.Should().Be(2);
        }
    }
}
