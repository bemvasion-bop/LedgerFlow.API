using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")]
    public class SuperAdminSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SuperAdminSettingsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get Super Admin settings for current user
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);

            var settings = await _context.SuperAdminSettings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            // Create default settings if not exists
            if (settings == null)
            {
                settings = new SuperAdminSettings
                {
                    UserId = userId,
                    EmailNotifications = true,
                    ApprovalAlerts = true,
                    SecurityAlerts = true,
                    Theme = "Dark",
                    Currency = "PHP",
                    Timezone = "Asia/Manila",
                    DateFormat = "MM/DD/YYYY",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SuperAdminSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return Ok(settings);
        }

        /// <summary>
        /// Update Super Admin settings
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] UpdateSettingsRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);

            var settings = await _context.SuperAdminSettings
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (settings == null)
            {
                // Create new settings
                settings = new SuperAdminSettings
                {
                    UserId = userId,
                    EmailNotifications = request.EmailNotifications,
                    ApprovalAlerts = request.ApprovalAlerts,
                    SecurityAlerts = request.SecurityAlerts,
                    Theme = request.Theme ?? "Dark",
                    Currency = request.Currency ?? "PHP",
                    Timezone = request.Timezone ?? "Asia/Manila",
                    DateFormat = request.DateFormat ?? "MM/DD/YYYY",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.SuperAdminSettings.Add(settings);
            }
            else
            {
                // Update existing settings
                settings.EmailNotifications = request.EmailNotifications;
                settings.ApprovalAlerts = request.ApprovalAlerts;
                settings.SecurityAlerts = request.SecurityAlerts;
                settings.Theme = request.Theme ?? settings.Theme;
                settings.Currency = request.Currency ?? settings.Currency;
                settings.Timezone = request.Timezone ?? settings.Timezone;
                settings.DateFormat = request.DateFormat ?? settings.DateFormat;
                settings.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Settings updated successfully", settings });
        }
    }

    // DTOs
    public class UpdateSettingsRequest
    {
        public bool EmailNotifications { get; set; } = true;
        public bool ApprovalAlerts { get; set; } = true;
        public bool SecurityAlerts { get; set; } = true;
        public string? Theme { get; set; }
        public string? Currency { get; set; }
        public string? Timezone { get; set; }
        public string? DateFormat { get; set; }
    }
}
