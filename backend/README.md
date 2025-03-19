
# AWOL Calendar API

  

This is the backend API for the AWOL Calendar application, built with .NET Core and FastEndpoints.

  

## Features

  

- CRUD operations for calendar events

- In-memory data store

- RESTful API endpoints

- Swagger documentation

  

## API Endpoints

  

| Method | Endpoint | Description |

|--------|------------------|----------------------------|

| GET | /api/events | Get all events |

| GET | /api/events/{id} | Get a specific event by ID |

| POST | /api/events | Create a new event |

| PUT | /api/events/{id} | Update an existing event |

| DELETE | /api/events/{id} | Delete an event |

  

## Getting Started

  

### Prerequisites

  

- .NET 9.0 SDK or later

  

### Running the API

  

1. Navigate to the API project directory:

  

```bash

cd  backend/AWOLCalendarAPI

```

  

2. Run the API:

  

```bash

dotnet  run

```

  

3. The API will be available at:

- HTTP: http://localhost:5191

- HTTPS: https://localhost:7188

  

4. Swagger UI is available at:

- HTTP: http://localhost:5191/swagger

- HTTPS: https://localhost:7188/swagger

  

## Testing the API

  

You can use the included `.http` file to test the API endpoints. Open `AWOLCalendarAPI.http` in Visual Studio Code with the REST Client extension installed, and you can send requests directly from the editor.

  

## Project Structure

  

-  `Models/`: Data models

-  `Services/`: Business logic

-  `Endpoints/`: API endpoints

-  `Validators/`: Request validation
