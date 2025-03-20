using FastEndpoints;
using FluentValidation;
using AWOLCalendarAPI.Models.Requests;

namespace AWOLCalendarAPI.Validators
{
    public class UpdateEventValidator : Validator<UpdateEventRequest>
    {
        public UpdateEventValidator()
        {
            RuleFor(x => x.Id)
                .GreaterThan(0).WithMessage("Valid event Id is required");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required")
                .MaximumLength(100).WithMessage("Title cannot exceed 100 characters");

            RuleFor(x => x.DateString)
                .NotEmpty().WithMessage("Date is required")
                .Must(date => DateTime.TryParse(date, out _))
                .WithMessage("Invalid date format");

            RuleFor(x => x.Time)
                .NotEmpty().WithMessage("Time is required")
                .MaximumLength(10).WithMessage("Time cannot exceed 10 characters");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description cannot exceed 500 characters");
        }
    }
}
