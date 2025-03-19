using AWOLCalendarAPI.Models;

namespace AWOLCalendarAPI.Models.Requests
{
    public class CreateEventRequest
    {
        public string Title { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public Event ToEvent()
        {
            return new Event
            {
                Title = Title,
                Date = Date,
                Time = Time,
                Description = Description
            };
        }
    }
}
