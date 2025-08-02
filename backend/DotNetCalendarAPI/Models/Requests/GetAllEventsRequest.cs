namespace DotNetCalendarAPI.Models.Requests
{
    public class GetAllEventsRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public DateTime? Date { get; set; }
    }
}