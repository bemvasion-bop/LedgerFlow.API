using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Data;
using LedgerFlow.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        // Helper to get user ID, role, and CompanyId from claims
        private (int UserId, string Role, int CompanyId) GetUserContext()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            var companyIdClaim = User.FindFirst("CompanyId");

            if (userIdClaim == null || roleClaim == null || companyIdClaim == null)
                throw new UnauthorizedAccessException("User context not found");

            return (int.Parse(userIdClaim.Value), roleClaim.Value, int.Parse(companyIdClaim.Value));
        }

        /// <summary>
        /// GET /api/reports/summary
        /// Expense summary statistics (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                // CRITICAL: Extract CompanyId from JWT token for tenant isolation
                var (userId, role, companyId) = GetUserContext();
                
                var query = _context.Expenses
                    .Where(e => e.CompanyId == companyId); // CRITICAL: Filter by CompanyId

                var summary = new
                {
                    totalExpenses   = await query.CountAsync(),
                    approvedAmount  = await query.Where(e => e.Status == "Approved").SumAsync(e => (decimal?)e.Amount) ?? 0m,
                    pendingAmount   = await query.Where(e => e.Status == "Pending").SumAsync(e => (decimal?)e.Amount) ?? 0m,
                    rejectedAmount  = await query.Where(e => e.Status == "Rejected").SumAsync(e => (decimal?)e.Amount) ?? 0m
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// GET /api/reports/expenses?dateFrom=&dateTo=&status=
        /// Filtered expense list for reports (Admin and Audit)
        /// </summary>
        [Authorize(Roles = "Admin,Audit")]
        [HttpGet("expenses")]
        public async Task<IActionResult> GetExpenseReport(
            [FromQuery] DateTime? dateFrom = null,
            [FromQuery] DateTime? dateTo   = null,
            [FromQuery] string?   status   = null)
        {
            try
            {
                // CRITICAL: Extract CompanyId from JWT token for tenant isolation
                var (userId, role, companyId) = GetUserContext();
                
                var query = _context.Expenses
                    .Include(e => e.User)
                    .Where(e => e.CompanyId == companyId); // CRITICAL: Filter by CompanyId

                if (dateFrom.HasValue)
                    query = query.Where(e => e.SubmittedAt >= dateFrom.Value);

                if (dateTo.HasValue)
                    // include the full end day
                    query = query.Where(e => e.SubmittedAt <= dateTo.Value.AddDays(1).AddTicks(-1));

                if (!string.IsNullOrWhiteSpace(status))
                    query = query.Where(e => e.Status == status);

                var results = await query
                    .OrderByDescending(e => e.SubmittedAt)
                    .Select(e => new
                    {
                        e.Id,
                        e.Description,
                        e.Amount,
                        e.Category,
                        e.Status,
                        e.SubmittedAt,
                        e.ApprovedAt,
                        e.RejectionReason,
                        UserName = e.User != null
                            ? e.User.FirstName + " " + e.User.LastName
                            : "Unknown",
                        UserEmail = e.User != null ? e.User.Email : ""
                    })
                    .ToListAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}