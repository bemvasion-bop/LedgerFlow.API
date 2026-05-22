using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    /// <summary>
    /// Service to handle plan-based role permissions
    /// </summary>
    public class PermissionService
    {
        private readonly AppDbContext _context;

        public PermissionService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Check if user can approve expenses based on role and company plan
        /// </summary>
        public async Task<bool> CanApproveExpensesAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Company)
                    .ThenInclude(c => c.Plan)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.Role == null || user.Company == null || user.Company.Plan == null)
                return false;

            var roleName = user.Role.RoleName;
            var planName = user.Company.Plan.Name;

            // STARTER PLAN: Admin can approve
            if (planName == "Starter" && roleName == "Admin")
                return true;

            // BUSINESS PLAN: Only Finance can approve
            if (planName == "Business" && roleName == "Finance")
                return true;

            return false;
        }

        /// <summary>
        /// Check if user can reject expenses based on role and company plan
        /// </summary>
        public async Task<bool> CanRejectExpensesAsync(int userId)
        {
            // Same logic as approve
            return await CanApproveExpensesAsync(userId);
        }

        /// <summary>
        /// Check if user can process reimbursements based on role and company plan
        /// </summary>
        public async Task<bool> CanProcessReimbursementsAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Company)
                    .ThenInclude(c => c.Plan)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null || user.Role == null || user.Company == null || user.Company.Plan == null)
                return false;

            var roleName = user.Role.RoleName;
            var planName = user.Company.Plan.Name;

            // STARTER PLAN: Admin can process reimbursements
            if (planName == "Starter" && roleName == "Admin")
                return true;

            // BUSINESS PLAN: Only Finance can process reimbursements
            if (planName == "Business" && roleName == "Finance")
                return true;

            return false;
        }

        /// <summary>
        /// Get user's plan name
        /// </summary>
        public async Task<string?> GetUserPlanAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Company)
                    .ThenInclude(c => c.Plan)
                .FirstOrDefaultAsync(u => u.Id == userId);

            return user?.Company?.Plan?.Name;
        }

        /// <summary>
        /// Check if user's company is on Starter plan
        /// </summary>
        public async Task<bool> IsStarterPlanAsync(int userId)
        {
            var planName = await GetUserPlanAsync(userId);
            return planName == "Starter";
        }

        /// <summary>
        /// Check if user's company is on Business plan
        /// </summary>
        public async Task<bool> IsBusinessPlanAsync(int userId)
        {
            var planName = await GetUserPlanAsync(userId);
            return planName == "Business";
        }
    }
}
