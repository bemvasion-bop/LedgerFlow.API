using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class AuditLogService
    {
        private readonly AppDbContext _context;

        public AuditLogService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Log an action to the audit log
        /// </summary>
        public async Task LogActionAsync(int userId, int companyId, string action, string entity, string? entityId = null, string? details = null)
        {
            var auditLog = new AuditLog
            {
                UserId = userId,
                CompanyId = companyId,
                Action = action,
                Entity = entity,
                EntityId = entityId,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Log an action synchronously (for use in non-async contexts)
        /// </summary>
        public void LogAction(int userId, int companyId, string action, string entity, string? entityId = null)
        {
            var auditLog = new AuditLog
            {
                UserId = userId,
                CompanyId = companyId,
                Action = action,
                Entity = entity,
                EntityId = entityId,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            _context.SaveChanges();
        }

        /// <summary>
        /// Get audit logs with pagination and filtering
        /// </summary>
        public async Task<(List<AuditLogDto> Logs, int Total)> GetAuditLogsAsync(
            int? userId = null,
            string? action = null,
            string? entity = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                    .ThenInclude(u => u!.Company)
                .AsQueryable();

            // Apply filters
            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);

            if (!string.IsNullOrEmpty(entity))
                query = query.Where(a => a.Entity == entity);

            if (startDate.HasValue)
                query = query.Where(a => a.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.Timestamp <= endDate.Value);

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    UserEmail = a.User != null ? a.User.Email : "Unknown",
                    UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "Unknown",
                    Action = a.Action,
                    Entity = a.Entity,
                    EntityId = a.EntityId,
                    CompanyId = a.CompanyId,
                    CompanyName = a.User != null && a.User.Company != null ? a.User.Company.Name : "Unknown Company",
                    Details = a.EntityId ?? string.Empty,
                    IpAddress = string.Empty,
                    Timestamp = a.Timestamp
                })
                .ToListAsync();

            return (logs, total);
        }

        /// <summary>
        /// Get audit logs for a specific company (tenant isolation)
        /// </summary>
        public async Task<(List<AuditLogDto> Logs, int Total)> GetCompanyAuditLogsAsync(
            int companyId,
            int? userId = null,
            string? action = null,
            string? entity = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 20)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                    .ThenInclude(u => u!.Company)
                .Where(a => a.CompanyId == companyId);

            // Apply filters
            if (userId.HasValue)
                query = query.Where(a => a.UserId == userId.Value);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);

            if (!string.IsNullOrEmpty(entity))
                query = query.Where(a => a.Entity == entity);

            if (startDate.HasValue)
                query = query.Where(a => a.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.Timestamp <= endDate.Value);

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    UserEmail = a.User != null ? a.User.Email : "Unknown",
                    UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "Unknown",
                    Action = a.Action,
                    Entity = a.Entity,
                    EntityId = a.EntityId,
                    CompanyId = a.CompanyId,
                    CompanyName = a.User != null && a.User.Company != null ? a.User.Company.Name : "Unknown Company",
                    Details = a.EntityId ?? string.Empty,
                    IpAddress = string.Empty,
                    Timestamp = a.Timestamp
                })
                .ToListAsync();

            return (logs, total);
        }

        /// <summary>
        /// Get audit statistics
        /// </summary>
        public async Task<AuditStatsDto> GetAuditStatsAsync(int companyId)
        {
            var logs = _context.AuditLogs.Where(a => a.CompanyId == companyId);

            var stats = new AuditStatsDto
            {
                TotalLogs = await logs.CountAsync(),
                TodayLogs = await logs.CountAsync(a => a.Timestamp.Date == DateTime.UtcNow.Date),
                LoginCount = await logs.CountAsync(a => a.Action == "LOGIN"),
                LogoutCount = await logs.CountAsync(a => a.Action == "LOGOUT"),
                ExpenseCreated = await logs.CountAsync(a => a.Action == "CREATE" && a.Entity == "Expense"),
                ExpenseApproved = await logs.CountAsync(a => a.Action == "APPROVE"),
                ExpenseRejected = await logs.CountAsync(a => a.Action == "REJECT"),
                ByAction = await logs
                    .GroupBy(a => a.Action)
                    .Select(g => new ActionCount { Action = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToListAsync()
            };

            return stats;
        }

        /// <summary>
        /// Get global audit logs (SuperAdmin only - no company filter)
        /// </summary>
        public async Task<(List<AuditLogDto> Logs, int Total)> GetGlobalAuditLogsAsync(
            int? companyId = null,
            string? action = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int pageNumber = 1,
            int pageSize = 50)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                    .ThenInclude(u => u!.Company)
                .AsQueryable();

            // Apply filters
            if (companyId.HasValue)
                query = query.Where(a => a.CompanyId == companyId.Value);

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action == action);

            if (startDate.HasValue)
                query = query.Where(a => a.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(a => a.Timestamp <= endDate.Value);

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    UserEmail = a.User != null ? a.User.Email : "Unknown",
                    UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "Unknown",
                    Action = a.Action,
                    Entity = a.Entity,
                    EntityId = a.EntityId,
                    CompanyId = a.CompanyId,
                    CompanyName = a.CompanyId == 0 
                        ? "SpendSync Platform" 
                        : (a.User != null && a.User.Company != null ? a.User.Company.Name : "Unknown Company"),
                    Details = a.EntityId ?? string.Empty,
                    IpAddress = string.Empty,
                    Timestamp = a.Timestamp
                })
                .ToListAsync();

            return (logs, total);
        }
    }

    // DTOs
    public class AuditLogDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    public class AuditStatsDto
    {
        public int TotalLogs { get; set; }
        public int TodayLogs { get; set; }
        public int LoginCount { get; set; }
        public int LogoutCount { get; set; }
        public int ExpenseCreated { get; set; }
        public int ExpenseApproved { get; set; }
        public int ExpenseRejected { get; set; }
        public List<ActionCount> ByAction { get; set; } = new();
    }

    public class ActionCount
    {
        public string Action { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
