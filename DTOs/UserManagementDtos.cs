using System.ComponentModel.DataAnnotations;

namespace LedgerFlow.API.DTOs
{
    public class CreateUserDto
    {
        [Required(ErrorMessage = "First name is required.")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Last name is required.")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address.")]
        public string Email { get; set; }

        /// <summary>Phone number (optional but validated if provided)</summary>
        [Phone(ErrorMessage = "Invalid phone number format.")]
        public string? PhoneNumber { get; set; }

        /// <summary>Position/Job Title (required for both Starter and Business plans)</summary>
        [Required(ErrorMessage = "Position is required.")]
        [StringLength(100, ErrorMessage = "Position must not exceed 100 characters.")]
        public string Position { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(100, MinimumLength = 8,
            ErrorMessage = "Password must be between 8 and 100 characters.")]
        [RegularExpression(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$",
            ErrorMessage = "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Role is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "A valid role must be selected.")]
        public int RoleId { get; set; }

        /// <summary>Department assignment (optional for Admin, required for Employee/Finance/Audit in Business plan)</summary>
        public int? DepartmentId { get; set; }
    }

    public class UpdateUserDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email address.")]
        public string? Email { get; set; }

        /// <summary>Phone number (optional but validated if provided)</summary>
        [Phone(ErrorMessage = "Invalid phone number format.")]
        public string? PhoneNumber { get; set; }

        /// <summary>Position/Job Title</summary>
        [StringLength(100, ErrorMessage = "Position must not exceed 100 characters.")]
        public string? Position { get; set; }

        // Password is optional on update — only validated when provided
        [StringLength(100, MinimumLength = 8,
            ErrorMessage = "Password must be between 8 and 100 characters.")]
        [RegularExpression(
            @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$",
            ErrorMessage = "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.")]
        public string? Password { get; set; }

        public int? RoleId { get; set; }

        /// <summary>Department assignment (optional for Admin, required for Employee/Finance/Audit in Business plan)</summary>
        public int? DepartmentId { get; set; }
    }

    public class AdminUserResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Position { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public int CompanyId { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public bool IsActive { get; set; }
    }

    public class RoleDto
    {
        public int Id { get; set; }
        public string RoleName { get; set; }
    }

    public class PlanFeaturesDto
    {
        public string PlanName { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int MaxExpensesPerMonth { get; set; }
        public bool CanUploadReceipt { get; set; }
        public bool HasAdvancedReports { get; set; }
        public bool HasAdvancedAnalytics { get; set; }
        public bool HasDepartmentAnalytics { get; set; }
        public bool HasRoleBasedWorkflows { get; set; }
        public bool HasPrioritySupport { get; set; }
    }
}
