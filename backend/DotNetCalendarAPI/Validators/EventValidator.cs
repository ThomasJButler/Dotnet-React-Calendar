/// <summary>
/// Author: Tom Butler
/// Date: 2025-10-25
/// Description: Validation rules for Event domain model
/// </summary>
using FastEndpoints;
using FluentValidation;
using DotNetCalendarAPI.Models;

namespace DotNetCalendarAPI.Validators
{
    public class EventValidator : Validator<Event>
    {
        public EventValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required")
                .MaximumLength(100).WithMessage("Title cannot exceed 100 characters");

            RuleFor(x => x.Date)
                .NotEmpty().WithMessage("Date is required");

            RuleFor(x => x.Time)
                .NotEmpty().WithMessage("Time is required")
                .MaximumLength(10).WithMessage("Time cannot exceed 10 characters");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
        }
    }
}
