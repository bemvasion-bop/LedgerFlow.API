using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Services;
using LedgerFlow.API.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/subscription")]
    [Authorize]
    public class SubscriptionRequestsController : ControllerBase
    {
        private readonly SubscriptionService _subscriptionService;
        private readonly AppDbContext _context;

        public SubscriptionRequestsController(
            SubscriptionService subscriptionService,
            AppDbContext context)
        {
            _subscriptionService = subscriptionService;
            _context = context;
        }

        /// <summary>
        /// Get all subscription requests (Super Admin only)
        /// Returns pending, approved, and rejected requests
        /// </summary>
        [HttpGet("requests")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetAllRequests()
        {
            try
            {
                var requests = await _context.SubscriptionRequests
                    .Include(r => r.Company)
                    .Include(r => r.RequestedByUser)
                    .Include(r => r.ReviewedByUser)
                    .OrderByDescending(r => r.RequestedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        companyId = r.CompanyId,
                        companyName = r.Company!.Name,
                        currentPlanName = r.CurrentPlan,
                        requestedPlanName = r.RequestedPlan,
                        currentBillingCycle = r.CurrentBillingCycle ?? "N/A",
                        requestedBillingCycle = r.RequestedBillingCycle,
                        amount = CalculateAmount(r.RequestedPlan, r.RequestedBillingCycle),
                        paymentReference = (string?)null,
                        status = r.Status,
                        reason = r.RequestReason,
                        requestedBy = r.RequestedByUser!.FirstName + " " + r.RequestedByUser.LastName,
                        requestedAt = r.RequestedAt,
                        reviewedBy = r.ReviewedByUser != null 
                            ? r.ReviewedByUser.FirstName + " " + r.ReviewedByUser.LastName 
                            : null,
                        reviewedAt = r.ReviewedAt,
                        reviewNotes = r.ReviewNotes
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch subscription requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get pending subscription requests only (Super Admin only)
        /// </summary>
        [HttpGet("requests/pending")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetPendingRequests()
        {
            try
            {
                var requests = await _context.SubscriptionRequests
                    .Include(r => r.Company)
                    .Include(r => r.RequestedByUser)
                    .Where(r => r.Status == "Pending")
                    .OrderByDescending(r => r.RequestedAt)
                    .Select(r => new
                    {
                        id = r.Id,
                        companyId = r.CompanyId,
                        companyName = r.Company!.Name,
                        currentPlanName = r.CurrentPlan,
                        requestedPlanName = r.RequestedPlan,
                        currentBillingCycle = r.CurrentBillingCycle ?? "N/A",
                        requestedBillingCycle = r.RequestedBillingCycle,
                        amount = CalculateAmount(r.RequestedPlan, r.RequestedBillingCycle),
                        paymentReference = (string?)null,
                        status = r.Status,
                        reason = r.RequestReason,
                        requestedBy = r.RequestedByUser!.FirstName + " " + r.RequestedByUser.LastName,
                        requestedAt = r.RequestedAt
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch pending requests", error = ex.Message });
            }
        }

        /// <summary>
        /// Get subscription request details by ID (Super Admin only)
        /// </summary>
        [HttpGet("requests/{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetRequestDetails(int id)
        {
            try
            {
                var request = await _context.SubscriptionRequests
                    .Include(r => r.Company)
                    .Include(r => r.RequestedByUser)
                    .Include(r => r.ReviewedByUser)
                    .Where(r => r.Id == id)
                    .Select(r => new
                    {
                        id = r.Id,
                        companyId = r.CompanyId,
                        companyName = r.Company!.Name,
                        currentPlanName = r.CurrentPlan,
                        requestedPlanName = r.RequestedPlan,
                        currentBillingCycle = r.CurrentBillingCycle ?? "N/A",
                        requestedBillingCycle = r.RequestedBillingCycle,
                        amount = CalculateAmount(r.RequestedPlan, r.RequestedBillingCycle),
                        paymentReference = (string?)null,
                        status = r.Status,
                        reason = r.RequestReason,
                        requestedBy = r.RequestedByUser!.FirstName + " " + r.RequestedByUser.LastName,
                        requestedAt = r.RequestedAt,
                        reviewedBy = r.ReviewedByUser != null 
                            ? r.ReviewedByUser.FirstName + " " + r.ReviewedByUser.LastName 
                            : null,
                        reviewedAt = r.ReviewedAt,
                        reviewNotes = r.ReviewNotes,
                        requestType = r.RequestType
                    })
                    .FirstOrDefaultAsync();

                if (request == null)
                    return NotFound(new { message = "Subscription request not found" });

                return Ok(request);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch request details", error = ex.Message });
            }
        }

        /// <summary>
        /// Approve a subscription request (Super Admin only)
        /// </summary>
        [HttpPost("requests/{id}/approve")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> ApproveRequest(int id, [FromBody] ApproveRequestDto? dto)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Invalid token" });

                var userId = int.Parse(userIdClaim);

                var result = await _subscriptionService.ApproveSubscriptionRequest(
                    id, 
                    userId, 
                    dto?.Notes);

                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                return Ok(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to approve request", error = ex.Message });
            }
        }

        /// <summary>
        /// Reject a subscription request (Super Admin only)
        /// </summary>
        [HttpPost("requests/{id}/reject")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectRequestDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto?.Reason))
                    return BadRequest(new { message = "Rejection reason is required" });

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { message = "Invalid token" });

                var userId = int.Parse(userIdClaim);

                var result = await _subscriptionService.RejectSubscriptionRequest(
                    id, 
                    userId, 
                    dto.Reason);

                if (!result.Success)
                    return BadRequest(new { message = result.Message });

                return Ok(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to reject request", error = ex.Message });
            }
        }

        /// <summary>
        /// Calculate subscription amount based on plan and billing cycle
        /// </summary>
        private static decimal CalculateAmount(string planName, string billingCycle)
        {
            // Pricing based on requirements
            if (planName == "STARTER")
            {
                return billingCycle == "Yearly" ? 5499 : 1499;
            }
            else if (planName == "BUSINESS")
            {
                return billingCycle == "Yearly" ? 24999 : 6999;
            }
            return 0;
        }
    }

    // DTOs
    public class ApproveRequestDto
    {
        public string? Notes { get; set; }
    }

    public class RejectRequestDto
    {
        public string Reason { get; set; } = string.Empty;
    }
}
