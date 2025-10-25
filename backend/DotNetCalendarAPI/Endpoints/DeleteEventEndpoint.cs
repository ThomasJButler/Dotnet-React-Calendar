/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: FastEndpoint for deleting calendar events by ID.
/// </summary>

using FastEndpoints;
using DotNetCalendarAPI.Services;

namespace DotNetCalendarAPI.Endpoints
{
    public class DeleteEventEndpoint : Endpoint<DeleteEventRequest, EmptyResponse>
    {
        private readonly EventService _eventService;

        public DeleteEventEndpoint(EventService eventService)
        {
            _eventService = eventService;
        }

        public override void Configure()
        {
            Delete("/events/{Id}");
            AllowAnonymous();
            Description(b => b
                .Produces(204)
                .Produces(404)
                .WithTags("Events"));
        }

        public override async Task HandleAsync(DeleteEventRequest req, CancellationToken ct)
        {
            var success = _eventService.DeleteEvent(req.Id);

            if (!success)
            {
                await SendNotFoundAsync(ct);
                return;
            }

            await SendNoContentAsync(ct);
        }
    }

    public class DeleteEventRequest
    {
        public int Id { get; set; }
    }

    public class EmptyResponse { }
}
