using System.Text.Json.Serialization;
using AWOLCalendarAPI.Models;

namespace AWOLCalendarAPI.Models.Requests
{
    public class CreateEventRequest
    {
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("date")]
        public string DateString { get; set; } = string.Empty;
        
        public string Time { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public Event ToEvent()
        {
            // Parse the ISO string to local DateTime
            var date = DateTime.Parse(DateString).ToLocalTime();
            
            return new Event
            {
                Title = Title,
                Date = date,
                Time = Time,
                Description = Description
            };
        }
    }
}
