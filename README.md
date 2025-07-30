# DotNet Calendar

<img width="1490" alt="image" src="https://github.com/user-attachments/assets/5a9aa088-e873-463d-b9a8-57ae3f9be311" />

<img width="514" alt="image" src="https://github.com/user-attachments/assets/6f543614-fd50-4f9f-a784-fea1dc8c2542" />

A full-stack calendar application showcasing modern web development with .NET Core 9.0, FastEndpoints, and React.js + Material UI. Originally developed as part of a code assessment during my job search, I've enhanced and modified it to serve as a portfolio piece demonstrating full-stack capabilities.

## 📋 Project Overview

DotNet Calendar is a web application that allows users to create, view, update, and delete calendar events. The project features a modern React frontend with Material UI components and a .NET Core backend using the FastEndpoints library for API endpoints.

## ✨ Key Features

- **Interactive Calendar**: Monthly view with intuitive date navigation
- **Event Management**: Full CRUD operations for calendar events
- **Dark Mode**: Smooth theme transitions with Material UI
- **Responsive Design**: Mobile-optimized layout that works on all devices
- **Event Overlap Detection**: Prevents double-booking time slots
- **Data Visualization**: Free time charts using Recharts
- **Real-time Updates**: Context API for instant UI updates
- **Sample Data**: Pre-populated events for easy testing

## 🛠️ Technology Stack

### Backend
- **.NET Core 9.0** - Modern cross-platform framework
- **FastEndpoints** - High-performance REST API library
- **FluentValidation** - Robust input validation
- **xUnit** - Unit testing framework
- **In-memory Storage** - Simplified deployment (easily replaceable with database)

### Frontend
- **React 19.0** - Latest React with improved performance
- **Material UI 6.4.8** - Comprehensive component library
- **React Context API** - Global state management
- **Axios** - HTTP client with interceptors
- **Recharts** - Data visualization library
- **Tailwind CSS** - Utility-first styling
- **Jest & React Testing Library** - Component testing

## 📁 Project Structure

```
DotNet-Calendar/
├── backend/
│   ├── DotNetCalendarAPI/
│   │   ├── Endpoints/          # FastEndpoints API endpoints
│   │   ├── Models/             # Domain entities and DTOs
│   │   ├── Services/           # Business logic layer
│   │   ├── Validators/         # FluentValidation validators
│   │   └── Program.cs          # Application entry point
│   └── DotNetCalendarAPI.Tests/
│       ├── Endpoints/          # Endpoint unit tests
│       └── Services/           # Service unit tests
├── frontend/
│   └── dotnet-calendar/
│       ├── public/             # Static assets
│       └── src/
│           ├── components/     # React components
│           ├── context/        # State management
│           ├── services/       # API integration
│           └── App.js          # Main application
└── CLAUDE.md                   # AI assistant instructions
```

## 🚀 Getting Started

### Prerequisites

- **.NET 9.0 SDK** or later ([Download](https://dotnet.microsoft.com/download))
- **Node.js 16.x** or later ([Download](https://nodejs.org/))
- **Git** for cloning the repository

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dotnet-calendar.git
   cd dotnet-calendar
   ```

2. **Backend Setup**
   ```bash
   # Navigate to the backend directory
   cd backend/DotNetCalendarAPI
   
   # Build the project
   dotnet build
   
   # Run the API server
   dotnet run
   ```
   The API will be available at `http://localhost:5191`

3. **Frontend Setup** (in a new terminal)
   ```bash
   # Navigate to the frontend directory
   cd frontend/dotnet-calendar
   
   # Install dependencies
   npm install
   
   # Start the development server
   npm start
   ```
   The application will open at `http://localhost:3000`

## 🔧 Development

### Backend Commands

```bash
# Run from backend/DotNetCalendarAPI directory
dotnet build              # Build the project
dotnet run                # Run the API server
dotnet watch              # Run with hot reload

# Run from backend/DotNetCalendarAPI.Tests directory
dotnet test               # Run all tests
dotnet test --logger "console;verbosity=detailed"  # Verbose test output
```

### Frontend Commands

```bash
# Run from frontend/dotnet-calendar directory
npm start                 # Start development server
npm test                  # Run tests in watch mode
npm run test-jest         # Run tests with Jest config
npm run build            # Build for production
npm test -- --coverage   # Run tests with coverage report
```

## 📡 API Endpoints

All endpoints are prefixed with `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events |
| GET | `/api/events/{id}` | Get specific event by ID |
| POST | `/api/events` | Create new event |
| PUT | `/api/events/{id}` | Update existing event |
| DELETE | `/api/events/{id}` | Delete event |

### Example Request

```bash
# Create a new event
curl -X POST http://localhost:5191/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "date": "2024-01-20",
    "time": "14:00",
    "description": "Weekly sync",
    "duration": 60
  }'
```

## 🏗️ Architecture

### Backend Architecture
The backend follows **FastEndpoints** architecture patterns:
- **Self-contained endpoints** with dedicated Request/Response models
- **Service layer** for business logic and data management
- **FluentValidation** for robust input validation
- **In-memory storage** for simplified deployment (easily replaceable)

### Frontend Architecture
The frontend uses modern React patterns:
- **Functional components** with hooks
- **Context API** for global state management
- **Custom hooks** for reusable logic
- **Service layer** for API communication
- **Material UI theming** for consistent design

## 🧪 Testing

### Backend Tests
```bash
cd backend/DotNetCalendarAPI.Tests
dotnet test

# Run specific test category
dotnet test --filter FullyQualifiedName~EventServiceTests
```

### Frontend Tests
```bash
cd frontend/dotnet-calendar
npm test

# Run with coverage
npm test -- --coverage --watchAll=false
```

## 🔒 Security Considerations

- **CORS** configured for localhost development
- **Input validation** on both client and server
- **Error handling** with appropriate status codes
- **Request timeouts** to prevent hanging connections

## 📝 Environment Configuration

### Backend Configuration
Update `appsettings.json` for different environments:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

### Frontend Configuration
Environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:5191/api
```

## 🎯 Portfolio Context

This project was initially created for a code assessment during my job search. I've enhanced it to demonstrate:

- **Clean Architecture** principles
- **Modern API Design** with FastEndpoints
- **React Best Practices** and component patterns
- **Responsive UI/UX** implementation
- **Test-Driven Development** approach
- **Professional Documentation** standards

## 📄 License

This project is available as a portfolio piece. Feel free to use it as a reference or starting point for your own projects.

## 🤝 Contributing

As this is a portfolio project, I'm not actively seeking contributions. However, feel free to fork and modify for your own use!

---

Built with ❤️ by Thomas Butler