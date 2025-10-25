/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Application entry point and service configuration for the Calendar API.
///              Configures FastEndpoints, middleware pipeline, rate limiting, and CORS.
/// </summary>

using FastEndpoints;
using FastEndpoints.Swagger;
using DotNetCalendarAPI.Services;
using DotNetCalendarAPI.Infrastructure.Middleware;
using DotNetCalendarAPI.Infrastructure.HealthChecks;
using Serilog;
using AspNetCoreRateLimit;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/api-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

builder.Services.AddFastEndpoints();
builder.Services.SwaggerDocument(o =>
{
    o.DocumentSettings = s =>
    {
        s.Title = "DotNet Calendar API";
        s.Version = "v1";
        s.Description = "Calendar API with FastEndpoints, rate limiting, and event management";
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CalendarPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://dotnet-react-calendar.vercel.app"
            )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithExposedHeaders("X-Correlation-Id", "X-Total-Count");
    });
});

builder.Services.AddResponseCaching();
builder.Services.AddMemoryCache();

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.SmallestSize;
});

builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddInMemoryRateLimiting();

builder.Services.AddHealthChecks()
    .AddCheck<ApiHealthCheck>("api_health");

builder.Services.AddSingleton<EventService>();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Initialise sample data for non-test environments
if (!app.Environment.IsEnvironment("Testing"))
{
    var eventService = app.Services.GetRequiredService<EventService>();
    SampleDataService.InitializeEvents(eventService);
}

app.UseSerilogRequestLogging();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

// Security headers to prevent XSS, clickjacking, and MIME sniffing
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen();
}

app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseCors("CalendarPolicy");
app.UseResponseCaching();
app.UseIpRateLimiting();

app.UseFastEndpoints(c =>
{
    c.Endpoints.RoutePrefix = "api";
});

app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

Log.Information("DotNet Calendar API started");

try
{
    app.Run();
}
finally
{
    Log.CloseAndFlush();
}
