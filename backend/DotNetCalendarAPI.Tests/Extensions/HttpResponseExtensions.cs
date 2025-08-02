using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using DotNetCalendarAPI.Models.Responses;
using FluentAssertions;

namespace DotNetCalendarAPI.Tests.Extensions
{
    public static class HttpResponseExtensions
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public static async Task<T> DeserializeContent<T>(this HttpResponseMessage response)
        {
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content, JsonOptions)!;
        }

        public static async Task<ProblemDetailsResponse> GetProblemDetails(this HttpResponseMessage response)
        {
            return await response.DeserializeContent<ProblemDetailsResponse>();
        }

        public static void ShouldHaveHeader(this HttpResponseMessage response, string headerName)
        {
            response.Headers.Should().ContainKey(headerName);
        }

        public static void ShouldHaveHeader(this HttpResponseMessage response, string headerName, string expectedValue)
        {
            response.Headers.Should().ContainKey(headerName);
            response.Headers.GetValues(headerName).Should().Contain(expectedValue);
        }

        public static void ShouldHaveCorrelationId(this HttpResponseMessage response)
        {
            response.ShouldHaveHeader("X-Correlation-Id");
        }

        public static void ShouldHavePaginationHeaders(this HttpResponseMessage response)
        {
            response.ShouldHaveHeader("X-Total-Count");
            response.ShouldHaveHeader("X-Page");
            response.ShouldHaveHeader("X-Page-Size");
        }
    }
}