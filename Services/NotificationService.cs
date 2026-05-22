using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class NotificationService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(AppDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Create a notification for a user
        /// </summary>
        public async Task<Notification> CreateNotificationAsync(
            int userId,
            string title,
            string message,
            string type,
            int? relatedEntityId = null,
            string? relatedEntityType = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedEntityId = relatedEntityId,
                RelatedEntityType = relatedEntityType,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Notification created for user {userId}: {title}");

            return notification;
        }

        /// <summary>
        /// Notify all Super Admins about a subscription request
        /// </summary>
        public async Task NotifySuperAdminsAboutSubscriptionRequestAsync(
            int subscriptionRequestId,
            string companyName,
            string requestedPlan,
            string billingCycle)
        {
            // Get all Super Admin users with approval alerts enabled
            var superAdmins = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role != null && u.Role.RoleName == "SuperAdmin")
                .ToListAsync();

            foreach (var admin in superAdmins)
            {
                // Check if admin has approval alerts enabled
                var settings = await _context.SuperAdminSettings
                    .FirstOrDefaultAsync(s => s.UserId == admin.Id);

                if (settings == null || settings.ApprovalAlerts)
                {
                    await CreateNotificationAsync(
                        admin.Id,
                        "New Subscription Request",
                        $"{companyName} requested {requestedPlan} Plan ({billingCycle} billing)",
                        "SubscriptionRequest",
                        subscriptionRequestId,
                        "SubscriptionRequest"
                    );
                }
            }
        }

        /// <summary>
        /// Notify company admin about subscription approval
        /// </summary>
        public async Task NotifyCompanyAdminAboutApprovalAsync(
            int companyId,
            string planName,
            string billingCycle)
        {
            // Get company admin
            var admin = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.CompanyId == companyId && u.Role != null && u.Role.RoleName == "Admin")
                .FirstOrDefaultAsync();

            if (admin != null)
            {
                await CreateNotificationAsync(
                    admin.Id,
                    "Subscription Approved",
                    $"Your subscription to {planName} Plan ({billingCycle} billing) has been approved and activated!",
                    "SubscriptionApproved",
                    companyId,
                    "Company"
                );
            }
        }

        /// <summary>
        /// Notify company admin about subscription rejection
        /// </summary>
        public async Task NotifyCompanyAdminAboutRejectionAsync(
            int companyId,
            string planName,
            string billingCycle,
            string? reason)
        {
            // Get company admin
            var admin = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.CompanyId == companyId && u.Role != null && u.Role.RoleName == "Admin")
                .FirstOrDefaultAsync();

            if (admin != null)
            {
                var message = $"Your subscription request for {planName} Plan ({billingCycle} billing) was rejected.";
                if (!string.IsNullOrWhiteSpace(reason))
                {
                    message += $" Reason: {reason}";
                }

                await CreateNotificationAsync(
                    admin.Id,
                    "Subscription Request Rejected",
                    message,
                    "SubscriptionRejected",
                    companyId,
                    "Company"
                );
            }
        }

        /// <summary>
        /// Notify company admin about trial expiring soon
        /// </summary>
        public async Task NotifyCompanyAdminAboutTrialExpiringAsync(
            int companyId,
            int daysRemaining)
        {
            var admin = await _context.Users
                .Include(u => u.Role)
                .Where(u => u.CompanyId == companyId && u.Role != null && u.Role.RoleName == "Admin")
                .FirstOrDefaultAsync();

            if (admin != null)
            {
                await CreateNotificationAsync(
                    admin.Id,
                    "Trial Expiring Soon",
                    $"Your trial period will expire in {daysRemaining} days. Upgrade now to continue using SpendSync!",
                    "TrialExpiring",
                    companyId,
                    "Company"
                );
            }
        }

        /// <summary>
        /// Get unread notifications for a user
        /// </summary>
        public async Task<List<Notification>> GetUnreadNotificationsAsync(int userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Get all notifications for a user (with pagination)
        /// </summary>
        public async Task<List<Notification>> GetNotificationsAsync(
            int userId,
            int page = 1,
            int pageSize = 20)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        /// <summary>
        /// Get unread notification count for a user
        /// </summary>
        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        /// <summary>
        /// Mark notification as read
        /// </summary>
        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return false;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Mark all notifications as read for a user
        /// </summary>
        public async Task<int> MarkAllAsReadAsync(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return notifications.Count;
        }

        /// <summary>
        /// Delete a notification
        /// </summary>
        public async Task<bool> DeleteNotificationAsync(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return false;

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return true;
        }

        /// <summary>
        /// Delete all read notifications for a user
        /// </summary>
        public async Task<int> DeleteReadNotificationsAsync(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && n.IsRead)
                .ToListAsync();

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();
            return notifications.Count;
        }
    }
}
