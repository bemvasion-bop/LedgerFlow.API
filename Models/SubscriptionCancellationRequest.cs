namespace LedgerFlow.API.Models
{
    /// <summary>
    /// Represents a request to cancel a company's subscription.
    /// Requires Super Admin approval.
    /// </summary>
    public class SubscriptionCancellationRequest
    {
        public int Id { get; set; }
        
        public int CompanyId { get; set; }
        public Company? Company { get; set; }
        
        public int RequestedBy { get; set; }
        public User? RequestedByUser { get; set; }
        
        public string Reason { get; set; } = string.Empty;
        
        /// <summary>Pending | Approved | Rejected</summary>
        public string Status { get; set; } = "Pending";
        
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        
        public int? ReviewedBy { get; set; }
        public User? ReviewedByUser { get; set; }
        
        public DateTime? ReviewedAt { get; set; }
        
        public string? ReviewNotes { get; set; }
    }
}
