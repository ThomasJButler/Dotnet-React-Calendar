using FastEndpoints;
using AWOLCalendarAPI.Models.Requests;
using AWOLCalendarAPI.Models.Responses;
using AWOLCalendarAPI.Services;
using AWOLCalendarAPI.Validators;

namespace AWOLCalendarAPI.Endpoints
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
            var success = _eventService.UpdateEvent(req.Id, req.ToEvent());

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
