using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LedgerFlow.API.Models
{
    /// <summary>
    /// Represents a notification for users (Super Admin or Company Admin)
    /// </summary>
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// User who receives this notification
        /// </summary>
        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        /// <summary>
        /// Notification title
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Notification message/description
        /// </summary>
        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Type: SubscriptionRequest, SubscriptionApproved, SubscriptionRejected, 
        /// TrialExpiring, Security, Billing, System
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Whether the notification has been read
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// Optional reference to related entity (e.g., SubscriptionRequestId)
        /// </summary>
        public int? RelatedEntityId { get; set; }

        /// <summary>
        /// Optional related entity type (e.g., "SubscriptionRequest", "Company")
        /// </summary>
        [MaxLength(50)]
        public string? RelatedEntityType { get; set; }

        /// <summary>
        /// When the notification was created
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the notification was read (if applicable)
        /// </summary>
        public DateTime? ReadAt { get; set; }
    }
}
