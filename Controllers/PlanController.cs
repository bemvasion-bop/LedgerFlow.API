using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using LedgerFlow.API.Data;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlanController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PlanController> _logger;

        public PlanController(AppDbContext context, ILogger<PlanController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get current user's company plan and subscription information
        /// </summary>
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentPlan()
        {
            try
            {
                var companyIdClaim = User.FindFirst("CompanyId");
                if (companyIdClaim == null)
                {
                    _logger.LogWarning("CompanyId claim not found in token");
                    return Unauthorized(new { message = "CompanyId not found in token" });
                }

                var companyId = int.Parse(companyIdClaim.Value);
                _logger.LogInformation("Fetching plan information for company {CompanyId}", companyId);

                var company = await _context.Companies
                    .Include(c => c.Plan)
                    .FirstOrDefaultAsync(c => c.Id == companyId);

                if (company == null)
                {
                    _logger.LogWarning("Company {CompanyId} not found", companyId);
                    return NotFound(new { message = "Company not found" });
                }

                if (company.Plan == null)
                {
                    _logger.LogWarning("Company {CompanyId} has no plan assigned", companyId);
                    return NotFound(new { message = "No plan assigned to company" });
                }

                // Calculate trial days remaining
                int? trialDaysRemaining = null;
                if (company.SubscriptionStatus == "Trial" && company.TrialEndsAt.HasValue)
                {
                    var daysRemaining = (company.TrialEndsAt.Value - DateTime.UtcNow).Days;
                    trialDaysRemaining = daysRemaining > 0 ? daysRemaining : 0;
                }

                var response = new
                {
                    companyId = company.Id,
                    companyName = company.Name,
                    planId = company.Plan.Id,
                    planName = company.Plan.Name,
                    planDescription = company.Plan.Description,
                    subscriptionStatus = company.SubscriptionStatus,
                    trialDaysRemaining = trialDaysRemaining,
                    trialEndsAt = company.TrialEndsAt,
                    subscriptionStartedAt = company.SubscriptionStartedAt,
                    subscriptionExpiresAt = company.SubscriptionExpiresAt,
                    billingCycle = company.BillingCycle,
                    maxUsers = company.Plan.MaxUsers,
                    maxExpensesPerMonth = company.Plan.MaxExpensesPerMonth,
                    canUploadReceipt = company.Plan.CanUploadReceipt,
                    hasAdvancedReports = company.Plan.HasAdvancedReports,
                    hasAdvancedAnalytics = company.Plan.HasAdvancedAnalytics,
                    hasDepartmentAnalytics = company.Plan.HasDepartmentAnalytics,
                    hasRoleBasedWorkflows = company.Plan.HasRoleBasedWorkflows,
                    hasPrioritySupport = company.Plan.HasPrioritySupport,
                    quarterlyPrice = company.Plan.QuarterlyPrice,
                    yearlyPrice = company.Plan.YearlyPrice
                };

                _logger.LogInformation("Successfully retrieved plan information for company {CompanyId}: {PlanName}", 
                    companyId, company.Plan.Name);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching plan information");
                return StatusCode(500, new { message = "Failed to fetch plan information", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all available plans (for upgrade options)
        /// </summary>
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailablePlans()
        {
            try
            {
                var plans = await _context.Plans
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        quarterlyPrice = p.QuarterlyPrice,
                        yearlyPrice = p.YearlyPrice,
                        maxUsers = p.MaxUsers,
                        maxExpensesPerMonth = p.MaxExpensesPerMonth,
                        canUploadReceipt = p.CanUploadReceipt,
                        hasAdvancedReports = p.HasAdvancedReports,
                        hasAdvancedAnalytics = p.HasAdvancedAnalytics,
                        hasDepartmentAnalytics = p.HasDepartmentAnalytics,
                        hasRoleBasedWorkflows = p.HasRoleBasedWorkflows,
                        hasPrioritySupport = p.HasPrioritySupport,
                        trialDays = p.TrialDays
                    })
                    .ToListAsync();

                return Ok(plans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching available plans");
                return StatusCode(500, new { message = "Failed to fetch available plans" });
            }
        }
    }
}
