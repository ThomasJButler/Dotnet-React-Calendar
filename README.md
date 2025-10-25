# Dotnet Calendar

Full-stack calendar application with React frontend and .NET Core backend using FastEndpoints.

[Live Demo](https://dotnet-react-calendar.vercel.app) | [API](https://dotnet-react-calendar.onrender.com/api/events)

## Tech Stack

### Backend

- .NET Core 9.0 with FastEndpoints
- FluentValidation for input validation
- AspNetCoreRateLimit middleware
- xUnit and FluentAssertions for testing
- In-memory storage (thread-safe, easily replaced with EF Core)

### Frontend

- React 19.0 with Material UI 6.4.8
- Context API for state management
- Axios with interceptors for API calls
- Recharts for visualisation
- Jest and React Testing Library

## Installation

### Backend

```bash
cd backend/DotNetCalendarAPI
dotnet build
dotnet run
```

API runs at `http://localhost:5191`

### Frontend

```bash
cd frontend/dotnet-calendar
npm install
npm start
```

App runs at `http://localhost:3000`

## Configuration

### Backend (appsettings.json)

```json
{
  "IpRateLimiting": {
    "GeneralRules": [{
      "Endpoint": "*",
      "Period": "1m",
      "Limit": 60
    }]
  }
}
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5191/api
PORT=3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events with optional filters |
| GET | `/api/events/{id}` | Get specific event |
| POST | `/api/events` | Create event |
| PUT | `/api/events/{id}` | Update event |
| DELETE | `/api/events/{id}` | Delete event |
| POST | `/api/events/search` | Advanced search with filters |
| POST | `/api/events/bulk` | Bulk import/export |

## Features

- Monthly calendar view with navigation
- Event CRUD with validation
- Search and filtering
- Free time analytics with charts
- Dark/light theme
- Circuit breaker pattern for API resilience
- Request deduplication and caching
- CSV import/export
- API health monitoring dashboard
- Responsive design

## Testing

### Backend Tests

```bash
cd backend/DotNetCalendarAPI.Tests
dotnet test
```

### Frontend Tests

```bash
cd frontend/dotnet-calendar
npm test
```

## Architecture

Backend follows FastEndpoints pattern with clear separation:

- `Endpoints/` - Individual endpoint classes
- `Services/` - Business logic layer
- `Models/` - Domain entities and DTOs
- `Validators/` - FluentValidation rules
- `Middleware/` - Request logging, exception handling

Frontend uses Context API for state:

- `components/` - UI components
- `context/` - Global state management
- `services/` - API client with circuit breaker
- `hooks/` - Custom hooks (useDebounce, useApi, etc.)

## Notes

- Backend uses in-memory storage that resets on restart
- Sample data loaded on startup via `SampleDataService`
- Dates use ISO 8601 format
- Frontend dev server can conflict with port 3000 - use `npx kill-port 3000` if needed
- Backend API might take 60-90 seconds to warm up on first request (Render free tier limitation)

## Links

[LinkedIn](https://linkedin.com/in/thomasbutleruk) | [Commercial Website](https://thomasjbutler.me) | [Personal Website](https://thomasjbutler.github.io/ThomasJButler/)
