/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Request model for retrieving events with pagination and filtering
/// </summary>
namespace DotNetCalendarAPI.Models.Requests
{
    public class GetAllEventsRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public DateTime? Date { get; set; }
    }
}