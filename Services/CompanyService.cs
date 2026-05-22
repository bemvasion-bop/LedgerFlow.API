using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class CompanyService
    {
        private readonly AppDbContext _context;

        public CompanyService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Company>> GetAllCompaniesAsync()
        {
            return await _context.Companies
                .Include(c => c.Plan)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Company?> GetCompanyByIdAsync(int id)
        {
            return await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Company> CreateCompanyAsync(string name, string email, int planId)
        {
            // Validate plan exists
            var plan = await _context.Plans.FindAsync(planId);
            if (plan == null)
                throw new KeyNotFoundException("Plan not found");

            // Check if email already exists
            if (await _context.Companies.AnyAsync(c => c.Email == email))
                throw new InvalidOperationException("Company with this email already exists");

            var company = new Company
            {
                Name = name,
                Email = email,
                PlanId = planId,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return company;
        }

        public async Task<Company> UpdateCompanyAsync(int id, string? name, string? email, int? planId, string? status)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
                throw new KeyNotFoundException("Company not found");

            if (!string.IsNullOrWhiteSpace(name))
                company.Name = name;

            if (!string.IsNullOrWhiteSpace(email))
            {
                // Check if new email is already taken by another company
                if (await _context.Companies.AnyAsync(c => c.Email == email && c.Id != id))
                    throw new InvalidOperationException("Email already in use by another company");
                company.Email = email;
            }

            if (planId.HasValue)
            {
                var plan = await _context.Plans.FindAsync(planId.Value);
                if (plan == null)
                    throw new KeyNotFoundException("Plan not found");
                company.PlanId = planId.Value;
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (status != "Active" && status != "Suspended")
                    throw new ArgumentException("Status must be 'Active' or 'Suspended'");
                company.Status = status;
            }

            await _context.SaveChangesAsync();
            return company;
        }

        public async Task SuspendCompanyAsync(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
                throw new KeyNotFoundException("Company not found");

            company.Status = "Suspended";
            await _context.SaveChangesAsync();
        }

        public async Task ActivateCompanyAsync(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
                throw new KeyNotFoundException("Company not found");

            company.Status = "Active";
            await _context.SaveChangesAsync();
        }

        public async Task<object> GetCompanyStatsAsync(int companyId)
        {
            var userCount = await _context.Users.CountAsync(u => u.CompanyId == companyId && u.IsActive);
            var expenseCount = await _context.Expenses.CountAsync(e => e.CompanyId == companyId);
            var totalAmount = await _context.Expenses
                .Where(e => e.CompanyId == companyId)
                .SumAsync(e => (decimal?)e.Amount) ?? 0m;

            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var expensesThisMonth = await _context.Expenses
                .CountAsync(e => e.CompanyId == companyId && e.SubmittedAt >= startOfMonth);

            return new
            {
                userCount,
                expenseCount,
                totalAmount,
                expensesThisMonth
            };
        }
    }
}
