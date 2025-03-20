using AWOLCalendarAPI.Models;

namespace AWOLCalendarAPI.Models.Responses
{
    public class EventResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Duration { get; set; } = 60;

        public static EventResponse FromEvent(Event evt)
        {
            return new EventResponse
            {
                Id = evt.Id,
                Title = evt.Title,
                Date = evt.Date,
                Time = evt.Time,
                Description = evt.Description,
                Duration = evt.Duration
            };
        }
    }
}
