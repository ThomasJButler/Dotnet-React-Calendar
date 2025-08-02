using DotNetCalendarAPI.Models;
using Bogus;

namespace DotNetCalendarAPI.Tests.Builders
{
    public class EventBuilder
    {
        private readonly Faker<Event> _faker;
        private readonly Event _event;

        public EventBuilder()
        {
            _event = new Event
            {
                Title = "Default Event",
                Date = DateTime.Today.AddDays(7),
                Time = "14:00",
                Description = "Default description",
                Duration = 60
            };

            _faker = new Faker<Event>()
                .RuleFor(e => e.Title, f => f.Lorem.Sentence(3))
                .RuleFor(e => e.Date, f => f.Date.Future(30))
                .RuleFor(e => e.Time, f => $"{f.Random.Int(8, 17):D2}:{f.Random.Int(0, 59):D2}")
                .RuleFor(e => e.Description, f => f.Lorem.Paragraph())
                .RuleFor(e => e.Duration, f => f.Random.Int(15, 180));
        }

        public EventBuilder WithId(int id)
        {
            _event.Id = id;
            return this;
        }

        public EventBuilder WithTitle(string title)
        {
            _event.Title = title;
            return this;
        }

        public EventBuilder WithDate(DateTime date)
        {
            _event.Date = date;
            return this;
        }

        public EventBuilder WithTime(string time)
        {
            _event.Time = time;
            return this;
        }

        public EventBuilder WithDescription(string description)
        {
            _event.Description = description;
            return this;
        }

        public EventBuilder WithDuration(int duration)
        {
            _event.Duration = duration;
            return this;
        }

        public EventBuilder WithoutTitle()
        {
            _event.Title = string.Empty;
            return this;
        }

        public EventBuilder WithoutTime()
        {
            _event.Time = string.Empty;
            return this;
        }

        public EventBuilder AsRandomEvent()
        {
            var randomEvent = _faker.Generate();
            _event.Title = randomEvent.Title;
            _event.Date = randomEvent.Date;
            _event.Time = randomEvent.Time;
            _event.Description = randomEvent.Description;
            _event.Duration = randomEvent.Duration;
            return this;
        }

        public Event Build() => _event;

        public List<Event> BuildMany(int count)
        {
            return _faker.Generate(count);
        }

        public static implicit operator Event(EventBuilder builder) => builder.Build();
    }
}