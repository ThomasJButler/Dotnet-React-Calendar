using System.Collections.Generic;
using System.Linq;
using AWOLCalendarAPI.Models;

namespace AWOLCalendarAPI.Services
{
    public class EventService
    {
        private readonly List<Event> _events = new();

        public EventService()
        {
            // Add some sample events
            AddEvent(new Event
            {
                Title = "Team Meeting",
                Date = DateTime.Now.Date,
                Time = "10:00 AM",
                Description = "Weekly team sync-up meeting"
            });

            AddEvent(new Event
            {
                Title = "Project Deadline",
                Date = DateTime.Now.Date.AddDays(7),
                Time = "5:00 PM",
                Description = "Final submission for the AWOL Calendar project"
            });

            AddEvent(new Event
            {
                Title = "Lunch with Client",
                Date = DateTime.Now.Date.AddDays(2),
                Time = "12:30 PM",
                Description = "Discuss project requirements over lunch"
            });
        }

        public List<Event> GetAllEvents() => _events;

        public Event? GetEventById(int id) => _events.FirstOrDefault(e => e.Id == id);

        /// <summary>
        /// Checks if an event overlaps with existing events
        /// </summary>
        /// <param name="eventToCheck">The event to check for overlaps</param>
        /// <param name="excludeEventId">Optional ID of an event to exclude from the check (useful for updates)</param>
        /// <returns>True if the event overlaps with existing events, false otherwise</returns>
        public bool DoesEventOverlap(Event eventToCheck, int? excludeEventId = null)
        {
            // Convert event time to DateTime
            var eventTime = TimeSpan.Zero;
            if (!string.IsNullOrEmpty(eventToCheck.Time))
            {
                var timeParts = eventToCheck.Time.Split(':');
                if (timeParts.Length >= 2 && int.TryParse(timeParts[0], out int hours) && int.TryParse(timeParts[1], out int minutes))
                {
                    eventTime = new TimeSpan(hours, minutes, 0);
                }
            }

            // Assume each event lasts 1 hour
            var eventStart = eventToCheck.Date.Date.Add(eventTime);
            var eventEnd = eventStart.AddHours(1);

            // Check for overlaps with other events on the same day
            return _events.Any(e => 
                e.Id != (excludeEventId ?? -1) && // Exclude the event being updated
                e.Date.Date == eventToCheck.Date.Date && // Same day
                !string.IsNullOrEmpty(e.Time) && // Has a time
                ConvertTimeStringToDateTime(e.Date, e.Time, out DateTime otherEventStart) && // Successfully converted time
                ((eventStart <= otherEventStart.AddHours(1) && eventEnd >= otherEventStart) || // Event starts during other event
                (otherEventStart <= eventStart && otherEventStart.AddHours(1) >= eventStart)) // Other event starts during event
            );
        }

        /// <summary>
        /// Helper method to convert time string to DateTime
        /// </summary>
        private bool ConvertTimeStringToDateTime(DateTime date, string timeString, out DateTime result)
        {
            result = date;
            if (string.IsNullOrEmpty(timeString))
                return false;

            var timeParts = timeString.Split(':');
            if (timeParts.Length >= 2 && 
                int.TryParse(timeParts[0], out int hours) && 
                int.TryParse(timeParts[1], out int minutes))
            {
                result = date.Date.Add(new TimeSpan(hours, minutes, 0));
                return true;
            }

            return false;
        }

        public void AddEvent(Event newEvent)
        {
            newEvent.Id = _events.Count + 1;
            _events.Add(newEvent);
        }

        public bool UpdateEvent(int id, Event updatedEvent)
        {
            var existingEvent = GetEventById(id);
            if (existingEvent == null) return false;

            existingEvent.Title = updatedEvent.Title;
            existingEvent.Date = updatedEvent.Date;
            existingEvent.Time = updatedEvent.Time;
            existingEvent.Description = updatedEvent.Description;

            return true;
        }

        public bool DeleteEvent(int id)
        {
            var eventToRemove = GetEventById(id);
            return eventToRemove != null && _events.Remove(eventToRemove);
        }
    }
}
