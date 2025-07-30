namespace DotNetCalendarAPI.Models
{
    public class Event
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        
        // Duration in minutes (default to 60 minutes / 1 hour)
        public int Duration { get; set; } = 60;
    }
}
