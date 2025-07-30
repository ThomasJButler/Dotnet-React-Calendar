using FastEndpoints;
using DotNetCalendarAPI.Models.Requests;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Validators;

namespace DotNetCalendarAPI.Endpoints
{
    public class UpdateEventEndpoint : Endpoint<UpdateEventRequest, EventResponse>
    {
        private readonly EventService _eventService;

        public UpdateEventEndpoint(EventService eventService)
        {
            _eventService = eventService;
        }

        public override void Configure()
        {
            Put("/events/{Id}");
            AllowAnonymous();
            Description(b => b
                .Produces<EventResponse>(200, "application/json")
                .Produces(400)
                .Produces(404)
                .WithTags("Events"));
            
            // Add validator
            Validator<UpdateEventValidator>();
        }

        public override async Task HandleAsync(UpdateEventRequest req, CancellationToken ct)
        {
            var eventToUpdate = req.ToEvent();
            
            // Check if the event exists
            var existingEvent = _eventService.GetEventById(req.Id);
            if (existingEvent == null)
            {
                await SendNotFoundAsync(ct);
                return;
            }
            
            // Check for overlapping events, excluding the current event
            if (_eventService.DoesEventOverlap(eventToUpdate, req.Id))
            {
                AddError("Event overlaps with an existing event");
                await SendErrorsAsync(400, cancellation: ct);
                return;
            }
            
            var success = _eventService.UpdateEvent(req.Id, eventToUpdate);

            if (!success)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            var updatedEvent = _eventService.GetEventById(req.Id);
            await SendOkAsync(EventResponse.FromEvent(updatedEvent!), ct);
        }
    }
}
