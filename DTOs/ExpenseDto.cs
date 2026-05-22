namespace LedgerFlow.API.DTOs
{
    public class CreateExpenseDto
    {
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public int? CategoryId { get; set; }
    }

    public class UpdateExpenseDto
    {
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public int? CategoryId { get; set; }
    }

    public class ExpenseResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public string Status { get; set; }
        public DateTime SubmittedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? ReimbursedAt { get; set; }
        public string? RejectionReason { get; set; }
        public List<ReceiptDto> Receipts { get; set; } = new();
    }

    public class ReceiptDto
    {
        public int Id { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class ApproveExpenseDto
    {
        public string? Remarks { get; set; }
    }

    public class RejectExpenseDto
    {
        public string RejectionReason { get; set; }
    }
}
