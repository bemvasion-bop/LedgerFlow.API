using System.Text.Json.Serialization;

namespace LedgerFlow.API.Models 
{
    public class Expense
    {
        public int Id {get; set; }
        public int UserId {get; set; }
        public decimal Amount {get; set; }
        public string Description {get; set; }
        public string Category {get; set; }
        public int? CategoryId { get; set; }
        public string Status {get; set; } // Pending, Approved, Rejected, Reimbursed
        public DateTime SubmittedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? ReimbursedAt { get; set; }
        public string? RejectionReason { get; set; }

        /// <summary>Tenant isolation.</summary>
        public int CompanyId { get; set; }

        [JsonIgnore]
        public User? User {get; set; }

        public Category? CategoryRef { get; set; }

        [JsonIgnore]
        public ICollection<Receipt>? Receipts { get; set; }
    }
}