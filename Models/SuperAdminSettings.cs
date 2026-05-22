using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LedgerFlow.API.Models
{
    /// <summary>
    /// Super Admin preferences and settings
    /// </summary>
    public class SuperAdminSettings
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// Super Admin user ID
        /// </summary>
        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        /// <summary>
        /// Enable/disable email notifications
        /// </summary>
        public bool EmailNotifications { get; set; } = true;

        /// <summary>
        /// Enable/disable approval alerts
        /// </summary>
        public bool ApprovalAlerts { get; set; } = true;

        /// <summary>
        /// Enable/disable security alerts
        /// </summary>
        public bool SecurityAlerts { get; set; } = true;

        /// <summary>
        /// UI theme preference (Light, Dark, Auto)
        /// </summary>
        [MaxLength(20)]
        public string Theme { get; set; } = "Dark";

        /// <summary>
        /// Currency preference (PHP, USD, etc.)
        /// </summary>
        [MaxLength(10)]
        public string Currency { get; set; } = "PHP";

        /// <summary>
        /// Timezone preference
        /// </summary>
        [MaxLength(50)]
        public string Timezone { get; set; } = "Asia/Manila";

        /// <summary>
        /// Date format preference (MM/DD/YYYY, DD/MM/YYYY, etc.)
        /// </summary>
        [MaxLength(20)]
        public string DateFormat { get; set; } = "MM/DD/YYYY";

        /// <summary>
        /// When settings were created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When settings were last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
