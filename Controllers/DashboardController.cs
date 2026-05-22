using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/dashboard/admin
        /// Returns summary stats for the Admin dashboard.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("admin")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            try
            {
                // Get user's company for tenant isolation
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return Unauthorized();

                var query = _context.Expenses
                    .Where(e => e.CompanyId == user.CompanyId); // Tenant isolation

                var totalExpenses    = await query.CountAsync();
                var totalAmount      = await query.SumAsync(e => (decimal?)e.Amount) ?? 0m;
                var pendingCount     = await query.CountAsync(e => e.Status == "Pending");
                var approvedCount    = await query.CountAsync(e => e.Status == "Approved");
                var rejectedCount    = await query.CountAsync(e => e.Status == "Rejected");
                var reimbursedCount  = await query.CountAsync(e => e.Status == "Reimbursed");

                // Total users in company
                var totalUsers = await _context.Users
                    .CountAsync(u => u.CompanyId == user.CompanyId && u.IsActive);

                // Recent 5 expenses with submitter name
                var recentExpenses = await _context.Expenses
                    .Include(e => e.User)
                    .Where(e => e.CompanyId == user.CompanyId)
                    .OrderByDescending(e => e.SubmittedAt)
                    .Take(5)
                    .Select(e => new
                    {
                        e.Id,
                        e.Description,
                        e.Amount,
                        e.Category,
                        e.Status,
                        e.SubmittedAt,
                        UserName = e.User != null
                            ? e.User.FirstName + " " + e.User.LastName
                            : "Unknown"
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalUsers,
                    totalExpenses,
                    totalAmount,
                    pendingApprovals = pendingCount,
                    approvedExpenses = approvedCount,
                    rejectedExpenses = rejectedCount,
                    reimbursedExpenses = reimbursedCount,
                    recentExpenses
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
