/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Generic paginated response wrapper for API collections
/// </summary>
namespace DotNetCalendarAPI.Models.Responses
{
    public class PaginatedResponse<T>
    {
        public List<T> Data { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNext { get; set; }
        public bool HasPrevious { get; set; }
    }
}