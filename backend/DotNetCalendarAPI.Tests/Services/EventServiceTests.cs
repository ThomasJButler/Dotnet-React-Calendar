using System;
using Xunit;
using FluentAssertions;

namespace AWOLCalendarAPI.Tests.Services
{
    public class EventServiceTests
    {
        [Fact]
        public void SimpleTest_ShouldPass()
        {
            // Arrange
            var value = 1;
            
            // Act
            var result = value + 1;
            
            // Assert
            result.Should().Be(2);
        }
    }
}
