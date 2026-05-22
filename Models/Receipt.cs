using System.Text.Json.Serialization;

namespace LedgerFlow.API.Models
{
    public class Receipt
    {
        public int Id { get; set; }
        public int ExpenseId { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
        public string ContentType { get; set; }
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }

        [JsonIgnore]
        public Expense? Expense { get; set; }
    }
}
