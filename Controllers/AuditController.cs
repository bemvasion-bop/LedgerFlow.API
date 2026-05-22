using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Services;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/auditlogs")]
    public class AuditController : ControllerBase
    {
        private readonly AuditLogService _auditLogService;

        public AuditController(AuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        // Helper to get user context
        private (int UserId, int CompanyId) GetUserContext()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var companyIdClaim = User.FindFirst("CompanyId");

            if (userIdClaim == null || companyIdClaim == null)
                throw new UnauthorizedAccessException("User context not found");

            return (int.Parse(userIdClaim.Value), int.Parse(companyIdClaim.Value));
        }

        /// <summary>
        /// Get audit logs with filtering and pagination (Admin and Audit roles)
        /// </summary>
        [Authorize(Roles = "Admin,Audit")]
        [HttpGet]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] int? userId = null,
            [FromQuery] string? action = null,
            [FromQuery] string? entity = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var (currentUserId, companyId) = GetUserContext();

                // Get logs for the user's company (tenant isolation)
                var (logs, total) = await _auditLogService.GetCompanyAuditLogsAsync(
                    companyId,
                    userId,
                    action,
                    entity,
                    startDate,
                    endDate,
                    pageNumber,
                    pageSize
                );

                return Ok(new
                {
                    data = logs,
                    total = total,
                    page = pageNumber,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling(total / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get audit statistics for the company
        /// </summary>
        [Authorize(Roles = "Admin,Audit")]
        [HttpGet("stats")]
        public async Task<IActionResult> GetAuditStats()
        {
            try
            {
                var (userId, companyId) = GetUserContext();
                var stats = await _auditLogService.GetAuditStatsAsync(companyId);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get audit logs for a specific user
        /// </summary>
        [Authorize(Roles = "Admin,Audit")]
        [HttpGet("user/{targetUserId}")]
        public async Task<IActionResult> GetLogsByUser(
            int targetUserId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var (currentUserId, companyId) = GetUserContext();

                var (logs, total) = await _auditLogService.GetCompanyAuditLogsAsync(
                    companyId,
                    targetUserId,
                    null,
                    null,
                    null,
                    null,
                    pageNumber,
                    pageSize
                );

                return Ok(new
                {
                    data = logs,
                    total = total,
                    page = pageNumber,
                    pageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get audit logs for a specific action
        /// </summary>
        [Authorize(Roles = "Admin,Audit")]
        [HttpGet("action/{action}")]
        public async Task<IActionResult> GetLogsByAction(
            string action,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var (userId, companyId) = GetUserContext();

                var (logs, total) = await _auditLogService.GetCompanyAuditLogsAsync(
                    companyId,
                    null,
                    action,
                    null,
                    null,
                    null,
                    pageNumber,
                    pageSize
                );

                return Ok(new
                {
                    data = logs,
                    total = total,
                    page = pageNumber,
                    pageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
