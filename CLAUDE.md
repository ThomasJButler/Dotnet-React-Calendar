# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

.NET Backend Calendar is a full-stack calendar application with a React frontend and .NET Core backend using FastEndpoints. Originally created for a code assessment, it has been enhanced as a portfolio piece demonstrating modern web development practices with a clean architecture approach.

## Essential Commands

### Backend (.NET Core)
```bash
# Navigate to backend API
cd backend/DotNetCalendarAPI

# Build the project
dotnet build

# Run the API server (http://localhost:5191)
dotnet run

# Run backend tests
cd ../DotNetCalendarAPI.Tests
dotnet test

# Run specific test class
dotnet test --filter FullyQualifiedName~EventServiceTests
```

### Frontend (React)
```bash
# Navigate to frontend
cd frontend/dotnet-calendar

# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Run tests
npm test

# Run tests with Jest config
npm run test-jest

# Build for production
npm build
```

## Architecture Overview

### Backend Structure
The backend follows FastEndpoints architecture pattern:

- **Endpoints/** - Individual endpoint classes for each API operation
  - Each endpoint has its own Request/Response models
  - Validation is handled via FluentValidation
  - Endpoints are self-contained with clear responsibilities

- **Services/** - Business logic layer
  - `EventService` - In-memory event storage with thread-safe operations
  - `SampleDataService` - Initializes demo data

- **Models/** - Domain entities and DTOs
  - Separate Request/Response models for API contracts
  - Clean separation between API and domain models

- **Validators/** - FluentValidation rules for requests

### Frontend Structure
React application with Context API for state management:

- **components/** - UI components
  - `Calendar.js` - Monthly calendar view with navigation
  - `EventList.js` - Displays events for selected date
  - `EventForm.js` - Add/edit event form
  - `FreeTimeChart.js` - Visualization component

- **context/** - Global state management
  - `EventContext.js` - Manages event state across components

- **services/** - API communication
  - `eventService.js` - Axios-based API client

## Key Technical Details

### API Endpoints
All endpoints prefixed with `/api`:
- `GET /api/events` - Get all events
- `GET /api/events/{id}` - Get specific event
- `POST /api/events` - Create new event
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

### CORS Configuration
Backend configured to accept requests from `http://localhost:3000` (frontend dev server).

### State Management
Frontend uses React Context API pattern:
- Global event state in EventContext
- Components consume context for data and actions
- Optimistic updates for better UX

### Testing Approach
- Backend: xUnit tests with FluentAssertions and NSubstitute
- Frontend: Jest with React Testing Library

## Development Workflow

1. **Backend changes**: Always rebuild with `dotnet build` before running
2. **Frontend changes**: Hot reload enabled in development
3. **API changes**: Update both endpoint and corresponding service in frontend
4. **State changes**: Update EventContext and consuming components

## Important Considerations

- Backend uses in-memory storage - data resets on restart
- Sample data initialized on startup via `SampleDataService`
- Date handling uses ISO 8601 format for API communication
- Frontend expects backend at `http://localhost:5191`

## Port Configuration

- Frontend dev server runs on port 3000 by default
- Port can be configured via `.env` file with `PORT=3000`
- If port conflicts occur, use `npx kill-port 3000` to free the port
- Backend API always runs on port 5191

## Frontend v2.0 Enhancements

The frontend has been enhanced with comprehensive features including:

- **Enhanced API Client**: Circuit breaker, retry logic, request deduplication, caching
- **Advanced State Management**: Granular loading states, optimistic updates, search/pagination
- **UI/UX Components**: Loading spinners, skeleton loaders, toast notifications, error boundaries
- **Search & Filtering**: Real-time search with debouncing, advanced filters, search history
- **API Monitoring**: Connection status, circuit breaker state, rate limit visualization
- **Performance**: Request deduplication, response caching, debounced search, lazy loading
- **Analytics**: Event analytics dashboard, performance monitoring, Web Vitals tracking
- **Bulk Operations**: CSV import/export for events

See `frontend/dotnet-calendar/ENHANCEMENTS.md` for detailed feature documentation.