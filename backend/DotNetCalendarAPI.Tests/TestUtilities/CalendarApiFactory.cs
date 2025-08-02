using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using DotNetCalendarAPI.Services;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace DotNetCalendarAPI.Tests.TestUtilities
{
    public class CalendarApiFactory : WebApplicationFactory<Program>
    {
        private EventService? _sharedEventService;
        
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove the existing EventService registration
                services.RemoveAll<EventService>();

                // Add EventService as singleton for testing to ensure same instance
                services.AddSingleton<EventService>(provider =>
                {
                    if (_sharedEventService == null)
                    {
                        var logger = provider.GetRequiredService<ILogger<EventService>>();
                        _sharedEventService = new EventService(logger);
                        _sharedEventService.InitializeNextId(0);
                    }
                    return _sharedEventService;
                });

                // Configure test-specific services
                services.Configure<TestOptions>(options =>
                {
                    options.DisableRateLimiting = true;
                });
            });

            builder.ConfigureLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddConsole();
                logging.SetMinimumLevel(LogLevel.Warning);
            });

            builder.UseEnvironment("Testing");
        }
        
        public void ResetEventService()
        {
            _sharedEventService = null;
        }
    }

    public class TestOptions
    {
        public bool DisableRateLimiting { get; set; }
    }
}