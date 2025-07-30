using FastEndpoints;
using DotNetCalendarAPI.Models;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Services;

namespace DotNetCalendarAPI.Endpoints
{
    public class GetAllEventsEndpoint : EndpointWithoutRequest<List<EventResponse>>
    {
        private readonly EventService _eventService;

        public GetAllEventsEndpoint(EventService eventService)
        {
            _eventService = eventService;
        }

        public override void Configure()
        {
            Get("/events");
            AllowAnonymous();
            Description(b => b
                .Produces<List<EventResponse>>(200, "application/json")
                .WithTags("Events"));
        }

        public override Task HandleAsync(CancellationToken ct)
        {
            var events = _eventService.GetAllEvents();
            var response = events.Select(EventResponse.FromEvent).ToList();
            return SendAsync(response, cancellation: ct);
        }
    }
}
