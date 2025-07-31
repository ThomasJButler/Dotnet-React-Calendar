using FastEndpoints;
using DotNetCalendarAPI.Models.Requests;
using DotNetCalendarAPI.Models.Responses;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Infrastructure.Exceptions;

namespace DotNetCalendarAPI.Endpoints
{
    public class BulkCreateEventsEndpoint : Endpoint<BulkCreateEventsRequest, BulkCreateEventsResponse>
    {
        private readonly EventService _eventService;
        private readonly ILogger<BulkCreateEventsEndpoint> _logger;

        public BulkCreateEventsEndpoint(EventService eventService, ILogger<BulkCreateEventsEndpoint> logger)
        {
            _eventService = eventService;
            _logger = logger;
        }

        public override void Configure()
        {
            Post("/events/bulk");
            AllowAnonymous();
            Description(b => b
                .Produces<BulkCreateEventsResponse>(200, "application/json")
                .Produces<ProblemDetailsResponse>(400, "application/problem+json")
                .WithTags("Events")
                .WithSummary("Bulk create events")
                .WithDescription("Create multiple calendar events in a single request"));
        }

        public override async Task HandleAsync(BulkCreateEventsRequest req, CancellationToken ct)
        {
            if (req.Events == null || !req.Events.Any())
            {
                throw new ValidationException("At least one event must be provided");
            }

            if (req.Events.Count > 100)
            {
                throw new ValidationException("Cannot create more than 100 events in a single request");
            }

            var results = new List<BulkOperationResult>();
            var successCount = 0;

            for (int i = 0; i < req.Events.Count; i++)
            {
                var eventRequest = req.Events[i];
                var result = new BulkOperationResult { Index = i };

                try
                {
                    // Validate event
                    if (string.IsNullOrEmpty(eventRequest.Title))
                    {
                        result.Success = false;
                        result.Error = "Title is required";
                        results.Add(result);
                        continue;
                    }

                    var newEvent = eventRequest.ToEvent();

                    // Check for overlaps
                    if (_eventService.DoesEventOverlap(newEvent))
                    {
                        result.Success = false;
                        result.Error = "Event overlaps with an existing event";
                        results.Add(result);
                        continue;
                    }

                    _eventService.AddEvent(newEvent);
                    result.Success = true;
                    result.EventId = newEvent.Id;
                    successCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating event at index {Index}", i);
                    result.Success = false;
                    result.Error = "Failed to create event";
                }

                results.Add(result);
            }

            var response = new BulkCreateEventsResponse
            {
                TotalRequested = req.Events.Count,
                SuccessCount = successCount,
                FailureCount = req.Events.Count - successCount,
                Results = results
            };

            await SendOkAsync(response, ct);
        }
    }

    public class BulkCreateEventsRequest
    {
        public List<CreateEventRequest> Events { get; set; } = new();
    }

    public class BulkCreateEventsResponse
    {
        public int TotalRequested { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<BulkOperationResult> Results { get; set; } = new();
    }

    public class BulkOperationResult
    {
        public int Index { get; set; }
        public bool Success { get; set; }
        public int? EventId { get; set; }
        public string? Error { get; set; }
    }
}