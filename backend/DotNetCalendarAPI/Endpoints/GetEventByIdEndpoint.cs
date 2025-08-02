using FastEndpoints;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Infrastructure.Exceptions;
using Microsoft.AspNetCore.Http;

namespace DotNetCalendarAPI.Endpoints
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
                .Produces<ProblemDetailsResponse>(404, "application/problem+json")
                .WithTags("Events")
                .WithSummary("Get event by ID")
                .WithDescription("Retrieves a specific calendar event by its unique identifier"));
        }

        public override async Task HandleAsync(GetEventByIdRequest req, CancellationToken ct)
        {
            var evt = _eventService.GetEventById(req.Id);
            
            if (evt == null)
            {
                throw new NotFoundException($"Event with ID {req.Id} not found", 
                    new { eventId = req.Id });
            }
            
            // Add ETag for caching
            var etag = $"\"{evt.Id}-{evt.Title.GetHashCode()}-{evt.Date.Ticks}\"";
            HttpContext.Response.Headers.Append("ETag", etag);
            HttpContext.Response.Headers.Append("Cache-Control", "private, max-age=300");
            
            // Check if client has cached version
            if (HttpContext.Request.Headers.IfNoneMatch == etag)
            {
                await SendNoContentAsync(ct);
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
