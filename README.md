# Dotnet Calendar - Full-Stack Calendar Application

<img width="1492" height="776" alt="image" src="https://github.com/user-attachments/assets/f30de5da-86b2-4ff1-bab5-186bcaf26a5b" />

## Bulk Event Import (from CSV)

<img width="1480" height="772" alt="image" src="https://github.com/user-attachments/assets/99d12b08-68f6-4256-aba6-85e786c35468" />

## Events added to API (from CSV)

<img width="752" height="520" alt="image" src="https://github.com/user-attachments/assets/a6344575-0cd3-4473-8e0b-4aac321dfcbc" />

## Event Metrics (yearly, after importing csv data)

<img width="1162" height="695" alt="image" src="https://github.com/user-attachments/assets/97213264-ed1a-49cd-988d-b319abaca798" />
<img width="1351" height="559" alt="image" src="https://github.com/user-attachments/assets/865c7c31-f786-4d59-bd6d-ff32cef31748" />

## Mobile (vertical stack) - I can improve this in a future update.

<img width="270" height="556" alt="image" src="https://github.com/user-attachments/assets/fdba327f-09b9-4bf4-95e3-785def1b22fa" />

A production-ready calendar application showcasing modern web development with **React.js** and **.NET Core 9.0**, featuring real-time API analytics, advanced state management, and enterprise-grade error handling. This project demonstrates full-stack engineering capabilities with a particular emphasis on backend architecture and API design.

