using LedgerFlow.API.Data;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class ReportsService
    {
        private readonly AppDbContext _context;

        public ReportsService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get platform overview statistics
        /// </summary>
        public async Task<PlatformOverviewDto> GetPlatformOverviewAsync()
        {
            try
            {
                var totalCompanies = await _context.Companies.CountAsync();
                var activeCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Active");
                var trialCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Trial");
                var expiredCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Expired");
                var totalUsers = await _context.Users.CountAsync();
                var totalExpenses = await _context.Expenses.CountAsync();
                var totalExpenseAmount = await _context.Expenses.SumAsync(e => (decimal?)e.Amount) ?? 0;

                // Calculate active sessions (users who logged in today)
                var today = DateTime.UtcNow.Date;
                var activeSessions = await _context.AuditLogs
                    .Where(a => a.Action == "LOGIN" && a.Timestamp.Date == today)
                    .Select(a => a.UserId)
                    .Distinct()
                    .CountAsync();

                return new PlatformOverviewDto
                {
                    TotalCompanies = totalCompanies,
                    ActiveCompanies = activeCompanies,
                    TrialCompanies = trialCompanies,
                    ExpiredCompanies = expiredCompanies,
                    TotalUsers = totalUsers,
                    TotalExpenses = totalExpenses,
                    TotalExpenseAmount = totalExpenseAmount,
                    ActiveSessions = activeSessions
                };
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetPlatformOverviewAsync: {ex.Message}");
                return new PlatformOverviewDto();
            }
        }

        /// <summary>
        /// Get company growth data over time
        /// </summary>
        public async Task<List<CompanyGrowthDataPoint>> GetCompanyGrowthAsync(int months = 6)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddMonths(-months).Date;
                
                // Step 1: Query and group data (no formatting yet)
                var groupedData = await _context.Companies
                    .Where(c => c.CreatedAt >= startDate)
                    .GroupBy(c => new { c.CreatedAt.Year, c.CreatedAt.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Count = g.Count()
                    })
                    .ToListAsync();

                // Step 2: Format in memory after materialization
                var companies = groupedData
                    .Select(x => new CompanyGrowthDataPoint
                    {
                        Month = $"{x.Year}-{x.Month:D2}",
                        Count = x.Count
                    })
                    .OrderBy(x => x.Month)
                    .ToList();

                return companies;
            }
            catch (Exception ex)
            {
                // Log exception (add logging service if available)
                Console.WriteLine($"Error in GetCompanyGrowthAsync: {ex.Message}");
                return new List<CompanyGrowthDataPoint>();
            }
        }

        /// <summary>
        /// Get user activity data
        /// </summary>
        public async Task<List<UserActivityDataPoint>> GetUserActivityAsync(int days = 30)
        {
            try
            {
                var startDate = DateTime.UtcNow.AddDays(-days).Date;
                
                // Step 1: Query and group data (no formatting yet)
                var groupedData = await _context.AuditLogs
                    .Where(a => a.Timestamp >= startDate && a.Action == "LOGIN")
                    .GroupBy(a => a.Timestamp.Date)
                    .Select(g => new
                    {
                        Date = g.Key,
                        LoginCount = g.Count(),
                        UniqueUsers = g.Select(x => x.UserId).Distinct().Count()
                    })
                    .ToListAsync();

                // Step 2: Format in memory after materialization
                var activity = groupedData
                    .Select(x => new UserActivityDataPoint
                    {
                        Date = x.Date.ToString("yyyy-MM-dd"),
                        LoginCount = x.LoginCount,
                        UniqueUsers = x.UniqueUsers
                    })
                    .OrderBy(x => x.Date)
                    .ToList();

                return activity;
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetUserActivityAsync: {ex.Message}");
                return new List<UserActivityDataPoint>();
            }
        }

        /// <summary>
        /// Get subscription distribution
        /// </summary>
        public async Task<List<SubscriptionDistributionDto>> GetSubscriptionDistributionAsync()
        {
            try
            {
                var distribution = await _context.Companies
                    .GroupBy(c => c.SubscriptionStatus)
                    .Select(g => new SubscriptionDistributionDto
                    {
                        Status = g.Key ?? "Unknown",
                        Count = g.Count()
                    })
                    .ToListAsync();

                return distribution;
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetSubscriptionDistributionAsync: {ex.Message}");
                return new List<SubscriptionDistributionDto>();
            }
        }

        /// <summary>
        /// Get expense analytics by company
        /// </summary>
        public async Task<List<ExpenseByCompanyDto>> GetExpensesByCompanyAsync(int topN = 10)
        {
            try
            {
                var expenses = await _context.Expenses
                    .Include(e => e.User)
                        .ThenInclude(u => u!.Company)
                    .GroupBy(e => new { e.User!.CompanyId, e.User.Company!.Name })
                    .Select(g => new ExpenseByCompanyDto
                    {
                        CompanyName = g.Key.Name,
                        TotalExpenses = g.Count(),
                        TotalAmount = g.Sum(e => e.Amount)
                    })
                    .OrderByDescending(x => x.TotalAmount)
                    .Take(topN)
                    .ToListAsync();

                return expenses;
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetExpensesByCompanyAsync: {ex.Message}");
                return new List<ExpenseByCompanyDto>();
            }
        }

        /// <summary>
        /// Get expense analytics by category
        /// </summary>
        public async Task<List<ExpenseByCategoryDto>> GetExpensesByCategoryAsync()
        {
            try
            {
                var expenses = await _context.Expenses
                    .GroupBy(e => e.Category)
                    .Select(g => new ExpenseByCategoryDto
                    {
                        Category = g.Key,
                        Count = g.Count(),
                        TotalAmount = g.Sum(e => e.Amount)
                    })
                    .OrderByDescending(x => x.TotalAmount)
                    .ToListAsync();

                return expenses;
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetExpensesByCategoryAsync: {ex.Message}");
                return new List<ExpenseByCategoryDto>();
            }
        }

        /// <summary>
        /// Get top companies by various metrics
        /// </summary>
        public async Task<List<TopCompanyDto>> GetTopCompaniesAsync(int topN = 10)
        {
            try
            {
                var companies = await _context.Companies
                    .Select(c => new TopCompanyDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        UserCount = _context.Users.Count(u => u.CompanyId == c.Id),
                        ExpenseCount = _context.Expenses.Count(e => e.User!.CompanyId == c.Id),
                        TotalExpenseAmount = _context.Expenses
                            .Where(e => e.User!.CompanyId == c.Id)
                            .Sum(e => (decimal?)e.Amount) ?? 0,
                        PlanName = c.Plan != null ? c.Plan.Name : "N/A",
                        Status = c.SubscriptionStatus ?? "Unknown"
                    })
                    .OrderByDescending(x => x.TotalExpenseAmount)
                    .Take(topN)
                    .ToListAsync();

                return companies;
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetTopCompaniesAsync: {ex.Message}");
                return new List<TopCompanyDto>();
            }
        }

        /// <summary>
        /// Get most active users
        /// </summary>
        public async Task<List<MostActiveUserDto>> GetMostActiveUsersAsync(int topN = 10)
        {
            try
            {
                // Step 1: Query and group data (no string formatting yet)
                var groupedData = await _context.AuditLogs
                    .Include(a => a.User)
                        .ThenInclude(u => u!.Company)
                    .Include(a => a.User)
                        .ThenInclude(u => u!.Role)
                    .GroupBy(a => new 
                    { 
                        a.UserId, 
                        a.User!.FirstName, 
                        a.User.LastName, 
                        a.User.Email, 
                        CompanyName = a.User.Company!.Name, 
                        RoleName = a.User.Role!.RoleName 
                    })
                    .Select(g => new
                    {
                        g.Key.UserId,
                        g.Key.FirstName,
                        g.Key.LastName,
                        g.Key.Email,
                        g.Key.CompanyName,
                        g.Key.RoleName,
                        ActivityCount = g.Count(),
                        LastActivity = g.Max(a => a.Timestamp)
                    })
                    .OrderByDescending(x => x.ActivityCount)
                    .Take(topN)
                    .ToListAsync();

                // Step 2: Format in memory after materialization
                var users = groupedData
                    .Select(x => new MostActiveUserDto
                    {
                        UserId = x.UserId,
                        UserName = $"{x.FirstName} {x.LastName}",
                        Email = x.Email,
                        CompanyName = x.CompanyName,
                        RoleName = x.RoleName,
                        ActivityCount = x.ActivityCount,
                        LastActivity = x.LastActivity
                    })
                    .ToList();

                return users;
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetMostActiveUsersAsync: {ex.Message}");
                return new List<MostActiveUserDto>();
            }
        }

        /// <summary>
        /// Get recent platform activities
        /// </summary>
        public async Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count = 20)
        {
            try
            {
                var activities = await _context.AuditLogs
                    .Include(a => a.User)
                        .ThenInclude(u => u!.Company)
                    .OrderByDescending(a => a.Timestamp)
                    .Take(count)
                    .Select(a => new RecentActivityDto
                    {
                        Id = a.Id,
                        Timestamp = a.Timestamp,
                        CompanyName = a.User != null && a.User.Company != null ? a.User.Company.Name : "Unknown",
                        UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "Unknown",
                        Action = a.Action,
                        Details = a.EntityId ?? ""
                    })
                    .ToListAsync();

                return activities;
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetRecentActivitiesAsync: {ex.Message}");
                return new List<RecentActivityDto>();
            }
        }

        /// <summary>
        /// Get system health metrics
        /// </summary>
        public async Task<SystemHealthDto> GetSystemHealthAsync()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
                var totalCompanies = await _context.Companies.CountAsync();
                var activeCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Active");
                
                // Calculate today's activity
                var today = DateTime.UtcNow.Date;
                var todayLogins = await _context.AuditLogs.CountAsync(a => a.Action == "LOGIN" && a.Timestamp.Date == today);
                var todayExpenses = await _context.Expenses.CountAsync(e => e.SubmittedAt.Date == today);

                return new SystemHealthDto
                {
                    TotalUsers = totalUsers,
                    ActiveUsers = activeUsers,
                    UserHealthPercentage = totalUsers > 0 ? (int)((double)activeUsers / totalUsers * 100) : 0,
                    TotalCompanies = totalCompanies,
                    ActiveCompanies = activeCompanies,
                    CompanyHealthPercentage = totalCompanies > 0 ? (int)((double)activeCompanies / totalCompanies * 100) : 0,
                    TodayLogins = todayLogins,
                    TodayExpenses = todayExpenses,
                    DatabaseStatus = "Healthy",
                    ApiStatus = "Operational"
                };
            }
            catch (Exception ex)
            {
                // Log exception
                Console.WriteLine($"Error in GetSystemHealthAsync: {ex.Message}");
                return new SystemHealthDto
                {
                    DatabaseStatus = "Error",
                    ApiStatus = "Error"
                };
            }
        }
    }

    // DTOs
    public class PlatformOverviewDto
    {
        public int TotalCompanies { get; set; }
        public int ActiveCompanies { get; set; }
        public int TrialCompanies { get; set; }
        public int ExpiredCompanies { get; set; }
        public int TotalUsers { get; set; }
        public int TotalExpenses { get; set; }
        public decimal TotalExpenseAmount { get; set; }
        public int ActiveSessions { get; set; }
    }

    public class CompanyGrowthDataPoint
    {
        public string Month { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class UserActivityDataPoint
    {
        public string Date { get; set; } = string.Empty;
        public int LoginCount { get; set; }
        public int UniqueUsers { get; set; }
    }

    public class SubscriptionDistributionDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class ExpenseByCompanyDto
    {
        public string CompanyName { get; set; } = string.Empty;
        public int TotalExpenses { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class ExpenseByCategoryDto
    {
        public string Category { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class TopCompanyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UserCount { get; set; }
        public int ExpenseCount { get; set; }
        public decimal TotalExpenseAmount { get; set; }
        public string PlanName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class MostActiveUserDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public int ActivityCount { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class RecentActivityDto
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
    }

    public class SystemHealthDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int UserHealthPercentage { get; set; }
        public int TotalCompanies { get; set; }
        public int ActiveCompanies { get; set; }
        public int CompanyHealthPercentage { get; set; }
        public int TodayLogins { get; set; }
        public int TodayExpenses { get; set; }
        public string DatabaseStatus { get; set; } = string.Empty;
        public string ApiStatus { get; set; } = string.Empty;
    }
}
