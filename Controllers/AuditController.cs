using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditController(AppDbContext context)
        {
            _context = context;
        }

        // 🔍 GET: api/audit
        // Only Admin can view logs
        [Authorize(Roles = "Audit")]
        [HttpGet]
        public IActionResult GetAuditLogs()
        {
            var logs = _context.AuditLogs
                .OrderByDescending(a => a.Timestamp) // latest first
                .ToList();

            return Ok(logs);
        }

        // 🔍 GET: api/audit/user/1
        // View logs for specific user
        [Authorize(Roles = "Audit")]
        [HttpGet("user/{userId}")]
        public IActionResult GetLogsByUser(int userId)
        {
            var logs = _context.AuditLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .ToList();

            return Ok(logs);
        }

        // 🔍 GET: api/audit/action/CREATE
        // Filter by action
        [Authorize(Roles = "Audit")]
        [HttpGet("action/{action}")]
        public IActionResult GetLogsByAction(string action)
        {
            var logs = _context.AuditLogs
                .Where(a => a.Action == action)
                .OrderByDescending(a => a.Timestamp)
                .ToList();

            return Ok(logs);
        }
    }
}