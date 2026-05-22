using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using LedgerFlow.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class ApprovalService
    {
        private readonly AppDbContext _context;

        public ApprovalService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Approve an expense and create approval record
        /// </summary>
        public async Task<ApprovalResponseDto> ApproveExpenseAsync(int expenseId, int approverUserId, string? remarks = null)
        {
            // Get the approver to check CompanyId
            var approver = await _context.Users.FindAsync(approverUserId);
            if (approver == null)
                throw new KeyNotFoundException("Approver not found");

            // Get the expense with tenant isolation
            var expense = await _context.Expenses
                .Include(e => e.User)
                .Include(e => e.Receipts)
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.CompanyId == approver.CompanyId);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            if (expense.Status != "Pending")
                throw new InvalidOperationException($"Cannot approve expense with status: {expense.Status}");

            // Update expense status
            expense.Status = "Approved";
            expense.ApprovedAt = DateTime.UtcNow;

            // Create approval record
            var approval = new Approval
            {
                ExpenseId = expenseId,
                ApprovedBy = approverUserId,
                Status = "Approved",
                Remarks = remarks,
                CreatedAt = DateTime.UtcNow
            };

            _context.Approvals.Add(approval);
            await _context.SaveChangesAsync();

            // Load the approver for the response
            await _context.Entry(approval).Reference(a => a.Approver).LoadAsync();

            return MapToResponseDto(approval, expense);
        }

        /// <summary>
        /// Reject an expense and create approval record
        /// </summary>
        public async Task<ApprovalResponseDto> RejectExpenseAsync(int expenseId, int approverUserId, string rejectionReason)
        {
            if (string.IsNullOrWhiteSpace(rejectionReason))
                throw new ArgumentException("Rejection reason is required");

            // Get the approver to check CompanyId
            var approver = await _context.Users.FindAsync(approverUserId);
            if (approver == null)
                throw new KeyNotFoundException("Approver not found");

            // Get the expense with tenant isolation
            var expense = await _context.Expenses
                .Include(e => e.User)
                .Include(e => e.Receipts)
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.CompanyId == approver.CompanyId);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            if (expense.Status != "Pending")
                throw new InvalidOperationException($"Cannot reject expense with status: {expense.Status}");

            // Update expense status
            expense.Status = "Rejected";
            expense.RejectionReason = rejectionReason;

            // Create approval record
            var approval = new Approval
            {
                ExpenseId = expenseId,
                ApprovedBy = approverUserId,
                Status = "Rejected",
                Remarks = rejectionReason,
                CreatedAt = DateTime.UtcNow
            };

            _context.Approvals.Add(approval);
            await _context.SaveChangesAsync();

            // Load the approver for the response
            await _context.Entry(approval).Reference(a => a.Approver).LoadAsync();

            return MapToResponseDto(approval, expense);
        }

        /// <summary>
        /// Get approval history for a specific expense
        /// </summary>
        public async Task<List<ApprovalHistoryDto>> GetExpenseApprovalHistoryAsync(int expenseId, int userId)
        {
            // Get user's company for tenant isolation
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            // Verify expense belongs to user's company
            var expense = await _context.Expenses
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.CompanyId == user.CompanyId);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            var approvals = await _context.Approvals
                .Include(a => a.Approver)
                .Include(a => a.Expense)
                .Where(a => a.ExpenseId == expenseId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return approvals.Select(a => new ApprovalHistoryDto
            {
                Id = a.Id,
                ExpenseId = a.ExpenseId,
                ExpenseDescription = a.Expense?.Description ?? "N/A",
                ExpenseAmount = a.Expense?.Amount ?? 0,
                ApproverName = a.Approver != null ? $"{a.Approver.FirstName} {a.Approver.LastName}" : "Unknown",
                Status = a.Status,
                Remarks = a.Remarks,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        /// <summary>
        /// Get all approval history for the company (Finance/Admin only)
        /// </summary>
        public async Task<List<ApprovalHistoryDto>> GetAllApprovalsAsync(int userId, int pageNumber = 1, int pageSize = 20)
        {
            // Get user's company for tenant isolation
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            var approvals = await _context.Approvals
                .Include(a => a.Approver)
                .Include(a => a.Expense)
                .ThenInclude(e => e.User)
                .Where(a => a.Expense != null && a.Expense.CompanyId == user.CompanyId) // Tenant isolation
                .OrderByDescending(a => a.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return approvals.Select(a => new ApprovalHistoryDto
            {
                Id = a.Id,
                ExpenseId = a.ExpenseId,
                ExpenseDescription = a.Expense?.Description ?? "N/A",
                ExpenseAmount = a.Expense?.Amount ?? 0,
                ApproverName = a.Approver != null ? $"{a.Approver.FirstName} {a.Approver.LastName}" : "Unknown",
                Status = a.Status,
                Remarks = a.Remarks,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        /// <summary>
        /// Get pending expenses that need approval (Finance role)
        /// </summary>
        public async Task<List<ExpenseResponseDto>> GetPendingExpensesAsync(int userId, int pageNumber = 1, int pageSize = 20)
        {
            // Get user's company for tenant isolation
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            var expenses = await _context.Expenses
                .Include(e => e.User)
                .Include(e => e.Receipts)
                .Where(e => e.CompanyId == user.CompanyId && e.Status == "Pending") // Tenant isolation
                .OrderBy(e => e.SubmittedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return expenses.Select(e => new ExpenseResponseDto
            {
                Id = e.Id,
                UserId = e.UserId,
                UserName = e.User != null ? $"{e.User.FirstName} {e.User.LastName}" : "Unknown",
                Amount = e.Amount,
                Description = e.Description,
                Category = e.Category,
                Status = e.Status,
                SubmittedAt = e.SubmittedAt,
                ApprovedAt = e.ApprovedAt,
                ReimbursedAt = e.ReimbursedAt,
                RejectionReason = e.RejectionReason,
                Receipts = e.Receipts?.Select(r => new ReceiptDto
                {
                    Id = r.Id,
                    FileName = r.FileName,
                    FileUrl = r.FileUrl,
                    FileSize = r.FileSize,
                    UploadedAt = r.UploadedAt
                }).ToList() ?? new()
            }).ToList();
        }

        // Helper method to map Approval to DTO
        private ApprovalResponseDto MapToResponseDto(Approval approval, Expense? expense = null)
        {
            return new ApprovalResponseDto
            {
                Id = approval.Id,
                ExpenseId = approval.ExpenseId,
                ApprovedBy = approval.ApprovedBy,
                ApproverName = approval.Approver != null ? $"{approval.Approver.FirstName} {approval.Approver.LastName}" : "Unknown",
                Status = approval.Status,
                Remarks = approval.Remarks,
                CreatedAt = approval.CreatedAt,
                Expense = expense != null ? new ExpenseResponseDto
                {
                    Id = expense.Id,
                    UserId = expense.UserId,
                    UserName = expense.User != null ? $"{expense.User.FirstName} {expense.User.LastName}" : "Unknown",
                    Amount = expense.Amount,
                    Description = expense.Description,
                    Category = expense.Category,
                    Status = expense.Status,
                    SubmittedAt = expense.SubmittedAt,
                    ApprovedAt = expense.ApprovedAt,
                    ReimbursedAt = expense.ReimbursedAt,
                    RejectionReason = expense.RejectionReason,
                    Receipts = expense.Receipts?.Select(r => new ReceiptDto
                    {
                        Id = r.Id,
                        FileName = r.FileName,
                        FileUrl = r.FileUrl,
                        FileSize = r.FileSize,
                        UploadedAt = r.UploadedAt
                    }).ToList() ?? new()
                } : null
            };
        }
    }
}
