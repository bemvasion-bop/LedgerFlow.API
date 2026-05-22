using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LedgerFlow.API.Models
{
    /// <summary>
    /// Represents a subscription change request (upgrade, downgrade, or plan switch)
    /// Requires Super Admin approval before taking effect
    /// </summary>
    public class SubscriptionRequest
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CompanyId { get; set; }

        [ForeignKey("CompanyId")]
        public Company? Company { get; set; }

        /// <summary>
        /// Current plan name (e.g., "STARTER", "BUSINESS")
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string CurrentPlan { get; set; } = string.Empty;

        /// <summary>
        /// Requested plan name (e.g., "BUSINESS")
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string RequestedPlan { get; set; } = string.Empty;

        /// <summary>
        /// Current billing cycle (e.g., "Quarterly", "Yearly", or null for Starter)
        /// </summary>
        [MaxLength(20)]
        public string? CurrentBillingCycle { get; set; }

        /// <summary>
        /// Requested billing cycle (e.g., "Quarterly", "Yearly")
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string RequestedBillingCycle { get; set; } = string.Empty;

        /// <summary>
        /// Type of request: "Upgrade", "Downgrade", "PlanSwitch", "Cancellation"
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string RequestType { get; set; } = string.Empty;

        /// <summary>
        /// Status: "Pending", "Approved", "Rejected"
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        /// <summary>
        /// User who requested the change
        /// </summary>
        [Required]
        public int RequestedBy { get; set; }

        [ForeignKey("RequestedBy")]
        public User? RequestedByUser { get; set; }

        /// <summary>
        /// When the request was created
        /// </summary>
        [Required]
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Super Admin who approved/rejected the request
        /// </summary>
        public int? ReviewedBy { get; set; }

        [ForeignKey("ReviewedBy")]
        public User? ReviewedByUser { get; set; }

        /// <summary>
        /// When the request was reviewed
        /// </summary>
        public DateTime? ReviewedAt { get; set; }

        /// <summary>
        /// Reason for rejection or additional notes
        /// </summary>
        [MaxLength(500)]
        public string? ReviewNotes { get; set; }

        /// <summary>
        /// Optional reason provided by the requester
        /// </summary>
        [MaxLength(500)]
        public string? RequestReason { get; set; }
    }
}
