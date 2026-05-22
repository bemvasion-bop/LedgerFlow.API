using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    /// <summary>
    /// Enforces subscription plan limits for companies.
    /// SpendSync supports: Starter and Business plans.
    /// </summary>
    public class PlanEnforcementService
    {
        private readonly AppDbContext _context;

        public PlanEnforcementService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Check if company can add more users based on their plan.
        /// Starter: 10 users max
        /// Business: Unlimited users
        /// </summary>
        public async Task<(bool allowed, string message)> CanAddUserAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                return (false, "Company not found");

            if (company.Status != "Active")
                return (false, "Company account is suspended");

            // Business plan has unlimited users (-1)
            if (company.Plan!.MaxUsers == -1)
                return (true, "OK");

            var currentUserCount = await _context.Users
                .CountAsync(u => u.CompanyId == companyId && u.IsActive);

            if (currentUserCount >= company.Plan.MaxUsers)
                return (false, $"User limit reached. Your {company.Plan.Name} plan supports {company.Plan.MaxUsers} users maximum. Upgrade to Business for unlimited users.");

            return (true, "OK");
        }

        /// <summary>
        /// Check if company can submit more expenses this month based on their plan.
        /// Starter: 100 expenses/month
        /// Business: Unlimited expenses
        /// </summary>
        public async Task<(bool allowed, string message)> CanSubmitExpenseAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                return (false, "Company not found");

            if (company.Status != "Active")
                return (false, "Company account is suspended");

            // Business plan has unlimited expenses (-1)
            if (company.Plan!.MaxExpensesPerMonth == -1)
                return (true, "OK");

            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var expenseCountThisMonth = await _context.Expenses
                .CountAsync(e => e.CompanyId == companyId && e.SubmittedAt >= startOfMonth);

            if (expenseCountThisMonth >= company.Plan.MaxExpensesPerMonth)
                return (false, $"Monthly expense limit reached. Your {company.Plan.Name} plan allows {company.Plan.MaxExpensesPerMonth} expenses per month. Upgrade to Business for unlimited expenses.");

            return (true, "OK");
        }

        /// <summary>
        /// Check if company can upload receipts based on their plan.
        /// Starter: Receipt uploads enabled ✅
        /// Business: Receipt uploads enabled ✅
        /// NOTE: Receipt uploads are now available in ALL plans as a core feature
        /// </summary>
        public async Task<(bool allowed, string message)> CanUploadReceiptAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                return (false, "Company not found");

            if (company.Status != "Active")
                return (false, "Company account is suspended");

            // ✅ Receipt uploads now available in all plans
            if (!company.Plan!.CanUploadReceipt)
                return (false, $"Receipt upload not available in {company.Plan.Name} plan.");

            return (true, "OK");
        }

        /// <summary>
        /// Check if company has access to advanced reports.
        /// Starter: Basic reports only
        /// Business: Advanced reports enabled
        /// </summary>
        public async Task<bool> HasAdvancedReportsAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            return company?.Plan?.HasAdvancedReports ?? false;
        }

        /// <summary>
        /// Check if company has access to advanced analytics.
        /// Starter: No advanced analytics
        /// Business: Advanced analytics enabled
        /// </summary>
        public async Task<bool> HasAdvancedAnalyticsAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            return company?.Plan?.HasAdvancedAnalytics ?? false;
        }

        /// <summary>
        /// Check if company has access to department features.
        /// Starter: No departments
        /// Business: Departments enabled
        /// </summary>
        public async Task<bool> HasDepartmentSupportAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            return company?.Plan?.HasDepartmentAnalytics ?? false;
        }

        /// <summary>
        /// Check if company has access to role-based workflows (Finance & Audit roles).
        /// Starter: Admin & Employee roles only
        /// Business: Finance & Audit roles enabled
        /// </summary>
        public async Task<bool> HasRoleBasedWorkflowsAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            return company?.Plan?.HasRoleBasedWorkflows ?? false;
        }

        /// <summary>
        /// Get company's plan details.
        /// </summary>
        public async Task<Plan?> GetCompanyPlanAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            return company?.Plan;
        }

        /// <summary>
        /// Get plan feature summary for display.
        /// </summary>
        public async Task<PlanFeatureSummary?> GetPlanFeaturesAsync(int companyId)
        {
            var plan = await GetCompanyPlanAsync(companyId);
            if (plan == null) return null;

            return new PlanFeatureSummary
            {
                PlanName = plan.Name,
                MaxUsers = plan.MaxUsers,
                MaxExpensesPerMonth = plan.MaxExpensesPerMonth,
                CanUploadReceipt = plan.CanUploadReceipt,
                HasAdvancedReports = plan.HasAdvancedReports,
                HasAdvancedAnalytics = plan.HasAdvancedAnalytics,
                HasDepartmentAnalytics = plan.HasDepartmentAnalytics,
                HasRoleBasedWorkflows = plan.HasRoleBasedWorkflows,
                HasPrioritySupport = plan.HasPrioritySupport
            };
        }
    }

    /// <summary>
    /// Summary of plan features for display purposes.
    /// </summary>
    public class PlanFeatureSummary
    {
        public string PlanName { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int MaxExpensesPerMonth { get; set; }
        public bool CanUploadReceipt { get; set; }
        public bool HasAdvancedReports { get; set; }
        public bool HasAdvancedAnalytics { get; set; }
        public bool HasDepartmentAnalytics { get; set; }
        public bool HasRoleBasedWorkflows { get; set; }
        public bool HasPrioritySupport { get; set; }
    }
}
