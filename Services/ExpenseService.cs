using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using LedgerFlow.API.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LedgerFlow.API.Services
{
    public class ExpenseService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly PlanEnforcementService _planEnforcement;

        public ExpenseService(AppDbContext context, IWebHostEnvironment hostEnvironment, PlanEnforcementService planEnforcement)
        {
            _context = context;
            _hostEnvironment = hostEnvironment;
            _planEnforcement = planEnforcement;
        }

        // Submit a new expense
        public async Task<ExpenseResponseDto> CreateExpenseAsync(CreateExpenseDto dto, int userId)
        {
            // Get user's company
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            // Check plan limits
            var (allowed, message) = await _planEnforcement.CanSubmitExpenseAsync(user.CompanyId);
            if (!allowed)
                throw new InvalidOperationException(message);

            var expense = new Expense
            {
                UserId = userId,
                CompanyId = user.CompanyId, // Set tenant isolation
                Amount = dto.Amount,
                Description = dto.Description,
                Category = dto.Category,
                CategoryId = dto.CategoryId,
                Status = "Pending",
                SubmittedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            // Load the user for the response
            await _context.Entry(expense).Reference(e => e.User).LoadAsync();

            return MapToResponseDto(expense);
        }

        // Get expenses with role-based filtering
        public async Task<List<ExpenseResponseDto>> GetExpensesAsync(int userId, string role, string? categoryFilter = null, string? statusFilter = null, int pageNumber = 1, int pageSize = 10)
        {
            // Get user's company for tenant isolation
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            IQueryable<Expense> query = _context.Expenses
                .Include(e => e.Receipts)
                .Include(e => e.User)
                .Where(e => e.CompanyId == user.CompanyId); // Tenant isolation

            // Role-based access control — Admin, Finance, and Audit see all; Employee sees own only
            if (role != "Admin" && role != "Finance" && role != "Audit")
            {
                query = query.Where(e => e.UserId == userId);
            }

            // Apply filters
            if (!string.IsNullOrEmpty(categoryFilter))
            {
                query = query.Where(e => e.Category == categoryFilter);
            }

            if (!string.IsNullOrEmpty(statusFilter))
            {
                query = query.Where(e => e.Status == statusFilter);
            }

            // Pagination
            var expenses = await query
                .OrderByDescending(e => e.SubmittedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return expenses.Select(MapToResponseDto).ToList();
        }

        // Get single expense
        public async Task<ExpenseResponseDto> GetExpenseAsync(int id, int userId, string role)
        {
            var expense = await _context.Expenses
                .Include(e => e.Receipts)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            // Authorization check
            if (role != "Admin" && role != "Finance" && expense.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to view this expense");

            return MapToResponseDto(expense);
        }

        // Edit pending expense (only owner can edit if pending)
        public async Task<ExpenseResponseDto> UpdateExpenseAsync(int id, UpdateExpenseDto dto, int userId, string role)
        {
            var expense = await _context.Expenses
                .Include(e => e.Receipts)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            // Authorization check
            if (role != "Admin" && expense.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to edit this expense");

            // Can only edit if pending
            if (expense.Status != "Pending")
                throw new InvalidOperationException("Only pending expenses can be edited");

            expense.Amount = dto.Amount;
            expense.Description = dto.Description;
            expense.Category = dto.Category;
            expense.CategoryId = dto.CategoryId;

            await _context.SaveChangesAsync();

            return MapToResponseDto(expense);
        }

        // Approve expense (Admin/Finance only)
        public async Task<ExpenseResponseDto> ApproveExpenseAsync(int id, int approverUserId)
        {
            var expense = await _context.Expenses
                .Include(e => e.Receipts)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            if (expense.Status != "Pending")
                throw new InvalidOperationException($"Cannot approve expense with status: {expense.Status}");

            expense.Status = "Approved";
            expense.ApprovedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponseDto(expense);
        }

        // Reject expense (Admin/Finance only)
        public async Task<ExpenseResponseDto> RejectExpenseAsync(int id, string rejectionReason, int approverUserId)
        {
            var expense = await _context.Expenses
                .Include(e => e.Receipts)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            if (expense.Status != "Pending")
                throw new InvalidOperationException($"Cannot reject expense with status: {expense.Status}");

            expense.Status = "Rejected";
            expense.RejectionReason = rejectionReason;

            await _context.SaveChangesAsync();

            return MapToResponseDto(expense);
        }

        // Reimburse expense (Finance only)
        public async Task<ExpenseResponseDto> ReimburseExpenseAsync(int id)
        {
            var expense = await _context.Expenses
                .Include(e => e.Receipts)
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            if (expense.Status != "Approved")
                throw new InvalidOperationException("Only approved expenses can be reimbursed");

            expense.Status = "Reimbursed";
            expense.ReimbursedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToResponseDto(expense);
        }

        // Delete expense (only if pending and owner)
        public async Task DeleteExpenseAsync(int id, int userId, string role)
        {
            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            // Authorization check
            if (role != "Admin" && expense.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to delete this expense");

            if (role != "Admin" && expense.Status != "Pending")
                throw new InvalidOperationException("Only pending expenses can be deleted");

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();
        }

        // Upload receipt
        public async Task<ReceiptDto> UploadReceiptAsync(int expenseId, IFormFile file, int userId, string role)
        {
            var expense = await _context.Expenses
                .FirstOrDefaultAsync(e => e.Id == expenseId);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            // Authorization check
            if (role != "Admin" && expense.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to upload receipts for this expense");

            // Check plan limits for receipt upload
            var (allowed, message) = await _planEnforcement.CanUploadReceiptAsync(expense.CompanyId);
            if (!allowed)
                throw new InvalidOperationException(message);

            // Validate file
            if (file.Length == 0)
                throw new ArgumentException("File is empty");

            if (file.Length > 10 * 1024 * 1024) // 10 MB limit
                throw new ArgumentException("File size exceeds 10 MB limit");

            var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png", "image/jpg", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
            if (!allowedTypes.Contains(file.ContentType))
                throw new ArgumentException($"File type {file.ContentType} is not allowed");

            // Save file
            var uploadsFolder = Path.Combine(_hostEnvironment.ContentRootPath, "uploads", "receipts");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create receipt record
            var receipt = new Receipt
            {
                ExpenseId = expenseId,
                FileName = file.FileName,
                FileUrl = $"/uploads/receipts/{fileName}",
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow
            };

            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync();

            return new ReceiptDto
            {
                Id = receipt.Id,
                FileName = receipt.FileName,
                FileUrl = receipt.FileUrl,
                FileSize = receipt.FileSize,
                UploadedAt = receipt.UploadedAt
            };
        }

        // Get receipts for an expense
        public async Task<List<ReceiptDto>> GetReceiptsAsync(int expenseId, int userId, string role)
        {
            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == expenseId);

            if (expense == null)
                throw new KeyNotFoundException("Expense not found");

            // Authorization check
            if (role != "Admin" && role != "Finance" && expense.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to view receipts for this expense");

            var receipts = await _context.Receipts
                .Where(r => r.ExpenseId == expenseId)
                .OrderByDescending(r => r.UploadedAt)
                .ToListAsync();

            return receipts.Select(r => new ReceiptDto
            {
                Id = r.Id,
                FileName = r.FileName,
                FileUrl = r.FileUrl,
                FileSize = r.FileSize,
                UploadedAt = r.UploadedAt
            }).ToList();
        }

        // Delete receipt
        public async Task DeleteReceiptAsync(int receiptId, int userId, string role)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Expense)
                .FirstOrDefaultAsync(r => r.Id == receiptId);

            if (receipt == null)
                throw new KeyNotFoundException("Receipt not found");

            // Authorization check
            if (role != "Admin" && receipt.Expense.UserId != userId)
                throw new UnauthorizedAccessException("You don't have permission to delete this receipt");

            // Delete file
            var filePath = Path.Combine(_hostEnvironment.ContentRootPath, receipt.FileUrl.TrimStart('/'));
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            _context.Receipts.Remove(receipt);
            await _context.SaveChangesAsync();
        }

        // Helper method to map Expense to DTO
        private ExpenseResponseDto MapToResponseDto(Expense expense)
        {
            return new ExpenseResponseDto
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
            };
        }
    }
}
