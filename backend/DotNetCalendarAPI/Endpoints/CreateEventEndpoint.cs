using FastEndpoints;
using DotNetCalendarAPI.Models.Requests;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Validators;

namespace DotNetCalendarAPI.Endpoints
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
            
            // Check for overlapping events
            if (_eventService.DoesEventOverlap(newEvent))
            {
                AddError("Event overlaps with an existing event");
                await SendErrorsAsync(400, cancellation: ct);
                return;
            }
            
            _eventService.AddEvent(newEvent);

            await SendCreatedAtAsync<GetEventByIdEndpoint>(
                new { Id = newEvent.Id },
                EventResponse.FromEvent(newEvent),
                cancellation: ct);
        }
    }
}
