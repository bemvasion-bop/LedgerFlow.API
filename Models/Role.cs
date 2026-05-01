using System.ComponentModel.DataAnnotations.Schema;

namespace LedgerFlow.API.Models
{
    public class Role
    {
        public int Id { get; set; }

        [Column("role_name")]   // ✅ THIS IS THE FIX
        public string RoleName { get; set; }
    }
}