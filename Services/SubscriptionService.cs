using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class SubscriptionService
    {
        private readonly AppDbContext _context;
        private readonly AuditLogService _auditLogService;
        private readonly NotificationService _notificationService;

        public SubscriptionService(
            AppDbContext context, 
            AuditLogService auditLogService,
            NotificationService notificationService)
        {
            _context = context;
            _auditLogService = auditLogService;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Request a subscription plan change (requires Super Admin approval)
        /// </summary>
        public async Task<(bool Success, string Message, int? RequestId)> RequestPlanChange(
            int companyId,
            int requestedBy,
            string requestedPlan,
            string requestedBillingCycle,
            string? requestReason = null)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                return (false, "Company not found", null);

            // Validate billing cycle
            if (requestedBillingCycle != "Quarterly" && requestedBillingCycle != "Yearly")
                return (false, "Invalid billing cycle. Must be Quarterly or Yearly", null);

            // Check if already has pending request
            var existingRequest = await _context.SubscriptionRequests
                .FirstOrDefaultAsync(r => r.CompanyId == companyId && r.Status == "Pending");

            if (existingRequest != null)
                return (false, "A subscription change request is already pending approval", null);

            // Determine request type
            string requestType;
            var currentPlan = company.Plan?.Name ?? "STARTER";
            
            if (currentPlan == "STARTER" && requestedPlan == "BUSINESS")
                requestType = "Upgrade";
            else if (currentPlan == "BUSINESS" && requestedPlan == "STARTER")
                requestType = "Downgrade";
            else if (currentPlan == requestedPlan && company.BillingCycle != requestedBillingCycle)
                requestType = "PlanSwitch";
            else
                requestType = "Upgrade"; // Default

            // Create subscription request
            var request = new SubscriptionRequest
            {
                CompanyId = companyId,
                CurrentPlan = currentPlan,
                RequestedPlan = requestedPlan,
                CurrentBillingCycle = company.BillingCycle,
                RequestedBillingCycle = requestedBillingCycle,
                RequestType = requestType,
                Status = "Pending",
                RequestedBy = requestedBy,
                RequestedAt = DateTime.UtcNow,
                RequestReason = requestReason
            };

            _context.SubscriptionRequests.Add(request);
            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: requestedBy,
                companyId: companyId,
                action: "SUBSCRIPTION_CHANGE_REQUESTED",
                entity: "SubscriptionRequest",
                entityId: request.Id.ToString(),
                details: $"{requestType} requested: {currentPlan} ({company.BillingCycle ?? "N/A"}) → {requestedPlan} ({requestedBillingCycle})"
            );

            // Notify Super Admins
            await _notificationService.NotifySuperAdminsAboutSubscriptionRequestAsync(
                request.Id,
                company.Name,
                requestedPlan,
                requestedBillingCycle
            );

            return (true, "Subscription change request submitted successfully. Awaiting Super Admin approval.", request.Id);
        }

        /// <summary>
        /// Approve subscription change request (Super Admin only)
        /// </summary>
        public async Task<(bool Success, string Message)> ApproveSubscriptionRequest(
            int requestId,
            int reviewedBy,
            string? reviewNotes = null)
        {
            var request = await _context.SubscriptionRequests
                .Include(r => r.Company)
                .ThenInclude(c => c!.Plan)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
                return (false, "Subscription request not found");

            if (request.Status != "Pending")
                return (false, "Request has already been reviewed");

            // Get the requested plan
            var requestedPlan = await _context.Plans
                .FirstOrDefaultAsync(p => p.Name == request.RequestedPlan);

            if (requestedPlan == null)
                return (false, "Requested plan not found");

            // Update company subscription
            var company = request.Company;
            if (company != null)
            {
                company.PlanId = requestedPlan.Id;
                company.BillingCycle = request.RequestedBillingCycle;
                company.SubscriptionStatus = "Active";
                company.SubscriptionStartedAt = DateTime.UtcNow;
                
                // Set expiration based on billing cycle
                company.SubscriptionExpiresAt = request.RequestedBillingCycle == "Quarterly"
                    ? DateTime.UtcNow.AddMonths(3)
                    : DateTime.UtcNow.AddMonths(12);
                
                company.UpdatedAt = DateTime.UtcNow;
            }

            // Update request status
            request.Status = "Approved";
            request.ReviewedBy = reviewedBy;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewNotes = reviewNotes;

            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: reviewedBy,
                companyId: request.CompanyId,
                action: "SUBSCRIPTION_CHANGE_APPROVED",
                entity: "SubscriptionRequest",
                entityId: requestId.ToString(),
                details: $"Approved: {request.CurrentPlan} → {request.RequestedPlan} ({request.RequestedBillingCycle})"
            );

            // Notify company admin
            await _notificationService.NotifyCompanyAdminAboutApprovalAsync(
                request.CompanyId,
                request.RequestedPlan,
                request.RequestedBillingCycle
            );

            return (true, "Subscription change request approved successfully");
        }

        /// <summary>
        /// Reject subscription change request (Super Admin only)
        /// </summary>
        public async Task<(bool Success, string Message)> RejectSubscriptionRequest(
            int requestId,
            int reviewedBy,
            string? reviewNotes = null)
        {
            var request = await _context.SubscriptionRequests
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
                return (false, "Subscription request not found");

            if (request.Status != "Pending")
                return (false, "Request has already been reviewed");

            // Update request status
            request.Status = "Rejected";
            request.ReviewedBy = reviewedBy;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewNotes = reviewNotes;

            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: reviewedBy,
                companyId: request.CompanyId,
                action: "SUBSCRIPTION_CHANGE_REJECTED",
                entity: "SubscriptionRequest",
                entityId: requestId.ToString(),
                details: $"Rejected: {request.CurrentPlan} → {request.RequestedPlan}. Reason: {reviewNotes}"
            );

            // Notify company admin
            await _notificationService.NotifyCompanyAdminAboutRejectionAsync(
                request.CompanyId,
                request.RequestedPlan,
                request.RequestedBillingCycle,
                reviewNotes
            );

            return (true, "Subscription change request rejected");
        }

        /// <summary>
        /// Get all pending subscription requests (Super Admin only)
        /// </summary>
        public async Task<List<object>> GetPendingSubscriptionRequests()
        {
            var requests = await _context.SubscriptionRequests
                .Include(r => r.Company)
                .Include(r => r.RequestedByUser)
                .Where(r => r.Status == "Pending")
                .OrderByDescending(r => r.RequestedAt)
                .Select(r => new
                {
                    r.Id,
                    r.CompanyId,
                    CompanyName = r.Company!.Name,
                    r.CurrentPlan,
                    r.RequestedPlan,
                    r.CurrentBillingCycle,
                    r.RequestedBillingCycle,
                    r.RequestType,
                    r.Status,
                    RequestedByName = r.RequestedByUser!.FirstName + " " + r.RequestedByUser.LastName,
                    r.RequestedAt,
                    r.RequestReason
                })
                .ToListAsync();

            return requests.Cast<object>().ToList();
        }

        /// <summary>
        /// Upgrade company to Business Plan with simulated payment
        /// </summary>
        public async Task<(bool Success, string Message, Company? Company)> UpgradeToBusiness(
            int companyId, 
            string billingCycle, 
            int upgradedBy)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                return (false, "Company not found", null);

            // Get Business Plan
            var businessPlan = await _context.Plans
                .FirstOrDefaultAsync(p => p.Name == "BUSINESS");

            if (businessPlan == null)
                return (false, "Business plan not found", null);

            // Validate billing cycle
            if (billingCycle != "Quarterly" && billingCycle != "Yearly")
                return (false, "Invalid billing cycle. Must be Quarterly or Yearly", null);

            // Update company subscription
            company.PlanId = businessPlan.Id;
            company.BillingCycle = billingCycle;
            company.SubscriptionStatus = "Active";
            company.SubscriptionStartedAt = DateTime.UtcNow;
            
            // Set expiration based on billing cycle
            company.SubscriptionExpiresAt = billingCycle == "Quarterly"
                ? DateTime.UtcNow.AddMonths(3)
                : DateTime.UtcNow.AddMonths(12);
            
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: upgradedBy,
                companyId: companyId,
                action: "SUBSCRIPTION_UPGRADE",
                entity: "Company",
                entityId: companyId.ToString(),
                details: $"Upgraded to Business Plan ({billingCycle})"
            );

            return (true, "Subscription upgraded successfully", company);
        }

        /// <summary>
        /// Request subscription cancellation (requires Super Admin approval)
        /// </summary>
        public async Task<(bool Success, string Message)> RequestCancellation(
            int companyId,
            int requestedBy,
            string reason)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null)
                return (false, "Company not found");

            // Check if already has pending request
            var existingRequest = await _context.SubscriptionCancellationRequests
                .FirstOrDefaultAsync(r => r.CompanyId == companyId && r.Status == "Pending");

            if (existingRequest != null)
                return (false, "A cancellation request is already pending");

            // Create cancellation request
            var request = new SubscriptionCancellationRequest
            {
                CompanyId = companyId,
                RequestedBy = requestedBy,
                Reason = reason,
                Status = "Pending",
                RequestedAt = DateTime.UtcNow
            };

            _context.SubscriptionCancellationRequests.Add(request);
            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: requestedBy,
                companyId: companyId,
                action: "CANCELLATION_REQUESTED",
                entity: "Subscription",
                entityId: request.Id.ToString(),
                details: $"Cancellation requested: {reason}"
            );

            return (true, "Cancellation request submitted successfully");
        }

        /// <summary>
        /// Approve cancellation request (Super Admin only)
        /// </summary>
        public async Task<(bool Success, string Message)> ApproveCancellation(
            int requestId,
            int reviewedBy,
            string? reviewNotes = null)
        {
            var request = await _context.SubscriptionCancellationRequests
                .Include(r => r.Company)
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
                return (false, "Cancellation request not found");

            if (request.Status != "Pending")
                return (false, "Request has already been reviewed");

            // Update request status
            request.Status = "Approved";
            request.ReviewedBy = reviewedBy;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewNotes = reviewNotes;

            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: reviewedBy,
                companyId: request.CompanyId,
                action: "CANCELLATION_APPROVED",
                entity: "Subscription",
                entityId: requestId.ToString(),
                details: $"Cancellation approved. Will downgrade on {request.Company?.SubscriptionExpiresAt:yyyy-MM-dd}"
            );

            return (true, "Cancellation request approved. Subscription will remain active until expiration date.");
        }

        /// <summary>
        /// Reject cancellation request (Super Admin only)
        /// </summary>
        public async Task<(bool Success, string Message)> RejectCancellation(
            int requestId,
            int reviewedBy,
            string? reviewNotes = null)
        {
            var request = await _context.SubscriptionCancellationRequests
                .FirstOrDefaultAsync(r => r.Id == requestId);

            if (request == null)
                return (false, "Cancellation request not found");

            if (request.Status != "Pending")
                return (false, "Request has already been reviewed");

            // Update request status
            request.Status = "Rejected";
            request.ReviewedBy = reviewedBy;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewNotes = reviewNotes;

            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: reviewedBy,
                companyId: request.CompanyId,
                action: "CANCELLATION_REJECTED",
                entity: "Subscription",
                entityId: requestId.ToString(),
                details: $"Cancellation rejected: {reviewNotes}"
            );

            return (true, "Cancellation request rejected");
        }

        /// <summary>
        /// Downgrade company to Starter Plan (called when subscription expires)
        /// </summary>
        public async Task<(bool Success, string Message)> DowngradeToStarter(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                return (false, "Company not found");

            // Get Starter Plan
            var starterPlan = await _context.Plans
                .FirstOrDefaultAsync(p => p.Name == "STARTER");

            if (starterPlan == null)
                return (false, "Starter plan not found");

            // Update company to Starter
            company.PlanId = starterPlan.Id;
            company.SubscriptionStatus = "Cancelled";
            company.BillingCycle = "Quarterly"; // Reset to default
            company.SubscriptionExpiresAt = null;
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Create audit log
            await _auditLogService.LogActionAsync(
                userId: 0, // System action (no specific user)
                companyId: companyId,
                action: "AUTO_DOWNGRADE",
                entity: "Company",
                entityId: companyId.ToString(),
                details: "Automatically downgraded to Starter Plan after subscription expiration"
            );

            return (true, "Company downgraded to Starter Plan");
        }

        /// <summary>
        /// Check and process expired subscriptions (run daily)
        /// </summary>
        public async Task<int> ProcessExpiredSubscriptions()
        {
            var expiredCompanies = await _context.Companies
                .Where(c => c.SubscriptionExpiresAt < DateTime.UtcNow
                         && c.SubscriptionStatus == "Active")
                .ToListAsync();

            int processedCount = 0;

            foreach (var company in expiredCompanies)
            {
                // Check if there's an approved cancellation request
                var approvedCancellation = await _context.SubscriptionCancellationRequests
                    .FirstOrDefaultAsync(r => r.CompanyId == company.Id && r.Status == "Approved");

                if (approvedCancellation != null)
                {
                    var result = await DowngradeToStarter(company.Id);
                    if (result.Success)
                        processedCount++;
                }
            }

            return processedCount;
        }

        /// <summary>
        /// Get subscription status for a company
        /// </summary>
        public async Task<object?> GetSubscriptionStatus(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                return null;

            // Check for pending cancellation request
            var pendingCancellation = await _context.SubscriptionCancellationRequests
                .FirstOrDefaultAsync(r => r.CompanyId == companyId && r.Status == "Pending");

            return new
            {
                companyId = company.Id,
                companyName = company.Name,
                planName = company.Plan?.Name,
                billingCycle = company.BillingCycle,
                subscriptionStatus = company.SubscriptionStatus,
                subscriptionStartedAt = company.SubscriptionStartedAt,
                subscriptionExpiresAt = company.SubscriptionExpiresAt,
                hasPendingCancellation = pendingCancellation != null,
                features = new
                {
                    hasDepartments = company.Plan?.HasDepartmentAnalytics ?? false,
                    hasWorkflows = company.Plan?.HasRoleBasedWorkflows ?? false,
                    hasAdvancedReports = company.Plan?.HasAdvancedReports ?? false
                }
            };
        }
    }
}
