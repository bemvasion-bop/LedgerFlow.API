using System;
using System.Collections.Generic;

namespace LedgerFlow.API.DTOs
{
    public class SubscriptionDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public int PlanId { get; set; }
        public string PlanName { get; set; } = "STARTER";
        public string SubscriptionStatus { get; set; } = "Active";
        public int MaxUsers { get; set; }
        public decimal Amount { get; set; }
        public string BillingCycle { get; set; } = "Quarterly";
        public DateTime? SubscriptionStartedAt { get; set; }
        public DateTime? SubscriptionExpiresAt { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SubscriptionStatsDto
    {
        public int TrialCount { get; set; }
        public int ActiveCount { get; set; }
        public int ExpiredCount { get; set; }
        public int SuspendedCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRecurringRevenue { get; set; }
    }

    public class UpdateSubscriptionDto
    {
        public int PlanId { get; set; }
        public string SubscriptionStatus { get; set; } = "Active";
        public int MaxUsers { get; set; }
        public DateTime? SubscriptionStartedAt { get; set; }
        public DateTime? SubscriptionExpiresAt { get; set; }
    }

    public class RenewSubscriptionDto
    {
        public int CompanyId { get; set; }
        public int Months { get; set; }
    }

    public class ChangePlanDto
    {
        public int CompanyId { get; set; }
        public int NewPlanId { get; set; }
    }
}
