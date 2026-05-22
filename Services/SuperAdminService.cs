using LedgerFlow.API.Data;
using LedgerFlow.API.DTOs;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public interface ISuperAdminService
    {
        Task<List<CompanyListDto>> GetAllCompaniesAsync();
        Task<CompanyDetailDto?> GetCompanyDetailAsync(int companyId);
        Task<SystemStatsDto> GetSystemStatsAsync();
        Task<bool> UpdateCompanyPlanAsync(UpdateCompanyPlanDto dto);
        Task<bool> UpdateSubscriptionStatusAsync(UpdateSubscriptionStatusDto dto);
        Task<bool> SuspendCompanyAsync(int companyId);
        Task<bool> ActivateCompanyAsync(int companyId);
        Task<CompanyDetailDto?> RegisterCompanyAsync(CompanyRegistrationDto dto);
        Task<List<PlanDto>> GetAllPlansAsync();
        Task<bool> ExtendTrialAsync(int companyId, int days);
        Task<List<PlatformActivityDto>> GetPlatformActivityAsync(int days = 30);
        Task<List<CompanyGrowthDto>> GetCompanyGrowthAsync(int months = 6);
        Task<CompanyDetailDto?> CreateCompanyAsync(CreateCompanyDto dto);
        Task<CompanyDetailDto?> UpdateCompanyAsync(int companyId, UpdateCompanyDto dto);
        Task<bool> DeleteCompanyAsync(int companyId);
        Task<CompanyDetailDto?> CreateCompanyWithAdminAsync(SuperAdminCreateCompanyDto dto);
        Task<CompanyDetailDto?> UpdateCompanyWithAdminAsync(int companyId, SuperAdminUpdateCompanyDto dto);
        
        // Platform Users Management
        Task<List<PlatformUserDto>> GetAllPlatformUsersAsync();
        Task<PlatformUserDto?> GetPlatformUserAsync(int userId);
        Task<PlatformUserDto?> CreatePlatformUserAsync(CreatePlatformUserDto dto);
        Task<PlatformUserDto?> UpdatePlatformUserAsync(int userId, UpdatePlatformUserDto dto);
        Task<bool> DeletePlatformUserAsync(int userId);
        Task<bool> ActivateUserAsync(int userId);
        Task<bool> SuspendUserAsync(int userId);
        Task<bool> ResetUserPasswordAsync(ResetUserPasswordDto dto);

        // Subscription Management
        Task<List<SubscriptionDto>> GetAllSubscriptionsAsync();
        Task<SubscriptionStatsDto> GetSubscriptionStatsAsync();
        Task<SubscriptionDto?> GetSubscriptionAsync(int companyId);
        Task<SubscriptionDto?> UpdateSubscriptionAsync(int companyId, UpdateSubscriptionDto dto);
        Task<bool> RenewSubscriptionAsync(RenewSubscriptionDto dto);
        Task<bool> ChangePlanAsync(ChangePlanDto dto);
        Task<bool> ActivateSubscriptionAsync(int companyId);
        Task<bool> SuspendSubscriptionAsync(int companyId);
    }

    public class SuperAdminService : ISuperAdminService
    {
        private readonly AppDbContext _context;

        public SuperAdminService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<CompanyListDto>> GetAllCompaniesAsync()
        {
            var companies = await _context.Companies
                .Include(c => c.Plan)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var result = new List<CompanyListDto>();

            foreach (var company in companies)
            {
                var userCount = await _context.Users.CountAsync(u => u.CompanyId == company.Id);
                var expenseCount = await _context.Expenses.CountAsync(e => e.CompanyId == company.Id);

                result.Add(new CompanyListDto
                {
                    Id = company.Id,
                    Name = company.Name,
                    Email = company.Email,
                    PlanName = company.Plan?.Name ?? "Unknown",
                    SubscriptionStatus = company.SubscriptionStatus,
                    TrialEndsAt = company.TrialEndsAt,
                    SubscriptionExpiresAt = company.SubscriptionExpiresAt,
                    UserCount = userCount,
                    ExpenseCount = expenseCount,
                    CreatedAt = company.CreatedAt
                });
            }

            return result;
        }

        public async Task<CompanyDetailDto?> GetCompanyDetailAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null) return null;

            var userCount = await _context.Users.CountAsync(u => u.CompanyId == companyId);
            var expenseCount = await _context.Expenses.CountAsync(e => e.CompanyId == companyId);

            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var expensesThisMonth = await _context.Expenses
                .CountAsync(e => e.CompanyId == companyId && e.SubmittedAt >= startOfMonth);

            return new CompanyDetailDto
            {
                Id = company.Id,
                Name = company.Name,
                Email = company.Email,
                Phone = company.Phone,
                Address = company.Address,
                PlanId = company.PlanId,
                PlanName = company.Plan?.Name ?? "Unknown",
                SubscriptionStatus = company.SubscriptionStatus,
                TrialEndsAt = company.TrialEndsAt,
                SubscriptionStartedAt = company.SubscriptionStartedAt,
                SubscriptionExpiresAt = company.SubscriptionExpiresAt,
                Status = company.Status,
                UserCount = userCount,
                ExpenseCount = expenseCount,
                ExpensesThisMonth = expensesThisMonth,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };
        }

        public async Task<SystemStatsDto> GetSystemStatsAsync()
        {
            var totalCompanies = await _context.Companies.CountAsync();
            var activeCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Active");
            var trialCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Trial");
            var expiredCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Expired");
            var suspendedCompanies = await _context.Companies.CountAsync(c => c.SubscriptionStatus == "Suspended");
            var totalUsers = await _context.Users.CountAsync();
            var totalExpenses = await _context.Expenses.CountAsync();

            var starterPlanCompanies = await _context.Companies.CountAsync(c => c.Plan != null && c.Plan.Name == "Starter");
            var businessPlanCompanies = await _context.Companies.CountAsync(c => c.Plan != null && c.Plan.Name == "Business");

            return new SystemStatsDto
            {
                TotalCompanies = totalCompanies,
                ActiveCompanies = activeCompanies,
                TrialCompanies = trialCompanies,
                ExpiredCompanies = expiredCompanies,
                SuspendedCompanies = suspendedCompanies,
                TotalUsers = totalUsers,
                TotalExpenses = totalExpenses,
                StarterPlanCompanies = starterPlanCompanies,
                BusinessPlanCompanies = businessPlanCompanies
            };
        }

        public async Task<bool> UpdateCompanyPlanAsync(UpdateCompanyPlanDto dto)
        {
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null) return false;

            var plan = await _context.Plans.FindAsync(dto.PlanId);
            if (plan == null) return false;

            company.PlanId = dto.PlanId;
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateSubscriptionStatusAsync(UpdateSubscriptionStatusDto dto)
        {
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null) return false;

            company.SubscriptionStatus = dto.SubscriptionStatus;
            company.SubscriptionExpiresAt = dto.SubscriptionExpiresAt;
            company.UpdatedAt = DateTime.UtcNow;

            // If activating, set subscription started date
            if (dto.SubscriptionStatus == "Active" && company.SubscriptionStartedAt == null)
            {
                company.SubscriptionStartedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SuspendCompanyAsync(int companyId)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return false;

            company.SubscriptionStatus = "Suspended";
            company.Status = "Suspended";
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActivateCompanyAsync(int companyId)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return false;

            company.SubscriptionStatus = "Active";
            company.Status = "Active";
            company.UpdatedAt = DateTime.UtcNow;

            if (company.SubscriptionStartedAt == null)
            {
                company.SubscriptionStartedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CompanyDetailDto?> RegisterCompanyAsync(CompanyRegistrationDto dto)
        {
            // Check if company email already exists
            var existingCompany = await _context.Companies
                .FirstOrDefaultAsync(c => c.Email == dto.CompanyEmail);
            if (existingCompany != null) return null;

            // Check if admin email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.AdminEmail);
            if (existingUser != null) return null;

            // Get the plan
            var plan = await _context.Plans.FindAsync(dto.PlanId);
            if (plan == null) return null;

            // Create company with trial status
            var company = new Company
            {
                Name = dto.CompanyName,
                Email = dto.CompanyEmail,
                Phone = dto.CompanyPhone,
                Address = dto.CompanyAddress,
                PlanId = dto.PlanId,
                SubscriptionStatus = "Trial",
                TrialEndsAt = DateTime.UtcNow.AddDays(plan.TrialDays),
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // Get Admin role
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
            if (adminRole == null) return null;

            // Create admin user
            var adminUser = new User
            {
                FirstName = dto.AdminFirstName,
                LastName = dto.AdminLastName,
                Email = dto.AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AdminPassword),
                RoleId = adminRole.Id,
                CompanyId = company.Id,
                IsVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            // Return company details
            return await GetCompanyDetailAsync(company.Id);
        }

        public async Task<List<PlanDto>> GetAllPlansAsync()
        {
            var plans = await _context.Plans.ToListAsync();

            return plans.Select(p => new PlanDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                QuarterlyPrice = p.QuarterlyPrice,
                YearlyPrice = p.YearlyPrice,
                MaxUsers = p.MaxUsers,
                MaxExpensesPerMonth = p.MaxExpensesPerMonth,
                CanUploadReceipt = p.CanUploadReceipt,
                HasAdvancedReports = p.HasAdvancedReports,
                HasAdvancedAnalytics = p.HasAdvancedAnalytics,
                HasDepartmentAnalytics = p.HasDepartmentAnalytics,
                HasRoleBasedWorkflows = p.HasRoleBasedWorkflows,
                HasPrioritySupport = p.HasPrioritySupport,
                TrialDays = p.TrialDays
            }).ToList();
        }

        public async Task<bool> ExtendTrialAsync(int companyId, int days)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return false;

            // Extend trial period
            if (company.TrialEndsAt == null)
            {
                company.TrialEndsAt = DateTime.UtcNow.AddDays(days);
            }
            else
            {
                company.TrialEndsAt = company.TrialEndsAt.Value.AddDays(days);
            }

            company.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<PlatformActivityDto>> GetPlatformActivityAsync(int days = 30)
        {
            var startDate = DateTime.UtcNow.AddDays(-days);
            var activities = new List<PlatformActivityDto>();

            // Get daily company registrations
            var registrations = await _context.Companies
                .Where(c => c.CreatedAt >= startDate)
                .GroupBy(c => c.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // Get daily user registrations
            var userRegistrations = await _context.Users
                .Where(u => u.CreatedAt >= startDate)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // Get daily expense submissions
            var expenses = await _context.Expenses
                .Where(e => e.SubmittedAt >= startDate)
                .GroupBy(e => e.SubmittedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // Combine all activities
            for (int i = 0; i < days; i++)
            {
                var date = DateTime.UtcNow.Date.AddDays(-days + i + 1);
                activities.Add(new PlatformActivityDto
                {
                    Date = date,
                    CompanyRegistrations = registrations.FirstOrDefault(r => r.Date == date)?.Count ?? 0,
                    UserRegistrations = userRegistrations.FirstOrDefault(u => u.Date == date)?.Count ?? 0,
                    ExpenseSubmissions = expenses.FirstOrDefault(e => e.Date == date)?.Count ?? 0
                });
            }

            return activities;
        }

        public async Task<List<CompanyGrowthDto>> GetCompanyGrowthAsync(int months = 6)
        {
            var startDate = DateTime.UtcNow.AddMonths(-months);
            var growth = new List<CompanyGrowthDto>();

            for (int i = 0; i < months; i++)
            {
                var monthStart = DateTime.UtcNow.AddMonths(-months + i);
                var monthEnd = monthStart.AddMonths(1);

                var companiesRegistered = await _context.Companies
                    .CountAsync(c => c.CreatedAt >= monthStart && c.CreatedAt < monthEnd);

                var totalCompanies = await _context.Companies
                    .CountAsync(c => c.CreatedAt < monthEnd);

                growth.Add(new CompanyGrowthDto
                {
                    Month = monthStart.ToString("MMM yyyy"),
                    CompaniesRegistered = companiesRegistered,
                    TotalCompanies = totalCompanies
                });
            }

            return growth;
        }

        public async Task<CompanyDetailDto?> CreateCompanyAsync(CreateCompanyDto dto)
        {
            // Check if company email already exists
            var existingCompany = await _context.Companies
                .FirstOrDefaultAsync(c => c.Email == dto.Email);
            if (existingCompany != null) return null;

            // Get the plan
            var plan = await _context.Plans.FindAsync(dto.PlanId);
            if (plan == null) return null;

            // Create company
            var company = new Company
            {
                Name = dto.Name,
                Email = dto.Email,
                ContactPerson = dto.ContactPerson,
                PlanId = dto.PlanId,
                SubscriptionStatus = dto.SubscriptionStatus,
                MaxUsers = dto.MaxUsers,
                TrialEndsAt = dto.SubscriptionStatus == "Trial" ? DateTime.UtcNow.AddDays(plan.TrialDays) : null,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // Return company details
            return await GetCompanyDetailAsync(company.Id);
        }

        public async Task<CompanyDetailDto?> UpdateCompanyAsync(int companyId, UpdateCompanyDto dto)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return null;

            // Check if email is being changed and if it already exists
            if (dto.Email != null && dto.Email != company.Email)
            {
                var existingCompany = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Email == dto.Email && c.Id != companyId);
                if (existingCompany != null) return null;
                company.Email = dto.Email;
            }

            // Update fields if provided
            if (dto.Name != null) company.Name = dto.Name;
            if (dto.ContactPerson != null) company.ContactPerson = dto.ContactPerson;
            if (dto.PlanId.HasValue) company.PlanId = dto.PlanId.Value;
            if (dto.SubscriptionStatus != null) company.SubscriptionStatus = dto.SubscriptionStatus;
            if (dto.MaxUsers.HasValue) company.MaxUsers = dto.MaxUsers.Value;

            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Return updated company details
            return await GetCompanyDetailAsync(companyId);
        }

        public async Task<bool> DeleteCompanyAsync(int companyId)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return false;

            // Delete all related data
            // Delete users
            var users = await _context.Users.Where(u => u.CompanyId == companyId).ToListAsync();
            _context.Users.RemoveRange(users);

            // Delete expenses
            var expenses = await _context.Expenses.Where(e => e.CompanyId == companyId).ToListAsync();
            _context.Expenses.RemoveRange(expenses);

            // Delete company
            _context.Companies.Remove(company);

            await _context.SaveChangesAsync();
            return true;
        }

        // ═══════════════════════════════════════════════════════════════════
        // PLATFORM USERS MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════

        public async Task<List<PlatformUserDto>> GetAllPlatformUsersAsync()
        {
            var users = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Company)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return users.Select(u => new PlatformUserDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                RoleId = u.RoleId,
                RoleName = u.Role?.RoleName ?? "Unknown",
                CompanyId = u.CompanyId,
                CompanyName = u.Company?.Name ?? "Unknown",
                IsActive = u.IsActive,
                IsVerified = u.IsVerified,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            }).ToList();
        }

        public async Task<PlatformUserDto?> GetPlatformUserAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            return new PlatformUserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                RoleId = user.RoleId,
                RoleName = user.Role?.RoleName ?? "Unknown",
                CompanyId = user.CompanyId,
                CompanyName = user.Company?.Name ?? "Unknown",
                IsActive = user.IsActive,
                IsVerified = user.IsVerified,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }

        public async Task<PlatformUserDto?> CreatePlatformUserAsync(CreatePlatformUserDto dto)
        {
            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (existingUser != null) return null;

            // Verify company exists
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null) return null;

            // Verify role exists
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null) return null;

            // Create user
            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                RoleId = dto.RoleId,
                CompanyId = dto.CompanyId,
                IsActive = dto.IsActive,
                IsVerified = true, // Super Admin created users are auto-verified
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return await GetPlatformUserAsync(user.Id);
        }

        public async Task<PlatformUserDto?> UpdatePlatformUserAsync(int userId, UpdatePlatformUserDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            // Check if email is being changed and if it already exists
            if (dto.Email != null && dto.Email != user.Email)
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Id != userId);
                if (existingUser != null) return null;
                user.Email = dto.Email;
            }

            // Update fields if provided
            if (dto.FirstName != null) user.FirstName = dto.FirstName;
            if (dto.LastName != null) user.LastName = dto.LastName;
            if (dto.RoleId.HasValue)
            {
                // Verify role exists
                var role = await _context.Roles.FindAsync(dto.RoleId.Value);
                if (role != null) user.RoleId = dto.RoleId.Value;
            }
            if (dto.CompanyId.HasValue)
            {
                // Verify company exists
                var company = await _context.Companies.FindAsync(dto.CompanyId.Value);
                if (company != null) user.CompanyId = dto.CompanyId.Value;
            }
            if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return await GetPlatformUserAsync(userId);
        }

        public async Task<bool> DeletePlatformUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            // Delete user's expenses
            var expenses = await _context.Expenses.Where(e => e.UserId == userId).ToListAsync();
            _context.Expenses.RemoveRange(expenses);

            // Delete user
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ActivateUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> SuspendUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ResetUserPasswordAsync(ResetUserPasswordDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        // ═══════════════════════════════════════════════════════════════════
        // SUBSCRIPTION MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════

        public async Task<List<SubscriptionDto>> GetAllSubscriptionsAsync()
        {
            var companies = await _context.Companies
                .Include(c => c.Plan)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return companies.Select(c => new SubscriptionDto
            {
                Id = c.Id,
                CompanyId = c.Id,
                CompanyName = c.Name,
                PlanId = c.PlanId,
                PlanName = c.Plan?.Name ?? "Unknown",
                SubscriptionStatus = c.SubscriptionStatus,
                MaxUsers = c.MaxUsers,
                Amount = c.BillingCycle == "Yearly" 
                    ? (c.Plan?.YearlyPrice ?? 0) 
                    : (c.Plan?.QuarterlyPrice ?? 0),
                BillingCycle = c.BillingCycle,
                SubscriptionStartedAt = c.SubscriptionStartedAt,
                SubscriptionExpiresAt = c.SubscriptionExpiresAt,
                TrialEndsAt = c.TrialEndsAt,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();
        }

        public async Task<SubscriptionStatsDto> GetSubscriptionStatsAsync()
        {
            var companies = await _context.Companies.Include(c => c.Plan).ToListAsync();

            var trialCount = companies.Count(c => c.SubscriptionStatus == "Trial");
            var activeCount = companies.Count(c => c.SubscriptionStatus == "Active");
            var expiredCount = companies.Count(c => c.SubscriptionStatus == "Expired");
            var suspendedCount = companies.Count(c => c.SubscriptionStatus == "Suspended");

            var totalRevenue = companies
                .Where(c => c.SubscriptionStatus == "Active" && c.Plan != null)
                .Sum(c => c.BillingCycle == "Yearly" 
                    ? c.Plan!.YearlyPrice 
                    : c.Plan!.QuarterlyPrice);

            return new SubscriptionStatsDto
            {
                TrialCount = trialCount,
                ActiveCount = activeCount,
                ExpiredCount = expiredCount,
                SuspendedCount = suspendedCount,
                TotalRevenue = totalRevenue * 12, // Annual
                MonthlyRecurringRevenue = totalRevenue
            };
        }

        public async Task<SubscriptionDto?> GetSubscriptionAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null) return null;

            return new SubscriptionDto
            {
                Id = company.Id,
                CompanyId = company.Id,
                CompanyName = company.Name,
                PlanId = company.PlanId,
                PlanName = company.Plan?.Name ?? "Unknown",
                SubscriptionStatus = company.SubscriptionStatus,
                MaxUsers = company.MaxUsers,
                Amount = company.BillingCycle == "Yearly" 
                    ? (company.Plan?.YearlyPrice ?? 0) 
                    : (company.Plan?.QuarterlyPrice ?? 0),
                BillingCycle = company.BillingCycle,
                SubscriptionStartedAt = company.SubscriptionStartedAt,
                SubscriptionExpiresAt = company.SubscriptionExpiresAt,
                TrialEndsAt = company.TrialEndsAt,
                CreatedAt = company.CreatedAt,
                UpdatedAt = company.UpdatedAt
            };
        }

        public async Task<SubscriptionDto?> UpdateSubscriptionAsync(int companyId, UpdateSubscriptionDto dto)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return null;

            // Verify plan exists
            var plan = await _context.Plans.FindAsync(dto.PlanId);
            if (plan == null) return null;

            company.PlanId = dto.PlanId;
            company.SubscriptionStatus = dto.SubscriptionStatus;
            company.MaxUsers = dto.MaxUsers > 0 ? dto.MaxUsers : plan.MaxUsers;
            company.SubscriptionStartedAt = dto.SubscriptionStartedAt;
            company.SubscriptionExpiresAt = dto.SubscriptionExpiresAt;
            company.UpdatedAt = DateTime.UtcNow;

            // Update status based on dates
            if (dto.SubscriptionStatus == "Active" && company.SubscriptionStartedAt == null)
            {
                company.SubscriptionStartedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return await GetSubscriptionAsync(companyId);
        }

        public async Task<bool> RenewSubscriptionAsync(RenewSubscriptionDto dto)
        {
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null) return false;

            // Extend subscription
            if (company.SubscriptionExpiresAt == null || company.SubscriptionExpiresAt < DateTime.UtcNow)
            {
                // If expired or no expiry, start from now
                company.SubscriptionExpiresAt = DateTime.UtcNow.AddMonths(dto.Months);
            }
            else
            {
                // If still active, extend from current expiry
                company.SubscriptionExpiresAt = company.SubscriptionExpiresAt.Value.AddMonths(dto.Months);
            }

            // Update status
            company.SubscriptionStatus = "Active";
            if (company.SubscriptionStartedAt == null)
            {
                company.SubscriptionStartedAt = DateTime.UtcNow;
            }

            company.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ChangePlanAsync(ChangePlanDto dto)
        {
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null) return false;

            var newPlan = await _context.Plans.FindAsync(dto.NewPlanId);
            if (newPlan == null) return false;

            company.PlanId = dto.NewPlanId;
            company.MaxUsers = newPlan.MaxUsers;
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ActivateSubscriptionAsync(int companyId)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return false;

            company.SubscriptionStatus = "Active";
            company.Status = "Active";
            if (company.SubscriptionStartedAt == null)
            {
                company.SubscriptionStartedAt = DateTime.UtcNow;
            }
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SuspendSubscriptionAsync(int companyId)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null) return false;

            company.SubscriptionStatus = "Suspended";
            company.Status = "Suspended";
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Create a new company with admin account (Super Admin version of public registration)
        /// Matches the public registration form but skips OTP verification
        /// </summary>
        public async Task<CompanyDetailDto?> CreateCompanyWithAdminAsync(SuperAdminCreateCompanyDto dto)
        {
            // Validate company email doesn't exist
            var existingCompany = await _context.Companies
                .FirstOrDefaultAsync(c => c.Email.ToLower() == dto.CompanyEmail.ToLower());
            if (existingCompany != null)
            {
                throw new InvalidOperationException("A company with this email already exists.");
            }

            // Validate admin email doesn't exist
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.AdminEmail.ToLower());
            if (existingUser != null)
            {
                throw new InvalidOperationException("A user with this email already exists.");
            }

            // Get the plan
            var plan = await _context.Plans.FindAsync(dto.PlanId);
            if (plan == null)
            {
                throw new InvalidOperationException("Invalid plan selected.");
            }

            // Create company
            var company = new Company
            {
                Name = dto.CompanyName,
                Email = dto.CompanyEmail,
                Phone = dto.CompanyPhone,
                Address = dto.CompanyAddress,
                PlanId = dto.PlanId,
                SubscriptionStatus = dto.SubscriptionStatus,
                TrialEndsAt = dto.SubscriptionStatus == "Trial" ? DateTime.UtcNow.AddDays(plan.TrialDays) : null,
                SubscriptionStartedAt = dto.SubscriptionStatus == "Active" ? DateTime.UtcNow : null,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            // Get Admin role
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
            if (adminRole == null)
            {
                throw new InvalidOperationException("Admin role not found in database.");
            }

            // Create admin user
            var adminUser = new User
            {
                FirstName = dto.AdminFirstName,
                LastName = dto.AdminLastName,
                Email = dto.AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AdminPassword),
                RoleId = adminRole.Id,
                CompanyId = company.Id,
                IsVerified = true, // Auto-verified when created by Super Admin
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            // Return company details
            return await GetCompanyDetailAsync(company.Id);
        }

        /// <summary>
        /// Update company with admin account details (Super Admin unified form)
        /// Updates company info, admin user info, and optionally admin password
        /// </summary>
        public async Task<CompanyDetailDto?> UpdateCompanyWithAdminAsync(int companyId, SuperAdminUpdateCompanyDto dto)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null)
            {
                throw new InvalidOperationException("Company not found.");
            }

            // Check if company email is being changed and if it already exists
            if (dto.CompanyEmail != null && dto.CompanyEmail.ToLower() != company.Email.ToLower())
            {
                var existingCompany = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Email.ToLower() == dto.CompanyEmail.ToLower() && c.Id != companyId);
                if (existingCompany != null)
                {
                    throw new InvalidOperationException("A company with this email already exists.");
                }
                company.Email = dto.CompanyEmail;
            }

            // Update company fields if provided
            if (dto.CompanyName != null) company.Name = dto.CompanyName;
            if (dto.CompanyPhone != null) company.Phone = dto.CompanyPhone;
            if (dto.CompanyAddress != null) company.Address = dto.CompanyAddress;
            if (dto.PlanId.HasValue) company.PlanId = dto.PlanId.Value;
            if (dto.SubscriptionStatus != null) company.SubscriptionStatus = dto.SubscriptionStatus;

            company.UpdatedAt = DateTime.UtcNow;

            // Find the admin user for this company
            var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
            if (adminRole != null)
            {
                var adminUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.CompanyId == companyId && u.RoleId == adminRole.Id);

                if (adminUser != null)
                {
                    // Check if admin email is being changed and if it already exists
                    if (dto.AdminEmail != null && dto.AdminEmail.ToLower() != adminUser.Email.ToLower())
                    {
                        var existingUser = await _context.Users
                            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.AdminEmail.ToLower() && u.Id != adminUser.Id);
                        if (existingUser != null)
                        {
                            throw new InvalidOperationException("A user with this email already exists.");
                        }
                        adminUser.Email = dto.AdminEmail;
                    }

                    // Update admin user fields if provided
                    if (dto.AdminFirstName != null) adminUser.FirstName = dto.AdminFirstName;
                    if (dto.AdminLastName != null) adminUser.LastName = dto.AdminLastName;

                    // Update password only if provided
                    if (!string.IsNullOrWhiteSpace(dto.AdminPassword))
                    {
                        adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AdminPassword);
                    }

                    adminUser.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            // Return updated company details
            return await GetCompanyDetailAsync(companyId);
        }
    }
}
