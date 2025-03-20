# AWOL-Calendar

A full-stack calendar application built with .NET Core, FastEndpoints, and React.js + Material UI.

## Project Summary

AWOL Calendar is a web application that allows users to create, view, update, and delete calendar events. The project features a modern React frontend with Material UI components and a .NET Core backend using the FastEndpoints library for API endpoints.

## Running the Project Locally

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend/AWOLCalendarAPI
   ```

2. Build the project:
   ```
   dotnet build
   ```

3. Run the API server:
   ```
   dotnet run
   ```
   The backend will be available at `http://localhost:5191`

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend/awol-calendar
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   The application will be available at `http://localhost:3000`

## Key Features

- Interactive monthly calendar view
- Create, view, update and delete events
- Responsive design with Material UI components
- RESTful API with FastEndpoints architecture
- In-memory data store for simplified deployment

## Technology Stack

### Backend
- .NET Core
- FastEndpoints library
- FluentValidation

### Frontend
- React.js
- Material UI components
- Context API for state management
- Axios for API communication

## Project Structure

```
AWOL Calendar
├── Backend
│   └── AWOLCalendarAPI (API handlers, models, services, validators)
│
└── Frontend
    └── awol-calendar (React components, context, services)
```

Please reference the original handwritten plans in the `/planning` directory.
