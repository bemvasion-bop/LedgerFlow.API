namespace LedgerFlow.API.Models
{
    /// <summary>
    /// Subscription plan that governs what a company can do.
    /// SpendSync offers: Starter and Business plans with Quarterly/Yearly billing.
    /// </summary>
    public class Plan
    {
        public int Id { get; set; }

        /// <summary>Starter or Business</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Plan description</summary>
        public string? Description { get; set; }

        /// <summary>Price per quarter (3 months) in Philippine Peso</summary>
        public decimal QuarterlyPrice { get; set; }

        /// <summary>Price per year (12 months) in Philippine Peso</summary>
        public decimal YearlyPrice { get; set; }

        /// <summary>Maximum users allowed (-1 = unlimited)</summary>
        public int MaxUsers { get; set; }

        /// <summary>Maximum expenses per month (-1 = unlimited)</summary>
        public int MaxExpensesPerMonth { get; set; }

        /// <summary>Can upload receipt attachments</summary>
        public bool CanUploadReceipt { get; set; }

        /// <summary>Has advanced financial reports and analytics</summary>
        public bool HasAdvancedReports { get; set; }

        /// <summary>Has advanced analytics dashboards</summary>
        public bool HasAdvancedAnalytics { get; set; }

        /// <summary>Has department-level analytics</summary>
        public bool HasDepartmentAnalytics { get; set; }

        /// <summary>Has role-based approval workflows (Finance & Audit roles)</summary>
        public bool HasRoleBasedWorkflows { get; set; }

        /// <summary>Has priority support</summary>
        public bool HasPrioritySupport { get; set; }

        /// <summary>Trial duration in days</summary>
        public int TrialDays { get; set; } = 14;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
