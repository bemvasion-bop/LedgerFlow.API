using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Services;
using LedgerFlow.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly DatabaseSeeder _seeder;
        private readonly AppDbContext _context;
        private readonly ILogger<SeedController> _logger;

        public SeedController(DatabaseSeeder seeder, AppDbContext context, ILogger<SeedController> logger)
        {
            _seeder = seeder;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Seed the database with comprehensive demo data for presentation
        /// </summary>
        [HttpPost("demo-data")]
        [AllowAnonymous] // Remove this in production or add proper authorization
        public async Task<IActionResult> SeedDemoData()
        {
            try
            {
                _logger.LogInformation("🌱 Seeding demo data requested via API...");

                await _seeder.SeedDemoDataAsync();

                var stats = await GetDatabaseStatsAsync();

                return Ok(new
                {
                    success = true,
                    message = "Demo data seeded successfully! 🎉",
                    statistics = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding demo data");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to seed demo data",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get current database statistics
        /// </summary>
        [HttpGet("stats")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var stats = await GetDatabaseStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting database stats");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Clear all demo data (use with caution!)
        /// </summary>
        [HttpDelete("clear-demo-data")]
        [AllowAnonymous] // Remove this in production or add proper authorization
        public async Task<IActionResult> ClearDemoData()
        {
            try
            {
                _logger.LogWarning("⚠️ Clearing demo data requested via API...");

                // Delete in correct order to respect foreign keys
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Notifications");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM AuditLogs");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Approvals");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Receipts");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Expenses");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Users WHERE Email NOT LIKE '%superadmin%'");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Departments");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Companies WHERE Name != 'Demo Company'");

                _logger.LogInformation("✅ Demo data cleared successfully");

                return Ok(new
                {
                    success = true,
                    message = "Demo data cleared successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing demo data");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to clear demo data",
                    error = ex.Message
                });
            }
        }

        private async Task<object> GetDatabaseStatsAsync()
        {
            return new
            {
                companies = await _context.Companies.CountAsync(),
                users = await _context.Users.CountAsync(),
                expenses = await _context.Expenses.CountAsync(),
                receipts = await _context.Receipts.CountAsync(),
                approvals = await _context.Approvals.CountAsync(),
                auditLogs = await _context.AuditLogs.CountAsync(),
                notifications = await _context.Notifications.CountAsync(),
                departments = await _context.Departments.CountAsync(),
                categories = await _context.Categories.CountAsync(),
                expensesByStatus = new
                {
                    pending = await _context.Expenses.CountAsync(e => e.Status == "Pending"),
                    approved = await _context.Expenses.CountAsync(e => e.Status == "Approved"),
                    rejected = await _context.Expenses.CountAsync(e => e.Status == "Rejected"),
                    reimbursed = await _context.Expenses.CountAsync(e => e.Status == "Reimbursed")
                },
                companiesByPlan = new
                {
                    starter = await _context.Companies.CountAsync(c => c.Plan!.Name == "Starter"),
                    business = await _context.Companies.CountAsync(c => c.Plan!.Name == "Business")
                }
            };
        }
    }
}
