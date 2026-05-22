using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Services;
using LedgerFlow.API.DTOs;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Changed from specific roles to general authorization
    public class ApprovalsController : ControllerBase
    {
        private readonly ApprovalService _approvalService;
        private readonly AppDbContext _context;
        private readonly PermissionService _permissionService;

        public ApprovalsController(
            ApprovalService approvalService, 
            AppDbContext context,
            PermissionService permissionService)
        {
            _approvalService = approvalService;
            _context = context;
            _permissionService = permissionService;
        }

        // Helper to get user ID from claims
        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                throw new UnauthorizedAccessException("User context not found");

            return int.Parse(userIdClaim.Value);
        }

        /// <summary>
        /// Get all pending expenses that need approval
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingExpenses(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetUserId();
                var expenses = await _approvalService.GetPendingExpensesAsync(userId, pageNumber, pageSize);
                return Ok(expenses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Approve an expense
        /// </summary>
        [HttpPost("{expenseId:int}/approve")]
        public async Task<IActionResult> ApproveExpense(int expenseId, [FromBody] ApproveExpenseDto? dto = null)
        {
            try
            {
                var userId = GetUserId();
                
                // Check plan-based permissions
                if (!await _permissionService.CanApproveExpensesAsync(userId))
                {
                    return StatusCode(403, new { message = "You do not have permission to approve expenses. This action requires Finance role in Business plan or Admin role in Starter plan." });
                }

                var approval = await _approvalService.ApproveExpenseAsync(expenseId, userId, dto?.Remarks);

                // Log action
                LogAction(userId, "APPROVE", "Expense", expenseId.ToString());

                return Ok(approval);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Reject an expense
        /// </summary>
        [HttpPost("{expenseId:int}/reject")]
        public async Task<IActionResult> RejectExpense(int expenseId, [FromBody] RejectExpenseDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.RejectionReason))
                    return BadRequest(new { message = "Rejection reason is required" });

                var userId = GetUserId();
                
                // Check plan-based permissions
                if (!await _permissionService.CanRejectExpensesAsync(userId))
                {
                    return StatusCode(403, new { message = "You do not have permission to reject expenses. This action requires Finance role in Business plan or Admin role in Starter plan." });
                }

                var approval = await _approvalService.RejectExpenseAsync(expenseId, userId, dto.RejectionReason);

                // Log action
                LogAction(userId, "REJECT", "Expense", expenseId.ToString());

                return Ok(approval);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get approval history for a specific expense
        /// </summary>
        [HttpGet("expense/{expenseId:int}/history")]
        public async Task<IActionResult> GetExpenseApprovalHistory(int expenseId)
        {
            try
            {
                var userId = GetUserId();
                var history = await _approvalService.GetExpenseApprovalHistoryAsync(expenseId, userId);
                return Ok(history);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all approval history for the company
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetAllApprovals(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var userId = GetUserId();
                var approvals = await _approvalService.GetAllApprovalsAsync(userId, pageNumber, pageSize);
                return Ok(approvals);
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
