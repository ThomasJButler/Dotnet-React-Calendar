using FastEndpoints;
using DotNetCalendarAPI.Models.Requests;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Services;

namespace DotNetCalendarAPI.Endpoints
{
    public class SearchEventsEndpoint : Endpoint<SearchEventsRequest, PaginatedResponse<EventResponse>>
    {
        private readonly EventService _eventService;

        public SearchEventsEndpoint(EventService eventService)
        {
            _eventService = eventService;
        }

        public override void Configure()
        {
            Get("/events/search");
            AllowAnonymous();
            Description(b => b
                .Produces<PaginatedResponse<EventResponse>>(200, "application/json")
                .WithTags("Events")
                .WithSummary("Search events")
                .WithDescription("Search calendar events with advanced filtering options"));
        }

        public override async Task HandleAsync(SearchEventsRequest req, CancellationToken ct)
        {
            var allEvents = _eventService.GetAllEvents();
            
            // Apply search filters
            var filteredEvents = allEvents.AsEnumerable();

            // Text search
            if (!string.IsNullOrWhiteSpace(req.Query))
            {
                var query = req.Query.ToLower();
                filteredEvents = filteredEvents.Where(e => 
                    e.Title.ToLower().Contains(query) || 
                    (e.Description?.ToLower().Contains(query) ?? false));
            }

            // Date range filter
            if (req.StartDate.HasValue)
            {
                filteredEvents = filteredEvents.Where(e => e.Date >= req.StartDate.Value);
            }

            if (req.EndDate.HasValue)
            {
                filteredEvents = filteredEvents.Where(e => e.Date <= req.EndDate.Value);
            }

            // Time of day filter
            if (!string.IsNullOrWhiteSpace(req.TimeOfDay))
            {
                filteredEvents = req.TimeOfDay.ToLower() switch
                {
                    "morning" => filteredEvents.Where(e => IsTimeBetween(e.Time, 6, 12)),
                    "afternoon" => filteredEvents.Where(e => IsTimeBetween(e.Time, 12, 18)),
                    "evening" => filteredEvents.Where(e => IsTimeBetween(e.Time, 18, 24)),
                    _ => filteredEvents
                };
            }

            // Duration filter
            if (req.MinDuration.HasValue)
            {
                filteredEvents = filteredEvents.Where(e => e.Duration >= req.MinDuration.Value);
            }

            if (req.MaxDuration.HasValue)
            {
                filteredEvents = filteredEvents.Where(e => e.Duration <= req.MaxDuration.Value);
            }

            var eventsList = filteredEvents.ToList();

            // Apply sorting
            eventsList = req.SortBy?.ToLower() switch
            {
                "date" => req.SortDescending ? 
                    eventsList.OrderByDescending(e => e.Date).ThenByDescending(e => e.Time).ToList() :
                    eventsList.OrderBy(e => e.Date).ThenBy(e => e.Time).ToList(),
                "title" => req.SortDescending ? 
                    eventsList.OrderByDescending(e => e.Title).ToList() :
                    eventsList.OrderBy(e => e.Title).ToList(),
                "duration" => req.SortDescending ? 
                    eventsList.OrderByDescending(e => e.Duration).ToList() :
                    eventsList.OrderBy(e => e.Duration).ToList(),
                _ => eventsList.OrderBy(e => e.Date).ThenBy(e => e.Time).ToList()
            };

            // Calculate pagination
            var totalCount = eventsList.Count;
            var totalPages = (int)Math.Ceiling(totalCount / (double)req.PageSize);
            
            // Apply pagination
            var paginatedEvents = eventsList
                .Skip((req.Page - 1) * req.PageSize)
                .Take(req.PageSize)
                .Select(EventResponse.FromEvent)
                .ToList();
            
            var response = new PaginatedResponse<EventResponse>
            {
                Data = paginatedEvents,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNext = req.Page < totalPages,
                HasPrevious = req.Page > 1
            };
            
            // Add search metadata headers
            HttpContext.Response.Headers.Append("X-Search-Query", req.Query ?? "");
            HttpContext.Response.Headers.Append("X-Total-Count", totalCount.ToString());
            
            await SendOkAsync(response, ct);
        }

        private static bool IsTimeBetween(string? time, int startHour, int endHour)
        {
            if (string.IsNullOrEmpty(time)) return false;
            
            var parts = time.Split(':');
            if (parts.Length >= 2 && int.TryParse(parts[0], out int hour))
            {
                return hour >= startHour && hour < endHour;
            }
            
            return false;
        }
    }

    public class SearchEventsRequest
    {
        public string? Query { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? TimeOfDay { get; set; } // morning, afternoon, evening
        public int? MinDuration { get; set; }
        public int? MaxDuration { get; set; }
        public string? SortBy { get; set; } = "date"; // date, title, duration
        public bool SortDescending { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}