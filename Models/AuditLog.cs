using System.Text.Json.Serialization;

namespace LedgerFlow.API.Models
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        
        [JsonIgnore]
        public User? User { get; set; }
        
        public string Action { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public string? Details { get; set; }

        /// <summary>Tenant isolation.</summary>
        public int CompanyId { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