🚀 **Live Demo**: [Frontend on Vercel](https://dotnet-react-calendar.vercel.app) | [Backend API on Render](https://dotnet-react-calendar.onrender.com/api/events)

## 🎯 Project Highlights

This calendar application goes beyond basic CRUD operations to demonstrate:
- **Production-Grade API Client**: Circuit breaker pattern, retry logic, request deduplication
- **Real-Time API Analytics**: Live monitoring dashboard showing API health, response times, and circuit breaker status
- **Advanced State Management**: Optimistic updates, granular loading states, and intelligent caching
- **Enterprise Error Handling**: Toast notifications, error boundaries, and graceful degradation
- **Performance Optimization**: Lazy loading, debounced search, and response caching

## 🛠️ Technology Stack

### Backend (.NET Core 9.0)
- **FastEndpoints** - High-performance, minimal API framework
- **FluentValidation** - Comprehensive input validation
- **AspNetCoreRateLimit** - API rate limiting middleware
- **Custom Middleware** - Request logging, exception handling, correlation IDs
- **xUnit & FluentAssertions** - Comprehensive test coverage
- **In-Memory Storage** - Thread-safe implementation (easily replaceable with EF Core)

### Frontend (React 19.0)
- **Material UI 6.4.8** - Modern component library with theming
- **Context API** - Global state management with optimistic updates
- **Custom Hooks** - useDebounce, useLocalStorage, useApi
- **Recharts** - Data visualization for free time analysis
- **React Error Boundaries** - Graceful error handling
- **Axios with Interceptors** - Advanced HTTP client
- **Web Vitals** - Performance monitoring

## ✨ Key Features

### Core Calendar Functionality
- 📅 Interactive monthly calendar with intuitive navigation
- 📝 Full CRUD operations for events with validation
- 🔍 Advanced search with real-time filtering
- 📊 Free time visualization and analytics
- 🌙 Dark/Light theme with smooth transitions
- 📱 Fully responsive design

### v2.0 Enhancements

#### 🔌 Advanced API Integration
- **Circuit Breaker Pattern**: Prevents cascading failures
- **Intelligent Retry Logic**: Exponential backoff with jitter
- **Request Deduplication**: Prevents duplicate API calls
- **Response Caching**: ETag-based caching with TTL
- **Rate Limit Handling**: Visual indicators and automatic backoff

#### 📊 Real-Time Analytics Dashboard
- **API Health Monitoring**: Connection status, response times
- **Circuit Breaker Visualization**: Real-time state tracking
- **Performance Metrics**: Request counts, error rates
- **Event Analytics**: Usage patterns and statistics

#### 🎨 Enhanced User Experience
- **Toast Notifications**: Non-intrusive feedback system
- **Skeleton Loaders**: Smooth loading states
- **Error Boundaries**: Graceful error recovery
- **Debounced Search**: Optimized search performance
- **Bulk Operations**: Import/Export events via CSV

## 🏗️ Architecture & Design Patterns

### Backend Architecture
```
DotNetCalendarAPI/
├── Endpoints/              # FastEndpoints with Request/Response models
├── Services/              # Business logic with thread-safe operations
├── Validators/            # FluentValidation rules
├── Middleware/            # Custom middleware pipeline
│   ├── RequestLoggingMiddleware
│   ├── ExceptionHandlingMiddleware
│   └── RateLimitMiddleware
└── Models/                # Domain entities and DTOs
```

### Frontend Architecture
```
src/
├── components/            # UI components with error boundaries
├── context/              # Global state management
│   ├── EventContext      # Event state with optimistic updates
│   └── AppContext        # Application-wide state
├── services/             # API integration layer
│   ├── apiClient         # Advanced HTTP client
│   └── eventService      # Event-specific operations
├── hooks/                # Custom React hooks
└── utils/                # Helper functions
```

## 🚀 What I Learned

This project was an incredible learning journey where I:

1. **Mastered FastEndpoints**: Moved beyond traditional controllers to embrace a more functional, endpoint-focused architecture
2. **Implemented Resilience Patterns**: Built production-grade error handling with circuit breakers and retry logic
3. **Advanced State Management**: Developed complex state synchronization with optimistic updates and rollback
4. **Performance Optimization**: Addressed real-world issues like rate limiting and request deduplication
5. **Full-Stack Integration**: Created seamless communication between React and .NET with proper error handling

## 💡 Technical Achievements

### Backend Engineering
- ✅ Thread-safe in-memory storage with concurrent operations
- ✅ Comprehensive middleware pipeline with correlation tracking
- ✅ Advanced search with multiple filter combinations
- ✅ Rate limiting with configurable policies
- ✅ Global exception handling with problem details

### Frontend Engineering
- ✅ Production-grade API client with multiple resilience patterns
- ✅ Real-time health monitoring with visual feedback
- ✅ Advanced search with debouncing and caching
- ✅ Optimistic updates with automatic rollback
- ✅ Performance monitoring with Web Vitals

## 📦 Installation & Setup

### Prerequisites
- .NET 9.0 SDK or later
- Node.js 16.x or later
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/awol-calendar.git
   cd awol-calendar
   ```

2. **Backend Setup**
   ```bash
   cd backend/DotNetCalendarAPI
   dotnet build
   dotnet run
   ```
   API runs at `http://localhost:5191`

3. **Frontend Setup**
   ```bash
   cd frontend/dotnet-calendar
   npm install
   npm start
   ```
   App opens at `http://localhost:3000`

## 🔧 Configuration

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
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Get all events with optional filters |
| GET | `/api/events/{id}` | Get specific event |
| POST | `/api/events` | Create event with validation |
| PUT | `/api/events/{id}` | Update event |
| DELETE | `/api/events/{id}` | Delete event |
| POST | `/api/events/search` | Advanced search with filters |
| POST | `/api/events/bulk` | Bulk import/export |

## 🧪 Testing

### Backend Tests
```bash
cd backend/DotNetCalendarAPI.Tests
dotnet test
```
- 122 total tests covering endpoints, services, and middleware
- Comprehensive validation testing
- Thread-safety verification

### Frontend Tests
```bash
cd frontend/dotnet-calendar
npm test
```
- Component testing with React Testing Library
- Context and hook testing
- API client testing

## 🎓 Portfolio Context

This project showcases my journey from basic web development to implementing enterprise-grade patterns. Starting as a simple calendar for a code assessment, I continued to develop it extensively to gain full knowledge of the .NET backend ecosystem and deployment cycle, while also transitioning to React from what I had previously been using in work. This transformation demonstrates:

- **Backend Excellence**: Clean architecture with FastEndpoints, comprehensive middleware, and thread-safe operations
- **Modern Frontend**: React with advanced state management, error handling, and performance optimization
- **Full-Stack Integration**: Seamless API communication with resilience patterns
- **Problem-Solving**: Addressed real-world challenges like rate limiting and infinite loops
- **Best Practices**: Clean code, comprehensive testing, and documentation
- **Continuous Learning**: Self-driven exploration of .NET Core and React best practices beyond the initial requirements

## 🔮 Future Enhancements

While the application is fully functional, potential improvements include:
- TypeScript migration for enhanced type safety
- GraphQL API implementation
- WebSocket support for real-time updates
- Multi-user support with authentication
- Database integration with Entity Framework Core
- Deployment automation with CI/CD

## 📄 License

This is a personal portfolio project. Feel free to explore the code and use it as inspiration for your own projects.

---

Built with passion by Thomas Butler | [LinkedIn](https://linkedin.com/in/thomasbutleruk) | [Commercial Website](https://thomasjbutler.me) | [Personal Website](https://thomasjbutler.github.io/ThomasJButler/)
