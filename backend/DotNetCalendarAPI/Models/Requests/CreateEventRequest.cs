/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Request model for creating calendar events
/// </summary>
using System.Text.Json.Serialization;
using DotNetCalendarAPI.Models;

namespace DotNetCalendarAPI.Models.Requests
{
    public class CreateEventRequest
    {
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("date")]
        public string DateString { get; set; } = string.Empty;
        
        public string Time { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Duration { get; set; } = 60;

        public Event ToEvent()
        {
            var date = DateTime.Parse(DateString).ToLocalTime();
            
            return new Event
            {
                Title = Title,
                Date = date,
                Time = Time,
                Description = Description,
                Duration = Duration
            };
        }
    }
}
