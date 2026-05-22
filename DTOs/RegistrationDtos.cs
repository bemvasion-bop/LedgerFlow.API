using System.ComponentModel.DataAnnotations;

namespace LedgerFlow.API.DTOs
{
    /// <summary>
    /// Public company registration request (for self-service signup)
    /// </summary>
    public class PublicCompanyRegistrationDto
    {
        [Required(ErrorMessage = "Company name is required")]
        [StringLength(100, ErrorMessage = "Company name cannot exceed 100 characters")]
        public string CompanyName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Company email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string CompanyEmail { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? CompanyPhone { get; set; }

        [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters")]
        public string? CompanyAddress { get; set; }

        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, ErrorMessage = "First name cannot exceed 50 characters")]
        public string AdminFirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, ErrorMessage = "Last name cannot exceed 50 characters")]
        public string AdminLastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Admin email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string AdminEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
            ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")]
        public string AdminPassword { get; set; } = string.Empty;

        public int PlanId { get; set; } = 1; // Default to Starter plan
        
        [Required(ErrorMessage = "Billing cycle is required")]
        [RegularExpression(@"^(Quarterly|Yearly)$", ErrorMessage = "Billing cycle must be either 'Quarterly' or 'Yearly'")]
        public string BillingCycle { get; set; } = "Quarterly"; // Default to Quarterly
    }

    /// <summary>
    /// OTP verification request
    /// </summary>
    public class VerifyOtpDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "OTP code is required")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "OTP must be 6 digits")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must be 6 digits")]
        public string OtpCode { get; set; } = string.Empty;
    }

    /// <summary>
    /// Resend OTP request
    /// </summary>
    public class ResendOtpDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Registration response
    /// </summary>
    public class RegistrationResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Email { get; set; }
        public DateTime? OtpExpiresAt { get; set; }
    }

    /// <summary>
    /// Verification response
    /// </summary>
    public class VerificationResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public UserInfoDto? User { get; set; }
    }

    /// <summary>
    /// User info for response
    /// </summary>
    public class UserInfoDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
    }
}
