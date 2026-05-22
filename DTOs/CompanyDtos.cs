using System.ComponentModel.DataAnnotations;

namespace LedgerFlow.API.DTOs
{
    public class CreateCompanyDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string ContactPerson { get; set; } = string.Empty;

        [Required]
        public int PlanId { get; set; }

        public string SubscriptionStatus { get; set; } = "Trial";

        public int MaxUsers { get; set; } = 10;
    }

    public class UpdateCompanyDto
    {
        [StringLength(100)]
        public string? Name { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        public string? ContactPerson { get; set; }

        public int? PlanId { get; set; }

        public string? SubscriptionStatus { get; set; }

        public int? MaxUsers { get; set; }
    }
}
