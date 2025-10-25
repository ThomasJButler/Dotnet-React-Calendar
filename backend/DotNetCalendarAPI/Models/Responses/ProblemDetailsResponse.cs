/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: RFC 7807 problem details response model for error handling
/// </summary>
namespace DotNetCalendarAPI.Models.Responses
{
    public class ProblemDetailsResponse
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int? Status { get; set; }
        public string Detail { get; set; } = string.Empty;
        public string Instance { get; set; } = string.Empty;
        public Dictionary<string, object?>? Extensions { get; set; }
    }
}