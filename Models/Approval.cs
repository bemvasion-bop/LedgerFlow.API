namespace LedgerFlow.API.Models
{
    /// <summary>
    /// Tracks approval/rejection history for expenses.
    /// </summary>
    public class Approval
    {
        public int Id { get; set; }
        public int ExpenseId { get; set; }
        public Expense? Expense { get; set; }

        public int ApprovedBy { get; set; }
        public User? Approver { get; set; }

        /// <summary>Approved | Rejected</summary>
        public string Status { get; set; } = string.Empty;

        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
