# AWOL Calendar Project Overview

## Project Summary

AWOL Calendar is a full-stack calendar application that allows users to create, view, update, and delete events. The application combines a modern React frontend with a .NET Core backend using the FastEndpoints library for API endpoints.

## Technology Stack

### Backend
- **.NET Core**: Modern, cross-platform framework for building server applications
- **FastEndpoints**: Lightweight library for building high-performance REST APIs with minimal boilerplate
- **In-memory data store**: Simplified data persistence without requiring database setup
- **Validation**: Robust request validation using FluentValidation patterns

### Frontend
- **React**: Component-based UI library for building interactive user interfaces
- **Material UI**: React component library implementing Google's Material Design
- **Context API**: State management solution for sharing data across components
- **Axios**: Promise-based HTTP client for API communication

## Architecture Overview

The application follows a clean architecture approach with separation of concerns:

```
AWOL Calendar
├── Backend
│   ├── Endpoints (API handlers)
│   ├── Models (Data structures)
│   ├── Services (Business logic)
│   ├── Validators (Request validation)
│   └── Program.cs (Application entry point)
│
└── Frontend
    ├── Components (UI building blocks)
    │   ├── Calendar.js (Monthly calendar view)
    │   ├── EventList.js (List of events for selected date)
    │   └── EventForm.js (Add/edit event form)
    ├── Context (State management)
    │   └── EventContext.js (Global event state)
    ├── Services (API communication)
    │   └── eventService.js (CRUD operations)
    └── App.js (Main application component)
```

## Key Features

### Backend Implementation

1. **RESTful API Design**
   - Clean, resource-based endpoints for event management
   - HTTP verb usage following REST conventions (GET, POST, PUT, DELETE)

2. **FastEndpoints Architecture**
   - Endpoint-specific request/response models
   - Clear separation between API contracts and domain models
   - Streamlined validation and handling

3. **Validation and Error Handling**
   - Input validation using fluent validation patterns
   - Consistent error responses
   - Proper status code usage

4. **In-Memory Event Storage**
   - Thread-safe implementation for concurrent access
   - Simulated database operations with CRUD functionality

### Frontend Implementation

1. **Interactive Calendar View**
   - Monthly calendar with navigation between months
   - Visual indicators for days with events
   - Date selection for viewing/adding events

2. **Event Management**
   - View events for selected date
   - Add new events with title, date, time, and description
   - Edit existing events
   - Delete events with confirmation

3. **State Management**
   - Global state using React Context API
   - Optimistic UI updates for improved user experience
   - Loading and error states for feedback

4. **Responsive Design**
   - Adapts to different screen sizes and devices
   - Clean, intuitive user interface with Material UI components
   - Consistent styling and visual feedback

## Development Approach

The project followed a structured development process:

1. **Planning and Architecture**
   - Define requirements and user stories
   - Design API endpoints and data models
   - Plan component structure and user flow

2. **Backend Implementation**
   - Create model classes and validation rules
   - Implement endpoints with FastEndpoints
   - Build event service with in-memory storage

3. **Frontend Implementation**
   - Set up React project with necessary dependencies
   - Create service layer for API communication
   - Develop UI components incrementally
   - Implement state management with Context API

4. **Integration and Testing**
   - Connect frontend to backend services
   - Manual testing of all CRUD operations
   - Responsive design testing

## Technical Highlights

### Backend Skills Demonstrated

- **.NET Core API Development**: Building a RESTful API with .NET Core
- **FastEndpoints Library**: Using a modern, performance-focused approach to API design
- **Clean Architecture**: Separation of concerns between endpoints, services, and models
- **Validation**: Implementing robust validation rules for API requests
- **Error Handling**: Providing meaningful feedback for failed operations

### Frontend Skills Demonstrated

- **React Component Design**: Creating reusable, modular components
- **State Management**: Using Context API for global application state
- **API Integration**: Consuming REST APIs with Axios
- **UI/UX Design**: Building an intuitive, responsive interface with Material UI
- **Form Handling**: Implementing form validation and submission

## Running the Project

### Backend
1. Navigate to the `backend/AWOLCalendarAPI` directory
2. Run `dotnet build` to build the project
3. Run `dotnet run` to start the API server on `http://localhost:5191`

### Frontend
1. Navigate to the `frontend/awol-calendar` directory
2. Run `npm install` to install dependencies
3. Run `npm start` to start the development server on `http://localhost:3000`

## Explaining the Project to an Employer

When discussing this project with potential employers, consider highlighting these points:

### Overview Statement
"AWOL Calendar is a full-stack web application I developed using React and .NET Core. It features a clean, intuitive interface for managing calendar events with complete CRUD functionality."

### Technical Achievements
- "I implemented a RESTful API using FastEndpoints, a high-performance .NET library that simplifies endpoint creation while maintaining best practices."
- "On the frontend, I built a component-based UI with React, using the Context API for state management rather than reaching for a heavier solution like Redux."
- "The application features a responsive design that works across devices, with intuitive interactions for adding and managing events."

### Development Process
- "I started with a clear architecture, separating concerns between the API, business logic, and data storage on the backend."
- "For the frontend, I designed reusable components that follow React best practices, with careful attention to state management."
- "I used a structured Git commit strategy to keep track of my progress and make logical, incremental improvements."

### Problem-Solving Examples
- "One challenge was efficiently detecting which calendar days had events scheduled. I solved this by implementing a filtering algorithm that compares event dates with calendar days during rendering."
- "Managing form state for both creating and editing events required careful consideration. I used React's useEffect to properly initialise the form based on whether an event was being created or edited."

### Learning Outcomes
- "This project strengthened my understanding of .NET Core API development, particularly with the FastEndpoints library which was new to me."
- "I deepened my knowledge of React's Context API for state management in a real-world application."
- "The project gave me hands-on experience with full CRUD operations and RESTful API design."
- This was my first time building a .NET application from scratch as I only engineered code built in .NET and C# at my last employer. The experience was great and I feel competent doing this now and could practise building with other front end stacks, such as Angular, Svelte, Next.js.

## Potential Future Enhancements 

1. **Persistent Storage**: Replace in-memory storage with a proper database like SQL Server or MongoDB
2. **User Authentication**: Add user accounts and authentication to support personal calendars
3. **Event Categories**: Allow users to categorise events with colours and filters
4. **Recurring Events**: Support for repeating events (daily, weekly, monthly)
5. **Calendar Sharing**: Ability to share calendars with other users
6. **Notifications**: Email or push notification reminders for upcoming events
7. **Mobile App**: Extend the application with a React Native mobile version
