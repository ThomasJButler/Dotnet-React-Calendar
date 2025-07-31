using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace DotNetCalendarAPI.Infrastructure.HealthChecks
{
    public class ApiHealthCheck : IHealthCheck
    {
        private readonly ILogger<ApiHealthCheck> _logger;

        public ApiHealthCheck(ILogger<ApiHealthCheck> logger)
        {
            _logger = logger;
        }

        public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            try
            {
                var data = new Dictionary<string, object>
                {
                    ["service"] = "DotNetCalendarAPI",
                    ["version"] = "1.0.0",
                    ["timestamp"] = DateTime.UtcNow
                };

                return Task.FromResult(HealthCheckResult.Healthy("API is healthy", data));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return Task.FromResult(HealthCheckResult.Unhealthy("API is unhealthy", ex));
            }
        }
    }
}