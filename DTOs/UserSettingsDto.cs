namespace LedgerFlow.API.DTOs
{
    /// <summary>
    /// User profile information
    /// </summary>
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public int RoleId { get; set; }
    }

    /// <summary>
    /// Update profile request
    /// </summary>
    public class UpdateProfileDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    /// <summary>
    /// Change password request
    /// </summary>
    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// User preferences
    /// </summary>
    public class UserPreferencesDto
    {
        public string Theme { get; set; } = "dark";
        public string Currency { get; set; } = "PHP";
        public string Timezone { get; set; } = "Asia/Manila";
        public string DateFormat { get; set; } = "MM/DD/YYYY";
        public bool EmailNotifications { get; set; } = true;
        public bool ApprovalAlerts { get; set; } = true;
        public bool ExpenseAlerts { get; set; } = false;
        public bool SecurityAlerts { get; set; } = true;
    }
}
