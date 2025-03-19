using FastEndpoints;
using AWOLCalendarAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFastEndpoints();
builder.Services.AddCors(); // Add CORS services
builder.Services.AddSingleton<EventService>(); // Register Service

var app = builder.Build();

// Get the EventService and initialize with sample data
var eventService = app.Services.GetRequiredService<EventService>();
SampleDataService.InitializeEvents(eventService);

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseFastEndpoints(c =>
{
    c.Endpoints.RoutePrefix = "api";
});

// Add CORS for frontend
app.UseCors(builder => builder
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());

app.Run();
