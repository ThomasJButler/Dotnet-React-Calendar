using FastEndpoints;
using DotNetCalendarAPI.Models;
using DotNetCalendarAPI.Models.Requests;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Services;

namespace DotNetCalendarAPI.Endpoints
{
    public class GetAllEventsEndpoint : Endpoint<GetAllEventsRequest, PaginatedResponse<EventResponse>>
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
                .Produces<PaginatedResponse<EventResponse>>(200, "application/json")
                .WithTags("Events")
                .WithSummary("Get all events")
                .WithDescription("Retrieves all calendar events with optional pagination and filtering"));
        }

        public override async Task HandleAsync(GetAllEventsRequest req, CancellationToken ct)
        {
            // Validate and normalize pagination parameters
            req.Page = Math.Max(1, req.Page);
            req.PageSize = Math.Max(1, Math.Min(100, req.PageSize)); // Cap at 100 for performance
            
            var allEvents = _eventService.GetAllEvents();
            
            // Apply date filter if specified
            if (req.Date.HasValue)
            {
                allEvents = allEvents.Where(e => e.Date.Date == req.Date.Value.Date).ToList();
            }
            
            // Calculate pagination
            var totalCount = allEvents.Count;
            var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)req.PageSize));
            
            // Apply pagination
            var events = allEvents
                .Skip((req.Page - 1) * req.PageSize)
                .Take(req.PageSize)
                .Select(EventResponse.FromEvent)
                .ToList();
            
            var response = new PaginatedResponse<EventResponse>
            {
                Data = events,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNext = req.Page < totalPages,
                HasPrevious = req.Page > 1
            };
            
            // Add pagination headers
            HttpContext.Response.Headers.Append("X-Total-Count", totalCount.ToString());
            HttpContext.Response.Headers.Append("X-Page", req.Page.ToString());
            HttpContext.Response.Headers.Append("X-Page-Size", req.PageSize.ToString());
            
            await SendOkAsync(response, ct);
        }
    }
}
