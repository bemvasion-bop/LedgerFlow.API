using LedgerFlow.API.Data;
using LedgerFlow.API.DTOs;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace LedgerFlow.API.Services
{
    public class UserSettingsService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UserSettingsService> _logger;

        public UserSettingsService(AppDbContext context, ILogger<UserSettingsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get user profile by user ID
        /// </summary>
        public async Task<UserProfileDto?> GetUserProfileAsync(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    return null;
                }

                return new UserProfileDto
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    Phone = user.Phone,
                    RoleName = user.Role?.RoleName ?? "Unknown",
                    CompanyName = user.Company?.Name ?? "Unknown",
                    CompanyId = user.CompanyId,
                    RoleId = user.RoleId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Update user profile
        /// </summary>
        public async Task<bool> UpdateUserProfileAsync(int userId, UpdateProfileDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                user.FirstName = dto.FirstName;
                user.LastName = dto.LastName;
                user.Phone = dto.Phone;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Change user password
        /// </summary>
        public async Task<(bool Success, string Message)> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return (false, "User not found");
                }

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                {
                    return (false, "Current password is incorrect");
                }

                // Validate new password
                if (dto.NewPassword.Length < 8)
                {
                    return (false, "New password must be at least 8 characters long");
                }

                // Hash and update password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return (true, "Password changed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Get user preferences (stored in User.Preferences JSON field)
        /// </summary>
        public async Task<UserPreferencesDto> GetUserPreferencesAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null || string.IsNullOrEmpty(user.Preferences))
                {
                    // Return default preferences
                    return new UserPreferencesDto();
                }

                // Parse JSON preferences
                var preferences = System.Text.Json.JsonSerializer.Deserialize<UserPreferencesDto>(user.Preferences);
                return preferences ?? new UserPreferencesDto();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting preferences for user {UserId}", userId);
                // Return defaults on error
                return new UserPreferencesDto();
            }
        }

        /// <summary>
        /// Update user preferences
        /// </summary>
        public async Task<bool> UpdateUserPreferencesAsync(int userId, UserPreferencesDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                // Serialize preferences to JSON
                user.Preferences = System.Text.Json.JsonSerializer.Serialize(dto);
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating preferences for user {UserId}", userId);
                throw;
            }
        }
    }
}
