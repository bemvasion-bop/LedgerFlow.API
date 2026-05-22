using System.ComponentModel.DataAnnotations.Schema;

namespace LedgerFlow.API.Models
{
    /// <summary>
    /// Department within a company for organizational structure.
    /// </summary>
    public class Department
    {
        public int Id { get; set; }
        
        /// <summary>Department name (Finance, HR, Operations, Marketing, IT, Sales)</summary>
        [Column("name")]
        public string Name { get; set; } = string.Empty;
        
        /// <summary>Optional description</summary>
        [Column("description")]
        public string? Description { get; set; }
        
        /// <summary>Tenant isolation - each department belongs to one company</summary>
        [Column("company_id")]
        public int CompanyId { get; set; }
        public Company? Company { get; set; }
        
        /// <summary>Is this department active?</summary>
        [Column("is_active")]
        public bool IsActive { get; set; } = true;
        
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
