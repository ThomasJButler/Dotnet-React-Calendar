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
