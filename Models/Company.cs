namespace LedgerFlow.API.Models
{
    /// <summary>
    /// A tenant in the multi-tenant system.
    /// </summary>
    public class Company
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? ContactPerson { get; set; }

        public int PlanId { get; set; }
        public Plan? Plan { get; set; }

        /// <summary>Quarterly or Yearly</summary>
        public string BillingCycle { get; set; } = "Quarterly";

        /// <summary>Trial | Active | Expired | Suspended</summary>
        public string SubscriptionStatus { get; set; } = "Trial";

        /// <summary>Maximum number of users allowed for this company</summary>
        public int MaxUsers { get; set; } = 10;

        /// <summary>When the trial period ends (if applicable)</summary>
        public DateTime? TrialEndsAt { get; set; }

        /// <summary>When the subscription started</summary>
        public DateTime? SubscriptionStartedAt { get; set; }

        /// <summary>When the subscription expires (null = no expiry)</summary>
        public DateTime? SubscriptionExpiresAt { get; set; }

        /// <summary>Active | Suspended (legacy field, kept for compatibility)</summary>
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
