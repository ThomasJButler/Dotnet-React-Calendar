using FastEndpoints;
using AWOLCalendarAPI.Models.Requests;
using AWOLCalendarAPI.Models.Responses;
using AWOLCalendarAPI.Services;
using AWOLCalendarAPI.Validators;

namespace AWOLCalendarAPI.Endpoints
{
    public class CreateEventEndpoint : Endpoint<CreateEventRequest, EventResponse>
    {
        private readonly EventService _eventService;

        public CreateEventEndpoint(EventService eventService)
        {
            _eventService = eventService;
        }

        public override void Configure()
        {
            Post("/events");
            AllowAnonymous();
            Description(b => b
                .Produces<EventResponse>(201, "application/json")
                .Produces(400)
                .WithTags("Events"));
            
            // Add validator
            Validator<CreateEventValidator>();
        }

        public override async Task HandleAsync(CreateEventRequest req, CancellationToken ct)
        {
            var newEvent = req.ToEvent();
            _eventService.AddEvent(newEvent);

            await SendCreatedAtAsync<GetEventByIdEndpoint>(
                new { Id = newEvent.Id },
                EventResponse.FromEvent(newEvent),
                cancellation: ct);
        }
    }
}
