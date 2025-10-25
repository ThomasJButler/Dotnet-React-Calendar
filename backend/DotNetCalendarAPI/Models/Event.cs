/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Domain model representing a calendar event with title, date, time, and duration.
/// </summary>

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
