using FastEndpoints;
using AWOLCalendarAPI.Models.Responses;
using AWOLCalendarAPI.Services;

namespace AWOLCalendarAPI.Endpoints
{
    public class GetEventByIdEndpoint : Endpoint<GetEventByIdRequest, EventResponse>
    {
        private readonly EventService _eventService;

        public GetEventByIdEndpoint(EventService eventService)
        {
            _eventService = eventService;
        }

        public override void Configure()
        {
            Get("/events/{Id}");
            AllowAnonymous();
            Description(b => b
                .Produces<EventResponse>(200, "application/json")
                .Produces(404)
                .WithTags("Events"));
        }

        public override async Task HandleAsync(GetEventByIdRequest req, CancellationToken ct)
        {
            var evt = _eventService.GetEventById(req.Id);

            if (evt == null)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            await SendAsync(EventResponse.FromEvent(evt), cancellation: ct);
        }
    }

    public class GetEventByIdRequest
    {
        public int Id { get; set; }
    }
}
