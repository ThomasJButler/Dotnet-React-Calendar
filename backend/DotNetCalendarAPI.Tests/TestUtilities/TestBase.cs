using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using DotNetCalendarAPI.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.AspNetCore.Hosting;

namespace DotNetCalendarAPI.Tests.TestUtilities
{
    public abstract class TestBase : IDisposable
    {
        protected readonly WebApplicationFactory<Program> Factory;
        protected readonly HttpClient Client;
        private EventService? _eventService;

        protected TestBase()
        {
            Factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(builder =>
                {
                    builder.ConfigureServices(services =>
                    {
                        // Ensure we're in testing environment
                        services.RemoveAll<EventService>();
                        
                        // Create a singleton event service that we can access in tests
                        services.AddSingleton<EventService>(provider =>
                        {
                            if (_eventService == null)
                            {
                                var logger = provider.GetRequiredService<ILogger<EventService>>();
                                _eventService = new EventService(logger);
                                _eventService.InitializeNextId(0);
                            }
                            return _eventService;
                        });
                    });
                    
                    builder.UseEnvironment("Testing");
                });

            Client = Factory.CreateClient();
        }

        protected EventService GetEventService()
        {
            // This ensures we get the same instance that the web host is using
            using var scope = Factory.Services.CreateScope();
            return scope.ServiceProvider.GetRequiredService<EventService>();
        }

        public virtual void Dispose()
        {
            Client?.Dispose();
            Factory?.Dispose();
        }
    }
}