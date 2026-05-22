using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LedgerFlow.API.Models
{
    public class User
    {
        public int Id { get; set; }

        [Column("first_name")]
        public string FirstName { get; set; }

        [Column("last_name")]
        public string LastName { get; set; }

        [Column("email")]
        public string Email { get; set; }

        [Column("password_hash")]
        public string PasswordHash { get; set; }

        [NotMapped]
        public string Password { get; set; }

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("position")]
        public string? Position { get; set; }

        [Column("preferences")]
        public string? Preferences { get; set; }

        [Column("is_verified")]
        public bool IsVerified { get; set; } = false;

        [Column("verification_code")]
        public string? VerificationCode {get; set; }    

        [Column("refresh_token")]
        public string? RefreshToken { get; set; }

        [Column("refresh_token_expiry")]
        public DateTime? RefreshTokenExpiry { get; set; }

        [Column("role_id")]
        public int RoleId { get; set; }
        public Role? Role { get; set; }

        /// <summary>Department assignment (optional)</summary>
        [Column("department_id")]
        public int? DepartmentId { get; set; }
        [JsonIgnore]
        public Department? Department { get; set; }

        /// <summary>Tenant isolation — every user belongs to exactly one company.</summary>
        public int CompanyId { get; set; }
        [JsonIgnore]
        public Company? Company { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Password Reset Fields
        [Column("password_reset_token")]
        public string? PasswordResetToken { get; set; }

        [Column("password_reset_token_expiry")]
        public DateTime? PasswordResetTokenExpiry { get; set; }
    }
}