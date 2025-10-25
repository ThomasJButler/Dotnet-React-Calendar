/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Thread-safe event management service using ConcurrentDictionary.
///              Handles CRUD operations, overlap detection, and ID generation.
/// </summary>

using System.Collections.Generic;
using System.Linq;
using DotNetCalendarAPI.Models;
using DotNetCalendarAPI.Infrastructure.Exceptions;
using System.Collections.Concurrent;

namespace DotNetCalendarAPI.Services
{
    public class EventService
    {
        private readonly ConcurrentDictionary<int, Event> _events = new();
        private readonly ILogger<EventService> _logger;
        private int _nextId = 1;

        public EventService(ILogger<EventService> logger)
        {
            _logger = logger;
        }


        public List<Event> GetAllEvents()
        {
            _logger.LogInformation("Retrieving all events. Count: {Count}", _events.Count);
            return _events.Values.OrderBy(e => e.Date).ThenBy(e => e.Time).ToList();
        }

        public Event? GetEventById(int id)
        {
            _logger.LogInformation("Retrieving event with ID: {Id}", id);
            _events.TryGetValue(id, out var eventItem);
            
            if (eventItem == null)
            {
                _logger.LogWarning("Event with ID {Id} not found", id);
            }
            
            return eventItem;
        }

        /// <summary>
        /// Detects if an event overlaps with existing events on the same day
        /// </summary>
        /// <param name="eventToCheck">The event to check for overlaps</param>
        /// <param name="excludeEventId">Event ID to exclude from check (used when updating existing events)</param>
        /// <returns>True if overlap detected, false otherwise</returns>
        public bool DoesEventOverlap(Event eventToCheck, int? excludeEventId = null)
        {
            var eventTime = TimeSpan.Zero;
            if (!string.IsNullOrEmpty(eventToCheck.Time))
            {
                var timeParts = eventToCheck.Time.Split(':');
                if (timeParts.Length >= 2 && int.TryParse(timeParts[0], out int hours) && int.TryParse(timeParts[1], out int minutes))
                {
                    eventTime = new TimeSpan(hours, minutes, 0);
                }
            }

            // Default to 60 minutes if duration not specified
            var durationMinutes = eventToCheck.Duration > 0 ? eventToCheck.Duration : 60;
            var eventStart = eventToCheck.Date.Date.Add(eventTime);
            var eventEnd = eventStart.AddMinutes(durationMinutes);

            var hasOverlap = _events.Values.Any(e =>
                e.Id != (excludeEventId ?? -1) &&
                e.Date.Date == eventToCheck.Date.Date &&
                !string.IsNullOrEmpty(e.Time) &&
                ConvertTimeStringToDateTime(e.Date, e.Time, out DateTime otherEventStart) &&
                (otherEventStart < eventEnd &&
                 otherEventStart.AddMinutes(e.Duration > 0 ? e.Duration : 60) > eventStart)
            );

            if (hasOverlap)
            {
                _logger.LogInformation("Event overlap detected for event on {Date} at {Time}", 
                    eventToCheck.Date.ToShortDateString(), eventToCheck.Time);
            }

            return hasOverlap;
        }

        /// <summary>
        /// Converts time string (HH:mm format) to DateTime for overlap calculations
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
            if (newEvent == null)
            {
                throw new ValidationException("Event cannot be null");
            }

            newEvent.Id = System.Threading.Interlocked.Increment(ref _nextId);
            
            if (!_events.TryAdd(newEvent.Id, newEvent))
            {
                _logger.LogError("Failed to add event with ID {Id}", newEvent.Id);
                throw new ApiException(500, "Failed to add event", "ADD_EVENT_FAILED");
            }

            _logger.LogInformation("Event added successfully. ID: {Id}, Title: {Title}", 
                newEvent.Id, newEvent.Title);
        }

        public bool UpdateEvent(int id, Event updatedEvent)
        {
            if (updatedEvent == null)
            {
                throw new ValidationException("Updated event cannot be null");
            }

            if (!_events.TryGetValue(id, out var existingEvent))
            {
                _logger.LogWarning("Attempted to update non-existent event with ID {Id}", id);
                return false;
            }

            var newEvent = new Event
            {
                Id = id,
                Title = updatedEvent.Title,
                Date = updatedEvent.Date,
                Time = updatedEvent.Time,
                Description = updatedEvent.Description,
                Duration = updatedEvent.Duration
            };

            if (_events.TryUpdate(id, newEvent, existingEvent))
            {
                _logger.LogInformation("Event updated successfully. ID: {Id}, Title: {Title}", 
                    id, updatedEvent.Title);
                return true;
            }

            _logger.LogError("Failed to update event with ID {Id}", id);
            return false;
        }

        public bool DeleteEvent(int id)
        {
            if (_events.TryRemove(id, out var removedEvent))
            {
                _logger.LogInformation("Event deleted successfully. ID: {Id}, Title: {Title}", 
                    id, removedEvent.Title);
                return true;
            }

            _logger.LogWarning("Attempted to delete non-existent event with ID {Id}", id);
            return false;
        }

        public int GetEventCount() => _events.Count;

        public void InitializeNextId(int startId)
        {
            _nextId = startId;
        }
    }
}
