using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Services;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly SubscriptionService _subscriptionService;

        public SubscriptionController(SubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
        }

        /// <summary>
        /// Request a subscription plan change (requires Super Admin approval)
        /// </summary>
        [HttpPost("request-change")]
        public async Task<IActionResult> RequestPlanChange([FromBody] PlanChangeRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(companyIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);
            var companyId = int.Parse(companyIdClaim);

            // Validate billing cycle
            if (request.BillingCycle != "Quarterly" && request.BillingCycle != "Yearly")
                return BadRequest(new { message = "Invalid billing cycle. Must be Quarterly or Yearly" });

            var result = await _subscriptionService.RequestPlanChange(
                companyId,
                userId,
                "BUSINESS", // Always requesting Business plan for now
                request.BillingCycle,
                request.Reason
            );

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new
            {
                message = result.Message,
                requestId = result.RequestId
            });
        }

        /// <summary>
        /// Get all pending subscription change requests (Super Admin only)
        /// </summary>
        [HttpGet("pending-requests")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _subscriptionService.GetPendingSubscriptionRequests();
            return Ok(requests);
        }

        /// <summary>
        /// Approve subscription change request (Super Admin only)
        /// </summary>
        [HttpPost("approve-request/{requestId}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> ApproveSubscriptionRequest(int requestId, [FromBody] ReviewRequest? request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);

            var result = await _subscriptionService.ApproveSubscriptionRequest(requestId, userId, request?.ReviewNotes);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Reject subscription change request (Super Admin only)
        /// </summary>
        [HttpPost("reject-request/{requestId}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> RejectSubscriptionRequest(int requestId, [FromBody] ReviewRequest? request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);

            var result = await _subscriptionService.RejectSubscriptionRequest(requestId, userId, request?.ReviewNotes);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Upgrade company to Business Plan (simulated payment)
        /// </summary>
        [HttpPost("upgrade")]
        public async Task<IActionResult> UpgradeToBusiness([FromBody] UpgradeRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(companyIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);
            var companyId = int.Parse(companyIdClaim);

            // Validate billing cycle
            if (request.BillingCycle != "Quarterly" && request.BillingCycle != "Yearly")
                return BadRequest(new { message = "Invalid billing cycle. Must be Quarterly or Yearly" });

            // Simulate payment processing delay
            await Task.Delay(2000);

            var result = await _subscriptionService.UpgradeToBusiness(companyId, request.BillingCycle, userId);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            // Generate demo invoice/transaction IDs
            var invoiceId = $"INV-{DateTime.UtcNow:yyyyMMdd}-{companyId:D4}";
            var transactionId = $"TXN-{Guid.NewGuid().ToString()[..8].ToUpper()}";

            return Ok(new
            {
                message = result.Message,
                company = new
                {
                    id = result.Company?.Id,
                    name = result.Company?.Name,
                    planName = "BUSINESS",
                    billingCycle = request.BillingCycle,
                    subscriptionStatus = "Active",
                    subscriptionStartedAt = result.Company?.SubscriptionStartedAt,
                    subscriptionExpiresAt = result.Company?.SubscriptionExpiresAt
                },
                payment = new
                {
                    invoiceId,
                    transactionId,
                    amount = request.BillingCycle == "Quarterly" ? 2499 : 8999,
                    currency = "PHP",
                    status = "Success"
                }
            });
        }

        /// <summary>
        /// Get current subscription status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;

            if (string.IsNullOrEmpty(companyIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var companyId = int.Parse(companyIdClaim);

            var status = await _subscriptionService.GetSubscriptionStatus(companyId);

            if (status == null)
                return NotFound(new { message = "Company not found" });

            return Ok(status);
        }

        /// <summary>
        /// Request subscription cancellation
        /// </summary>
        [HttpPost("cancel-request")]
        public async Task<IActionResult> RequestCancellation([FromBody] CancellationRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(companyIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);
            var companyId = int.Parse(companyIdClaim);

            if (string.IsNullOrWhiteSpace(request.Reason))
                return BadRequest(new { message = "Cancellation reason is required" });

            var result = await _subscriptionService.RequestCancellation(companyId, userId, request.Reason);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Get all pending cancellation requests (Super Admin only)
        /// </summary>
        [HttpGet("cancellation-requests")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetCancellationRequests()
        {
            // This will be implemented in Phase 2
            return Ok(new { message = "Feature coming soon" });
        }

        /// <summary>
        /// Approve cancellation request (Super Admin only)
        /// </summary>
        [HttpPost("approve-cancellation/{requestId}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> ApproveCancellation(int requestId, [FromBody] ReviewRequest? request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);

            var result = await _subscriptionService.ApproveCancellation(requestId, userId, request?.ReviewNotes);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        /// <summary>
        /// Reject cancellation request (Super Admin only)
        /// </summary>
        [HttpPost("reject-cancellation/{requestId}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> RejectCancellation(int requestId, [FromBody] ReviewRequest? request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { message = "Invalid token" });

            var userId = int.Parse(userIdClaim);

            var result = await _subscriptionService.RejectCancellation(requestId, userId, request?.ReviewNotes);

            if (!result.Success)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }
    }

    // DTOs
    public class PlanChangeRequest
    {
        public string BillingCycle { get; set; } = "Quarterly";
        public string? Reason { get; set; }
    }

    public class UpgradeRequest
    {
        public string BillingCycle { get; set; } = "Quarterly";
    }

    public class CancellationRequest
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class ReviewRequest
    {
        public string? ReviewNotes { get; set; }
    }
}
