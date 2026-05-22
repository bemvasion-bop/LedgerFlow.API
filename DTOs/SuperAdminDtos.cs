namespace LedgerFlow.API.DTOs
{
    // ══════════════════════════════════════════════════════════════════════
    // SUPER ADMIN - COMPANY MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════

    public class CompanyListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PlanName { get; set; } = string.Empty;
        public string SubscriptionStatus { get; set; } = string.Empty;
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? SubscriptionExpiresAt { get; set; }
        public int UserCount { get; set; }
        public int ExpenseCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CompanyDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int PlanId { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public string SubscriptionStatus { get; set; } = string.Empty;
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? SubscriptionStartedAt { get; set; }
        public DateTime? SubscriptionExpiresAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public int UserCount { get; set; }
        public int ExpenseCount { get; set; }
        public int ExpensesThisMonth { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateCompanyPlanDto
    {
        public int CompanyId { get; set; }
        public int PlanId { get; set; }
    }

    public class UpdateSubscriptionStatusDto
    {
        public int CompanyId { get; set; }
        public string SubscriptionStatus { get; set; } = string.Empty; // Trial | Active | Expired | Suspended
        public DateTime? SubscriptionExpiresAt { get; set; }
    }

    public class SystemStatsDto
    {
        public int TotalCompanies { get; set; }
        public int ActiveCompanies { get; set; }
        public int TrialCompanies { get; set; }
        public int ExpiredCompanies { get; set; }
        public int SuspendedCompanies { get; set; }
        public int TotalUsers { get; set; }
        public int TotalExpenses { get; set; }
        public int StarterPlanCompanies { get; set; }
        public int BusinessPlanCompanies { get; set; }
    }

    public class CompanyRegistrationDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyEmail { get; set; } = string.Empty;
        public string? CompanyPhone { get; set; }
        public string? CompanyAddress { get; set; }
        public string AdminFirstName { get; set; } = string.Empty;
        public string AdminLastName { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
        public int PlanId { get; set; } = 1; // Default to Starter plan
    }

    public class PlanDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal QuarterlyPrice { get; set; }
        public decimal YearlyPrice { get; set; }
        public int MaxUsers { get; set; }
        public int MaxExpensesPerMonth { get; set; }
        public bool CanUploadReceipt { get; set; }
        public bool HasAdvancedReports { get; set; }
        public bool HasAdvancedAnalytics { get; set; }
        public bool HasDepartmentAnalytics { get; set; }
        public bool HasRoleBasedWorkflows { get; set; }
        public bool HasPrioritySupport { get; set; }
        public int TrialDays { get; set; }
    }

    public class ExtendTrialDto
    {
        public int CompanyId { get; set; }
        public int Days { get; set; }
    }

    public class PlatformActivityDto
    {
        public DateTime Date { get; set; }
        public int CompanyRegistrations { get; set; }
        public int UserRegistrations { get; set; }
        public int ExpenseSubmissions { get; set; }
    }

    public class CompanyGrowthDto
    {
        public string Month { get; set; } = string.Empty;
        public int CompaniesRegistered { get; set; }
        public int TotalCompanies { get; set; }
    }

    /// <summary>
    /// DTO for Super Admin to create a new company with admin account
    /// Matches the public registration form structure
    /// </summary>
    public class SuperAdminCreateCompanyDto
    {
        // Company Information
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyEmail { get; set; } = string.Empty;
        public string? CompanyPhone { get; set; }
        public string? CompanyAddress { get; set; }

        // Admin Account
        public string AdminFirstName { get; set; } = string.Empty;
        public string AdminLastName { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;

        // Subscription Settings
        public int PlanId { get; set; } = 1; // Default to Starter
        public string SubscriptionStatus { get; set; } = "Trial"; // Trial | Active | Suspended
    }

    /// <summary>
    /// DTO for Super Admin to update company with admin account details
    /// Matches the unified form structure
    /// </summary>
    public class SuperAdminUpdateCompanyDto
    {
        // Company Information
        public string? CompanyName { get; set; }
        public string? CompanyEmail { get; set; }
        public string? CompanyPhone { get; set; }
        public string? CompanyAddress { get; set; }

        // Admin Account
        public string? AdminFirstName { get; set; }
        public string? AdminLastName { get; set; }
        public string? AdminEmail { get; set; }
        public string? AdminPassword { get; set; } // Optional - only update if provided

        // Subscription Settings
        public int? PlanId { get; set; }
        public string? SubscriptionStatus { get; set; }
    }
}
