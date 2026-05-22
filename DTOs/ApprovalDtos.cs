namespace LedgerFlow.API.DTOs
{
    public class CreateApprovalDto
    {
        public int ExpenseId { get; set; }
        public string Status { get; set; } // "Approved" or "Rejected"
        public string? Remarks { get; set; }
    }

    public class ApprovalResponseDto
    {
        public int Id { get; set; }
        public int ExpenseId { get; set; }
        public int ApprovedBy { get; set; }
        public string ApproverName { get; set; }
        public string Status { get; set; }
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Include expense details for convenience
        public ExpenseResponseDto? Expense { get; set; }
    }

    public class ApprovalHistoryDto
    {
        public int Id { get; set; }
        public int ExpenseId { get; set; }
        public string ExpenseDescription { get; set; }
        public decimal ExpenseAmount { get; set; }
        public string ApproverName { get; set; }
        public string Status { get; set; }
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
