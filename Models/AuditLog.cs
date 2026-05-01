namespace LedgerFlow.API
{

    public class AuditLog
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string Action { get; set; }

        public string Entity { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

}
