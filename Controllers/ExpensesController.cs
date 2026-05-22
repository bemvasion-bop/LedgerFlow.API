using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using LedgerFlow.API.DTOs;
using LedgerFlow.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpensesController : ControllerBase
    {
        private readonly ExpenseService _expenseService;
        private readonly AppDbContext _context;
        private readonly PlanEnforcementService _planEnforcement;
        private readonly PermissionService _permissionService;

        public ExpensesController(
            ExpenseService expenseService, 
            AppDbContext context, 
            PlanEnforcementService planEnforcement,
            PermissionService permissionService)
        {
            _expenseService = expenseService;
            _context = context;
            _planEnforcement = planEnforcement;
            _permissionService = permissionService;
        }

        // Helper to get user ID and role from claims
        private (int UserId, string Role) GetUserContext()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var roleClaim = User.FindFirst(ClaimTypes.Role);

            if (userIdClaim == null || roleClaim == null)
                throw new UnauthorizedAccessException("User context not found");

            return (int.Parse(userIdClaim.Value), roleClaim.Value);
        }

        /// <summary>
        /// Get expenses with optional filtering and pagination.
        /// Admin, Finance, and Audit see all expenses; Employee sees own only.
        /// </summary>
        [Authorize(Roles = "Admin,Finance,Employee,Audit")]
        [HttpGet]
        public async Task<IActionResult> GetExpenses(
            [FromQuery] string? category = null,
            [FromQuery] string? status = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var (userId, role) = GetUserContext();
                
                // Get user's company for tenant isolation
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return Unauthorized("User not found");

                IQueryable<Expense> query = _context.Expenses
                    .Include(e => e.User)
                    .Include(e => e.Receipts)
                    .Where(e => e.CompanyId == user.CompanyId); // Tenant isolation

                // Role-based filtering
                if (role == "Employee")
                {
                    query = query.Where(e => e.UserId == userId);
                }

                // Apply filters
                if (!string.IsNullOrEmpty(category))
                {
                    query = query.Where(e => e.Category == category);
                }

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(e => e.Status == status);
                }

                // Pagination
                var expenses = await query
                    .OrderByDescending(e => e.SubmittedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(e => new
                    {
                        e.Id,
                        e.UserId,
                        userName = e.User != null ? e.User.FirstName + " " + e.User.LastName : "Unknown",
                        e.CompanyId,
                        e.Amount,
                        e.Category,
                        e.Description,
                        e.Status,
                        e.SubmittedAt,
                        e.ApprovedAt,
                        e.ReimbursedAt,
                        e.RejectionReason,
                        receipts = e.Receipts.Select(r => new
                        {
                            r.Id,
                            r.FileName,
                            r.FileUrl,
                            r.FileSize,
                            r.UploadedAt
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(expenses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific expense by ID
        /// </summary>
        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetExpense(int id)
        {
            try
            {
                var (userId, role) = GetUserContext();
                var expense = await _expenseService.GetExpenseAsync(id, userId, role);
                return Ok(expense);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Submit a new expense claim
        /// </summary>
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (dto.Amount <= 0)
                    return BadRequest("Amount must be greater than 0");

                var (userId, _) = GetUserContext();
                
                // Get user's company for plan enforcement
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return Unauthorized("User not found");

                // Check if company can submit more expenses this month
                var (allowed, message) = await _planEnforcement.CanSubmitExpenseAsync(user.CompanyId);
                if (!allowed)
                    return BadRequest(new { message, requiresUpgrade = true });

                var expense = await _expenseService.CreateExpenseAsync(dto, userId);

                // Log action
                LogAction(userId, "CREATE", "Expense", expense.Id.ToString());

                return CreatedAtAction(nameof(GetExpense), new { id = expense.Id }, expense);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Edit a pending expense (owner only)
        /// </summary>
        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateExpense(int id, [FromBody] UpdateExpenseDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (dto.Amount <= 0)
                    return BadRequest("Amount must be greater than 0");

                var (userId, role) = GetUserContext();
                var expense = await _expenseService.UpdateExpenseAsync(id, dto, userId, role);

                LogAction(userId, "UPDATE", "Expense", id.ToString());

                return Ok(expense);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Delete an expense (owner can only delete pending, admin can delete any)
        /// </summary>
        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            try
            {
                var (userId, role) = GetUserContext();
                await _expenseService.DeleteExpenseAsync(id, userId, role);

                LogAction(userId, "DELETE", "Expense", id.ToString());

                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Approve an expense
        /// Admin can approve in Starter plan, Finance in Business plan
        /// </summary>
        [Authorize(Roles = "Admin,Finance")]
        [HttpPut("{id:int}/approve")]
        public async Task<IActionResult> ApproveExpense(int id, [FromBody] ApproveExpenseDto? dto = null)
        {
            try
            {
                var (userId, _) = GetUserContext();
                
                // Check plan-based permissions
                if (!await _permissionService.CanApproveExpensesAsync(userId))
                {
                    return StatusCode(403, new { message = "You do not have permission to approve expenses. This action requires Finance role in Business plan or Admin role in Starter plan." });
                }
                
                var expense = await _expenseService.ApproveExpenseAsync(id, userId);

                LogAction(userId, "APPROVE", "Expense", id.ToString());

                return Ok(expense);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Reject an expense
        /// Admin can reject in Starter plan, Finance in Business plan
        /// </summary>
        [Authorize(Roles = "Admin,Finance")]
        [HttpPut("{id:int}/reject")]
        public async Task<IActionResult> RejectExpense(int id, [FromBody] RejectExpenseDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RejectionReason))
                    return BadRequest("Rejection reason is required");

                var (userId, _) = GetUserContext();
                
                // Check plan-based permissions
                if (!await _permissionService.CanRejectExpensesAsync(userId))
                {
                    return StatusCode(403, new { message = "You do not have permission to reject expenses. This action requires Finance role in Business plan or Admin role in Starter plan." });
                }
                
                var expense = await _expenseService.RejectExpenseAsync(id, dto.RejectionReason, userId);

                LogAction(userId, "REJECT", "Expense", id.ToString());

                return Ok(expense);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Reimburse an approved expense
        /// Admin can reimburse in Starter plan, Finance in Business plan
        /// </summary>
        [Authorize(Roles = "Admin,Finance")]
        [HttpPut("{id:int}/reimburse")]
        public async Task<IActionResult> ReimburseExpense(int id)
        {
            try
            {
                var (userId, _) = GetUserContext();
                
                // Check plan-based permissions
                if (!await _permissionService.CanProcessReimbursementsAsync(userId))
                {
                    return StatusCode(403, new { message = "You do not have permission to process reimbursements. This action requires Finance role in Business plan or Admin role in Starter plan." });
                }
                
                var expense = await _expenseService.ReimburseExpenseAsync(id);

                LogAction(userId, "REIMBURSE", "Expense", id.ToString());

                return Ok(expense);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Upload a receipt for an expense
        /// </summary>
        [Authorize]
        [HttpPost("{expenseId:int}/receipts/upload")]
        public async Task<IActionResult> UploadReceipt(int expenseId, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("File is required");

                var (userId, role) = GetUserContext();
                
                // Get user's company for plan enforcement
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return Unauthorized("User not found");

                // Check if company can upload receipts
                var (allowed, message) = await _planEnforcement.CanUploadReceiptAsync(user.CompanyId);
                if (!allowed)
                    return BadRequest(new { message, requiresUpgrade = true });

                var receipt = await _expenseService.UploadReceiptAsync(expenseId, file, userId, role);

                LogAction(userId, "UPLOAD_RECEIPT", "Expense", expenseId.ToString());

                return Ok(receipt);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Get all receipts for an expense
        /// </summary>
        [Authorize]
        [HttpGet("{expenseId:int}/receipts")]
        public async Task<IActionResult> GetReceipts(int expenseId)
        {
            try
            {
                var (userId, role) = GetUserContext();
                var receipts = await _expenseService.GetReceiptsAsync(expenseId, userId, role);
                return Ok(receipts);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Expense not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Delete a receipt
        /// </summary>
        [Authorize]
        [HttpDelete("receipts/{receiptId:int}")]
        public async Task<IActionResult> DeleteReceipt(int receiptId)
        {
            try
            {
                var (userId, role) = GetUserContext();
                await _expenseService.DeleteReceiptAsync(receiptId, userId, role);

                LogAction(userId, "DELETE_RECEIPT", "Expense", receiptId.ToString());

                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Receipt not found");
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Get expense statistics for dashboard
        /// </summary>
        [Authorize(Roles = "Admin,Finance,Audit")]
        [HttpGet("stats")]
        public async Task<IActionResult> GetExpenseStats()
        {
            try
            {
                var (userId, role) = GetUserContext();

                // Get user's company ID for filtering
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return Unauthorized("User not found");

                IQueryable<Expense> query = _context.Expenses;

                // Filter by company for Admin, Finance, and Audit
                if (role == "Admin" || role == "Finance" || role == "Audit")
                {
                    query = query.Where(e => e.CompanyId == user.CompanyId);
                }
                else
                {
                    // Employee sees only their own expenses
                    query = query.Where(e => e.UserId == userId);
                }

                var totalExpenses = await query.CountAsync();
                var totalAmount = totalExpenses > 0 ? await query.SumAsync(e => (decimal?)e.Amount) ?? 0 : 0;

                var stats = new
                {
                    totalExpenses = totalExpenses,
                    totalAmount = totalAmount,
                    pendingCount = await query.CountAsync(e => e.Status == "Pending"),
                    approvedCount = await query.CountAsync(e => e.Status == "Approved"),
                    rejectedCount = await query.CountAsync(e => e.Status == "Rejected"),
                    reimbursedCount = await query.CountAsync(e => e.Status == "Reimbursed")
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get employee's own expense statistics
        /// </summary>
        [Authorize(Roles = "Employee")]
        [HttpGet("my-stats")]
        public async Task<IActionResult> GetMyExpenseStats()
        {
            try
            {
                var (userId, _) = GetUserContext();

                var query = _context.Expenses.Where(e => e.UserId == userId);

                var totalExpenses = await query.CountAsync();
                var totalAmount = totalExpenses > 0 ? await query.SumAsync(e => (decimal?)e.Amount) ?? 0 : 0;
                
                // Debug: Log all statuses for this user
                var allStatuses = await query.Select(e => new { e.Id, e.Status }).ToListAsync();
                Console.WriteLine($"[DEBUG] User {userId} has {allStatuses.Count} expenses:");
                foreach (var exp in allStatuses)
                {
                    Console.WriteLine($"  Expense {exp.Id}: Status = '{exp.Status}'");
                }
                
                var reimbursedAmount = await query
                    .Where(e => e.Status == "Reimbursed")
                    .SumAsync(e => (decimal?)e.Amount) ?? 0;

                var pendingCount = await query.CountAsync(e => e.Status == "Pending");
                var approvedCount = await query.CountAsync(e => e.Status == "Approved");
                var rejectedCount = await query.CountAsync(e => e.Status == "Rejected");
                var reimbursedCount = await query.CountAsync(e => e.Status == "Reimbursed");
                
                // Debug: Log counts
                Console.WriteLine($"[DEBUG] Counts - Pending: {pendingCount}, Approved: {approvedCount}, Rejected: {rejectedCount}, Reimbursed: {reimbursedCount}");

                var stats = new
                {
                    totalSubmitted = totalExpenses,
                    totalAmount = totalAmount,
                    pendingCount = pendingCount,
                    approvedCount = approvedCount,
                    rejectedCount = rejectedCount,
                    reimbursedCount = reimbursedCount,
                    reimbursedAmount = reimbursedAmount
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetMyExpenseStats: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get employee's own expenses
        /// </summary>
        [Authorize(Roles = "Employee")]
        [HttpGet("my-expenses")]
        public async Task<IActionResult> GetMyExpenses(
            [FromQuery] string? status = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var (userId, _) = GetUserContext();

                IQueryable<Expense> query = _context.Expenses
                    .Include(e => e.Receipts)
                    .Include(e => e.User)
                    .Where(e => e.UserId == userId);

                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(e => e.Status == status);
                }

                var expenses = await query
                    .OrderByDescending(e => e.SubmittedAt)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(e => new
                    {
                        e.Id,
                        e.Description,
                        e.Amount,
                        e.Category,
                        e.Status,
                        e.SubmittedAt,
                        e.ApprovedAt,
                        e.ReimbursedAt,
                        e.RejectionReason,
                        receipts = e.Receipts.Select(r => new
                        {
                            r.Id,
                            r.FileName,
                            r.FileUrl,
                            r.FileSize,
                            r.UploadedAt
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(expenses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get expense history/statistics with category breakdown
        /// </summary>
        [Authorize]
        [HttpGet("history/stats")]
        public async Task<IActionResult> GetExpenseHistoryStats()
        {
            try
            {
                var (userId, role) = GetUserContext();

                // Get user's company ID for filtering
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return Unauthorized("User not found");

                IQueryable<Expense> query = _context.Expenses;

                // Filter based on role
                if (role == "Admin" || role == "Finance" || role == "Audit")
                {
                    query = query.Where(e => e.CompanyId == user.CompanyId);
                }
                else
                {
                    query = query.Where(e => e.UserId == userId);
                }

                var totalExpenses = await query.CountAsync();
                var totalAmount = totalExpenses > 0 ? await query.SumAsync(e => (decimal?)e.Amount) ?? 0 : 0;

                var stats = new
                {
                    totalExpenses = totalExpenses,
                    totalAmount = totalAmount,
                    pending = await query.CountAsync(e => e.Status == "Pending"),
                    approved = await query.CountAsync(e => e.Status == "Approved"),
                    rejected = await query.CountAsync(e => e.Status == "Rejected"),
                    reimbursed = await query.CountAsync(e => e.Status == "Reimbursed"),
                    byCategory = await query
                        .GroupBy(e => e.Category)
                        .Select(g => new { category = g.Key, count = g.Count(), amount = g.Sum(e => e.Amount) })
                        .ToListAsync()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Helper method to log actions
        private void LogAction(int userId, string action, string entity, string entityId = "")
        {
            var user = _context.Users.Find(userId);
            var auditLog = new AuditLog
            {
                UserId = userId,
                CompanyId = user?.CompanyId ?? 0,
                Action = action,
                Entity = entity,
                EntityId = entityId,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            _context.SaveChanges();
        }
    }
}
