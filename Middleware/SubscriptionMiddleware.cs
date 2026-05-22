using LedgerFlow.API.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LedgerFlow.API.Middleware
{
    /// <summary>
    /// Middleware to enforce subscription status and plan limits
    /// </summary>
    public class SubscriptionMiddleware
    {
        private readonly RequestDelegate _next;

        public SubscriptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
        {
            // Skip for authentication endpoints and public routes
            var path = context.Request.Path.Value?.ToLower() ?? "";
            if (path.Contains("/auth/") || 
                path.Contains("/superadmin/companies/register") ||
                path.Contains("/superadmin/plans") ||
                path.Contains("/test/"))
            {
                await _next(context);
                return;
            }

            // Skip if user is not authenticated
            if (!context.User.Identity?.IsAuthenticated ?? true)
            {
                await _next(context);
                return;
            }

            // Skip for SuperAdmin
            var role = context.User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "SuperAdmin")
            {
                await _next(context);
                return;
            }

            // Get user's company ID
            var companyIdClaim = context.User.FindFirst("CompanyId")?.Value;
            if (string.IsNullOrEmpty(companyIdClaim) || !int.TryParse(companyIdClaim, out int companyId))
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { message = "Invalid company information" });
                return;
            }

            // Get company with plan
            var company = await dbContext.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { message = "Company not found" });
                return;
            }

            // Check subscription status
            if (company.SubscriptionStatus == "Suspended")
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Your company's subscription has been suspended. Please contact support.",
                    subscriptionStatus = "Suspended"
                });
                return;
            }

            if (company.SubscriptionStatus == "Expired")
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Your company's subscription has expired. Please renew to continue.",
                    subscriptionStatus = "Expired"
                });
                return;
            }

            // Check if trial has ended
            if (company.SubscriptionStatus == "Trial" && company.TrialEndsAt.HasValue)
            {
                if (DateTime.UtcNow > company.TrialEndsAt.Value)
                {
                    // Auto-expire the trial
                    company.SubscriptionStatus = "Expired";
                    await dbContext.SaveChangesAsync();

                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        message = "Your trial period has ended. Please subscribe to continue.",
                        subscriptionStatus = "Expired",
                        trialEndedAt = company.TrialEndsAt
                    });
                    return;
                }
            }

            // Check plan limits for expense submission
            if (path.Contains("/expenses") && context.Request.Method == "POST")
            {
                if (company.Plan != null && company.Plan.MaxExpensesPerMonth > 0)
                {
                    var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                    var expensesThisMonth = await dbContext.Expenses
                        .CountAsync(e => e.CompanyId == companyId && e.SubmittedAt >= startOfMonth);

                    if (expensesThisMonth >= company.Plan.MaxExpensesPerMonth)
                    {
                        context.Response.StatusCode = 403;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = $"Monthly expense limit reached ({company.Plan.MaxExpensesPerMonth} expenses). Please upgrade your plan.",
                            planName = company.Plan.Name,
                            limit = company.Plan.MaxExpensesPerMonth,
                            current = expensesThisMonth
                        });
                        return;
                    }
                }
            }

            // Store company info in HttpContext for controllers to use
            context.Items["Company"] = company;
            context.Items["Plan"] = company.Plan;

            await _next(context);
        }
    }

    public static class SubscriptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseSubscriptionEnforcement(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SubscriptionMiddleware>();
        }
    }
}
