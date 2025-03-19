using System;
using System.Collections.Generic;
using System.Linq;
using AWOLCalendarAPI.Models;

namespace AWOLCalendarAPI.Services
{
    public static class SampleDataService
    {
        public static List<Event> GetSampleEvents()
        {
            var events = new List<Event>
            {
                // January 2025 events
                new Event
                {
                    Title = "New Year's Day",
                    Date = new DateTime(2025, 1, 1),
                    Time = "09:00",
                    Description = "Start the year with a morning walk in Hyde Park"
                },
                new Event
                {
                    Title = "Team planning meeting",
                    Date = new DateTime(2025, 1, 6),
                    Time = "10:00",
                    Description = "Q1 goals and strategy planning"
                },
                new Event
                {
                    Title = "Coffee with Sarah",
                    Date = new DateTime(2025, 1, 8),
                    Time = "13:30",
                    Description = "Catch up at Costa in Central London"
                },
                new Event
                {
                    Title = "Gym session",
                    Date = new DateTime(2025, 1, 10),
                    Time = "18:00",
                    Description = "Upper body workout"
                },
                new Event
                {
                    Title = "Dentist appointment",
                    Date = new DateTime(2025, 1, 15),
                    Time = "09:30",
                    Description = "Regular checkup at Bright Smiles Dental"
                },
                new Event
                {
                    Title = "Book club meeting",
                    Date = new DateTime(2025, 1, 18),
                    Time = "19:00",
                    Description = "Discussing 'The Midnight Library' at Jen's house"
                },
                new Event
                {
                    Title = "MOT for car",
                    Date = new DateTime(2025, 1, 22),
                    Time = "11:00",
                    Description = "At Kwik Fit on Oxford Road"
                },
                new Event
                {
                    Title = "Cinema night",
                    Date = new DateTime(2025, 1, 25),
                    Time = "20:15",
                    Description = "Watching the new Marvel film at Odeon"
                },
                new Event
                {
                    Title = "Online course",
                    Date = new DateTime(2025, 1, 28),
                    Time = "18:30",
                    Description = "JavaScript advanced techniques module"
                },
                
                // February 2025 events
                new Event
                {
                    Title = "Monthly review",
                    Date = new DateTime(2025, 2, 1),
                    Time = "14:00",
                    Description = "Review of January performance metrics"
                },
                new Event
                {
                    Title = "Mum's birthday",
                    Date = new DateTime(2025, 2, 3),
                    Time = "18:30",
                    Description = "Dinner at The Ivy - remember to bring present!"
                },
                new Event
                {
                    Title = "Gym session",
                    Date = new DateTime(2025, 2, 5),
                    Time = "07:30",
                    Description = "Leg day"
                },
                new Event
                {
                    Title = "Team workshop",
                    Date = new DateTime(2025, 2, 7),
                    Time = "10:00",
                    Description = "New product feature brainstorming"
                },
                new Event
                {
                    Title = "Doctor appointment",
                    Date = new DateTime(2025, 2, 10),
                    Time = "16:15",
                    Description = "Annual check-up at GP surgery"
                },
                new Event
                {
                    Title = "Valentine's dinner",
                    Date = new DateTime(2025, 2, 14),
                    Time = "19:30",
                    Description = "Dinner reservation at Gordon Ramsay's"
                },
                new Event
                {
                    Title = "Weekly shopping",
                    Date = new DateTime(2025, 2, 15),
                    Time = "10:00",
                    Description = "Sainsbury's run for groceries"
                },
                new Event
                {
                    Title = "Meeting with financial advisor",
                    Date = new DateTime(2025, 2, 18),
                    Time = "14:30",
                    Description = "Discuss investment strategy for the year"
                },
                new Event
                {
                    Title = "Gym session",
                    Date = new DateTime(2025, 2, 20),
                    Time = "18:00",
                    Description = "Upper body and cardio"
                },
                new Event
                {
                    Title = "Weekend getaway",
                    Date = new DateTime(2025, 2, 22),
                    Time = "09:00",
                    Description = "Trip to the Lake District - check out by 11am"
                },
                new Event
                {
                    Title = "Car service",
                    Date = new DateTime(2025, 2, 26),
                    Time = "08:30",
                    Description = "Regular service at dealership"
                },
                new Event
                {
                    Title = "Online coding bootcamp",
                    Date = new DateTime(2025, 2, 28),
                    Time = "18:00",
                    Description = "Final project presentation"
                },
                
                // March 2025 events
                new Event
                {
                    Title = "Monthly review",
                    Date = new DateTime(2025, 3, 1),
                    Time = "14:00",
                    Description = "Review of February metrics and targets"
                },
                new Event
                {
                    Title = "Team lunch",
                    Date = new DateTime(2025, 3, 3),
                    Time = "12:30",
                    Description = "Welcoming new team members at Pizza Express"
                },
                new Event
                {
                    Title = "Gym session",
                    Date = new DateTime(2025, 3, 5),
                    Time = "07:30",
                    Description = "Full body workout"
                },
                new Event
                {
                    Title = "Charity run",
                    Date = new DateTime(2025, 3, 8),
                    Time = "09:00",
                    Description = "10K run for Cancer Research UK"
                },
                new Event
                {
                    Title = "Project deadline",
                    Date = new DateTime(2025, 3, 10),
                    Time = "17:00",
                    Description = "Final submission for client website"
                },
                new Event
                {
                    Title = "Theatre tickets",
                    Date = new DateTime(2025, 3, 12),
                    Time = "19:30",
                    Description = "Hamilton at Victoria Palace Theatre"
                },
                new Event
                {
                    Title = "House viewing",
                    Date = new DateTime(2025, 3, 15),
                    Time = "11:00",
                    Description = "Property viewing in Richmond area"
                },
                new Event
                {
                    Title = "Mother's Day lunch",
                    Date = new DateTime(2025, 3, 16),
                    Time = "13:00",
                    Description = "Lunch at The Shard restaurant"
                },
                new Event
                {
                    Title = "Dentist appointment",
                    Date = new DateTime(2025, 3, 19),
                    Time = "14:30",
                    Description = "Regular checkup and cleaning"
                },
                // Add multiple events on the same day to test busy day color coding
                new Event
                {
                    Title = "Team meeting",
                    Date = new DateTime(2025, 3, 19),
                    Time = "10:00",
                    Description = "Sprint planning and task assignment"
                },
                new Event
                {
                    Title = "Gym session",
                    Date = new DateTime(2025, 3, 19),
                    Time = "18:00",
                    Description = "Lower body focus"
                },
                new Event
                {
                    Title = "Dinner with friends",
                    Date = new DateTime(2025, 3, 19),
                    Time = "20:00",
                    Description = "Catching up at Nando's"
                }
            };

            return events;
        }

        public static void InitializeEvents(EventService eventService)
        {
            var events = GetSampleEvents();
            foreach (var evt in events)
            {
                eventService.AddEvent(evt);
            }
        }
    }
}
