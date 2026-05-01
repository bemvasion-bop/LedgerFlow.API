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
    }
}