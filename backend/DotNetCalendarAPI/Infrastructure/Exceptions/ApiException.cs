namespace DotNetCalendarAPI.Infrastructure.Exceptions
{
    public class ApiException : Exception
    {
        public int StatusCode { get; }
        public string ErrorCode { get; }
        public object? Details { get; }

        public ApiException(int statusCode, string message, string errorCode, object? details = null) 
            : base(message)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
            Details = details;
        }
    }

    public class NotFoundException : ApiException
    {
        public NotFoundException(string message, object? details = null) 
            : base(404, message, "NOT_FOUND", details)
        {
        }
    }

    public class ConflictException : ApiException
    {
        public ConflictException(string message, object? details = null) 
            : base(409, message, "CONFLICT", details)
        {
        }
    }

    public class ValidationException : ApiException
    {
        public ValidationException(string message, object? details = null) 
            : base(400, message, "VALIDATION_ERROR", details)
        {
        }
    }
}