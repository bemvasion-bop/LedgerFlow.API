using LedgerFlow.API.DTOs;
using LedgerFlow.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin")]
    public class SuperAdminController : ControllerBase
    {
        private readonly ISuperAdminService _superAdminService;
        private readonly AuditLogService _auditLogService;
        private readonly ReportsService _reportsService;

        public SuperAdminController(
            ISuperAdminService superAdminService,
            AuditLogService auditLogService,
            ReportsService reportsService)
        {
            _superAdminService = superAdminService;
            _auditLogService = auditLogService;
            _reportsService = reportsService;
        }

        /// <summary>
        /// Get all companies in the system
        /// </summary>
        [HttpGet("companies")]
        public async Task<IActionResult> GetAllCompanies()
        {
            var companies = await _superAdminService.GetAllCompaniesAsync();
            return Ok(companies);
        }

        /// <summary>
        /// Create a new company
        /// </summary>
        [HttpPost("companies")]
        public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyDto dto)
        {
            var company = await _superAdminService.CreateCompanyAsync(dto);
            if (company == null)
                return BadRequest(new { message = "Company email already exists" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "COMPANY_CREATED",
                "Company",
                company.Id.ToString(),
                $"Created company {company.Name}"
            );

            return Ok(company);
        }

        /// <summary>
        /// Create a new company with admin account (matches public registration form)
        /// </summary>
        [HttpPost("companies/with-admin")]
        public async Task<IActionResult> CreateCompanyWithAdmin([FromBody] SuperAdminCreateCompanyDto dto)
        {
            try
            {
                var company = await _superAdminService.CreateCompanyWithAdminAsync(dto);

                // Log the action
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _auditLogService.LogActionAsync(
                    userId,
                    0,
                    "COMPANY_CREATED_WITH_ADMIN",
                    "Company",
                    company.Id.ToString(),
                    $"Created company {company.Name} with admin account {dto.AdminEmail}"
                );

                return Ok(new
                {
                    success = true,
                    message = $"Company '{company.Name}' created successfully with admin account",
                    company
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        /// <summary>
        /// Update an existing company
        /// </summary>
        [HttpPut("companies/{companyId}")]
        public async Task<IActionResult> UpdateCompany(int companyId, [FromBody] UpdateCompanyDto dto)
        {
            var company = await _superAdminService.UpdateCompanyAsync(companyId, dto);
            if (company == null)
                return NotFound(new { message = "Company not found" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "COMPANY_UPDATED",
                "Company",
                companyId.ToString(),
                $"Updated company {company.Name}"
            );

            return Ok(company);
        }

        /// <summary>
        /// Update company with admin account details (unified form)
        /// </summary>
        [HttpPut("companies/{companyId}/with-admin")]
        public async Task<IActionResult> UpdateCompanyWithAdmin(int companyId, [FromBody] SuperAdminUpdateCompanyDto dto)
        {
            try
            {
                var company = await _superAdminService.UpdateCompanyWithAdminAsync(companyId, dto);

                // Log the action
                var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
                await _auditLogService.LogActionAsync(
                    userId,
                    0,
                    "COMPANY_UPDATED_WITH_ADMIN",
                    "Company",
                    companyId.ToString(),
                    $"Updated company {company.Name} with admin account details"
                );

                return Ok(new
                {
                    success = true,
                    message = $"Company '{company.Name}' updated successfully",
                    company
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        /// <summary>
        /// Delete a company
        /// </summary>
        [HttpDelete("companies/{companyId}")]
        public async Task<IActionResult> DeleteCompany(int companyId)
        {
            var success = await _superAdminService.DeleteCompanyAsync(companyId);
            if (!success)
                return NotFound(new { message = "Company not found" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "COMPANY_DELETED",
                "Company",
                companyId.ToString(),
                $"Deleted company {companyId}"
            );

            return Ok(new { message = "Company deleted successfully" });
        }

        /// <summary>
        /// Get detailed information about a specific company
        /// </summary>
        [HttpGet("companies/{companyId}")]
        public async Task<IActionResult> GetCompanyDetail(int companyId)
        {
            var company = await _superAdminService.GetCompanyDetailAsync(companyId);
            if (company == null)
                return NotFound(new { message = "Company not found" });

            return Ok(company);
        }

        /// <summary>
        /// Get system-wide statistics
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var stats = await _superAdminService.GetSystemStatsAsync();
            return Ok(stats);
        }

        /// <summary>
        /// Update a company's subscription plan
        /// </summary>
        [HttpPut("companies/plan")]
        public async Task<IActionResult> UpdateCompanyPlan([FromBody] UpdateCompanyPlanDto dto)
        {
            var success = await _superAdminService.UpdateCompanyPlanAsync(dto);
            if (!success)
                return BadRequest(new { message = "Failed to update company plan" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0, // SuperAdmin doesn't belong to a specific company
                "PLAN_UPDATE",
                "Company",
                dto.CompanyId.ToString(),
                $"Updated company {dto.CompanyId} to plan {dto.PlanId}"
            );

            return Ok(new { message = "Company plan updated successfully" });
        }

        /// <summary>
        /// Update a company's subscription status
        /// </summary>
        [HttpPut("companies/subscription")]
        public async Task<IActionResult> UpdateSubscriptionStatus([FromBody] UpdateSubscriptionStatusDto dto)
        {
            var success = await _superAdminService.UpdateSubscriptionStatusAsync(dto);
            if (!success)
                return BadRequest(new { message = "Failed to update subscription status" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "SUBSCRIPTION_UPDATE",
                "Company",
                dto.CompanyId.ToString(),
                $"Updated company {dto.CompanyId} subscription status to {dto.SubscriptionStatus}"
            );

            return Ok(new { message = "Subscription status updated successfully" });
        }

        /// <summary>
        /// Suspend a company
        /// </summary>
        [HttpPost("companies/{companyId}/suspend")]
        public async Task<IActionResult> SuspendCompany(int companyId)
        {
            var success = await _superAdminService.SuspendCompanyAsync(companyId);
            if (!success)
                return BadRequest(new { message = "Failed to suspend company" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "COMPANY_SUSPENDED",
                "Company",
                companyId.ToString(),
                $"Suspended company {companyId}"
            );

            return Ok(new { message = "Company suspended successfully" });
        }

        /// <summary>
        /// Activate a company
        /// </summary>
        [HttpPost("companies/{companyId}/activate")]
        public async Task<IActionResult> ActivateCompany(int companyId)
        {
            var success = await _superAdminService.ActivateCompanyAsync(companyId);
            if (!success)
                return BadRequest(new { message = "Failed to activate company" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "COMPANY_ACTIVATED",
                "Company",
                companyId.ToString(),
                $"Activated company {companyId}"
            );

            return Ok(new { message = "Company activated successfully" });
        }

        /// <summary>
        /// Register a new company (with admin user)
        /// </summary>
        [HttpPost("companies/register")]
        [AllowAnonymous] // Allow public registration
        public async Task<IActionResult> RegisterCompany([FromBody] CompanyRegistrationDto dto)
        {
            var company = await _superAdminService.RegisterCompanyAsync(dto);
            if (company == null)
                return BadRequest(new { message = "Company or admin email already exists" });

            return Ok(new
            {
                message = "Company registered successfully",
                company
            });
        }

        /// <summary>
        /// Get all available plans
        /// </summary>
        [HttpGet("plans")]
        [AllowAnonymous] // Allow public access to view plans
        public async Task<IActionResult> GetAllPlans()
        {
            var plans = await _superAdminService.GetAllPlansAsync();
            return Ok(plans);
        }

        /// <summary>
        /// Extend a company's trial period
        /// </summary>
        [HttpPost("companies/extend-trial")]
        public async Task<IActionResult> ExtendTrial([FromBody] ExtendTrialDto dto)
        {
            var success = await _superAdminService.ExtendTrialAsync(dto.CompanyId, dto.Days);
            if (!success)
                return BadRequest(new { message = "Failed to extend trial" });

            // Log the action
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "TRIAL_EXTENDED",
                "Company",
                dto.CompanyId.ToString(),
                $"Extended trial for company {dto.CompanyId} by {dto.Days} days"
            );

            return Ok(new { message = $"Trial extended by {dto.Days} days successfully" });
        }

        /// <summary>
        /// Get platform activity over the last N days
        /// </summary>
        [HttpGet("analytics/activity")]
        public async Task<IActionResult> GetPlatformActivity([FromQuery] int days = 30)
        {
            var activity = await _superAdminService.GetPlatformActivityAsync(days);
            return Ok(activity);
        }

        /// <summary>
        /// Get global audit logs (all companies)
        /// </summary>
        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetGlobalAuditLogs(
            [FromQuery] int? companyId = null,
            [FromQuery] string? action = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            var (logs, total) = await _auditLogService.GetGlobalAuditLogsAsync(
                companyId,
                action,
                startDate,
                endDate,
                pageNumber,
                pageSize
            );

            return Ok(new
            {
                data = logs,
                total = total,
                page = pageNumber,
                pageSize = pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // PLATFORM USERS MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════

        /// <summary>
        /// Get all platform users across all companies
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetAllPlatformUsers()
        {
            var users = await _superAdminService.GetAllPlatformUsersAsync();
            return Ok(users);
        }

        /// <summary>
        /// Get a specific platform user by ID
        /// </summary>
        [HttpGet("users/{userId}")]
        public async Task<IActionResult> GetPlatformUser(int userId)
        {
            var user = await _superAdminService.GetPlatformUserAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }

        /// <summary>
        /// Create a new platform user
        /// </summary>
        [HttpPost("users")]
        public async Task<IActionResult> CreatePlatformUser([FromBody] CreatePlatformUserDto dto)
        {
            try
            {
                var user = await _superAdminService.CreatePlatformUserAsync(dto);
                if (user == null)
                    return BadRequest(new { success = false, message = "User email already exists or invalid company/role" });

                // Log the action (don't fail if logging fails)
                try
                {
                    var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                    await _auditLogService.LogActionAsync(
                        userId,
                        0,
                        "USER_CREATED",
                        "User",
                        user.Id.ToString(),
                        $"Created user {user.Email} for company {user.CompanyName}"
                    );
                }
                catch (Exception logEx)
                {
                    Console.WriteLine($"Audit logging failed: {logEx.Message}");
                }

                return Ok(new { 
                    success = true, 
                    message = "User created successfully",
                    data = user 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating user: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while creating the user" 
                });
            }
        }

        /// <summary>
        /// Update a platform user
        /// </summary>
        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdatePlatformUser(int userId, [FromBody] UpdatePlatformUserDto dto)
        {
            try
            {
                var user = await _superAdminService.UpdatePlatformUserAsync(userId, dto);
                if (user == null)
                    return NotFound(new { success = false, message = "User not found or email already exists" });

                // Log the action (don't fail if logging fails)
                try
                {
                    var adminUserId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                    await _auditLogService.LogActionAsync(
                        adminUserId,
                        0,
                        "USER_UPDATED",
                        "User",
                        userId.ToString(),
                        $"Updated user {user.Email}"
                    );
                }
                catch (Exception logEx)
                {
                    // Log the error but don't fail the request
                    Console.WriteLine($"Audit logging failed: {logEx.Message}");
                }

                return Ok(new { 
                    success = true, 
                    message = "User updated successfully",
                    data = user 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating user: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred while updating the user" 
                });
            }
        }

        /// <summary>
        /// Delete a platform user
        /// </summary>
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeletePlatformUser(int userId)
        {
            try
            {
                var success = await _superAdminService.DeletePlatformUserAsync(userId);
                if (!success)
                    return NotFound(new { success = false, message = "User not found" });

                // Log the action (don't fail if logging fails)
                try
                {
                    var adminUserId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                    await _auditLogService.LogActionAsync(
                        adminUserId,
                        0,
                        "USER_DELETED",
                        "User",
                        userId.ToString(),
                        $"Deleted user {userId}"
                    );
                }
                catch (Exception logEx)
                {
                    Console.WriteLine($"Audit logging failed: {logEx.Message}");
                }

                return Ok(new { success = true, message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting user: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while deleting the user" });
            }
        }

        /// <summary>
        /// Activate a platform user
        /// </summary>
        [HttpPost("users/{userId}/activate")]
        public async Task<IActionResult> ActivateUser(int userId)
        {
            try
            {
                var success = await _superAdminService.ActivateUserAsync(userId);
                if (!success)
                    return NotFound(new { success = false, message = "User not found" });

                // Log the action (don't fail if logging fails)
                try
                {
                    var adminUserId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                    await _auditLogService.LogActionAsync(
                        adminUserId,
                        0,
                        "USER_ACTIVATED",
                        "User",
                        userId.ToString(),
                        $"Activated user {userId}"
                    );
                }
                catch (Exception logEx)
                {
                    Console.WriteLine($"Audit logging failed: {logEx.Message}");
                }

                return Ok(new { success = true, message = "User activated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error activating user: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while activating the user" });
            }
        }

        /// <summary>
        /// Suspend a platform user
        /// </summary>
        [HttpPost("users/{userId}/suspend")]
        public async Task<IActionResult> SuspendUser(int userId)
        {
            try
            {
                var success = await _superAdminService.SuspendUserAsync(userId);
                if (!success)
                    return NotFound(new { success = false, message = "User not found" });

                // Log the action (don't fail if logging fails)
                try
                {
                    var adminUserId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                    await _auditLogService.LogActionAsync(
                        adminUserId,
                        0,
                        "USER_SUSPENDED",
                        "User",
                        userId.ToString(),
                        $"Suspended user {userId}"
                    );
                }
                catch (Exception logEx)
                {
                    Console.WriteLine($"Audit logging failed: {logEx.Message}");
                }

                return Ok(new { success = true, message = "User suspended successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error suspending user: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while suspending the user" });
            }
        }

        /// <summary>
        /// Reset a platform user's password
        /// </summary>
        [HttpPost("users/reset-password")]
        public async Task<IActionResult> ResetUserPassword([FromBody] ResetUserPasswordDto dto)
        {
            try
            {
                var success = await _superAdminService.ResetUserPasswordAsync(dto);
                if (!success)
                    return NotFound(new { success = false, message = "User not found" });

                // Log the action (don't fail if logging fails)
                try
                {
                    var adminUserId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                    await _auditLogService.LogActionAsync(
                        adminUserId,
                        0,
                        "PASSWORD_RESET",
                        "User",
                        dto.UserId.ToString(),
                        $"Reset password for user {dto.UserId}"
                    );
                }
                catch (Exception logEx)
                {
                    Console.WriteLine($"Audit logging failed: {logEx.Message}");
                }

                return Ok(new { success = true, message = "Password reset successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error resetting password: {ex.Message}");
                return StatusCode(500, new { success = false, message = "An error occurred while resetting the password" });
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // SUBSCRIPTION MANAGEMENT
        // ═══════════════════════════════════════════════════════════════════

        /// <summary>
        /// Get all subscriptions
        /// </summary>
        [HttpGet("subscriptions")]
        public async Task<IActionResult> GetAllSubscriptions()
        {
            var subscriptions = await _superAdminService.GetAllSubscriptionsAsync();
            return Ok(subscriptions);
        }

        /// <summary>
        /// Get subscription statistics
        /// </summary>
        [HttpGet("subscriptions/stats")]
        public async Task<IActionResult> GetSubscriptionStats()
        {
            var stats = await _superAdminService.GetSubscriptionStatsAsync();
            return Ok(stats);
        }

        /// <summary>
        /// Get a specific subscription
        /// </summary>
        [HttpGet("subscriptions/{companyId}")]
        public async Task<IActionResult> GetSubscription(int companyId)
        {
            var subscription = await _superAdminService.GetSubscriptionAsync(companyId);
            if (subscription == null)
                return NotFound(new { message = "Subscription not found" });

            return Ok(subscription);
        }

        /// <summary>
        /// Update a subscription
        /// </summary>
        [HttpPut("subscriptions/{companyId}")]
        public async Task<IActionResult> UpdateSubscription(int companyId, [FromBody] UpdateSubscriptionDto dto)
        {
            var subscription = await _superAdminService.UpdateSubscriptionAsync(companyId, dto);
            if (subscription == null)
                return NotFound(new { message = "Subscription not found or invalid plan" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "SUBSCRIPTION_UPDATED",
                "Subscription",
                companyId.ToString(),
                $"Updated subscription for company {companyId}"
            );

            return Ok(subscription);
        }

        /// <summary>
        /// Renew a subscription
        /// </summary>
        [HttpPost("subscriptions/renew")]
        public async Task<IActionResult> RenewSubscription([FromBody] RenewSubscriptionDto dto)
        {
            var success = await _superAdminService.RenewSubscriptionAsync(dto);
            if (!success)
                return NotFound(new { message = "Company not found" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "SUBSCRIPTION_RENEWED",
                "Subscription",
                dto.CompanyId.ToString(),
                $"Renewed subscription for company {dto.CompanyId} for {dto.Months} months"
            );

            return Ok(new { message = $"Subscription renewed for {dto.Months} months successfully" });
        }

        /// <summary>
        /// Change subscription plan
        /// </summary>
        [HttpPost("subscriptions/change-plan")]
        public async Task<IActionResult> ChangePlan([FromBody] ChangePlanDto dto)
        {
            var success = await _superAdminService.ChangePlanAsync(dto);
            if (!success)
                return NotFound(new { message = "Company or plan not found" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "PLAN_CHANGED",
                "Subscription",
                dto.CompanyId.ToString(),
                $"Changed plan for company {dto.CompanyId} to plan {dto.NewPlanId}"
            );

            return Ok(new { message = "Plan changed successfully" });
        }

        /// <summary>
        /// Activate a subscription
        /// </summary>
        [HttpPost("subscriptions/{companyId}/activate")]
        public async Task<IActionResult> ActivateSubscription(int companyId)
        {
            var success = await _superAdminService.ActivateSubscriptionAsync(companyId);
            if (!success)
                return NotFound(new { message = "Company not found" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "SUBSCRIPTION_ACTIVATED",
                "Subscription",
                companyId.ToString(),
                $"Activated subscription for company {companyId}"
            );

            return Ok(new { message = "Subscription activated successfully" });
        }

        /// <summary>
        /// Suspend a subscription
        /// </summary>
        [HttpPost("subscriptions/{companyId}/suspend")]
        public async Task<IActionResult> SuspendSubscription(int companyId)
        {
            var success = await _superAdminService.SuspendSubscriptionAsync(companyId);
            if (!success)
                return NotFound(new { message = "Company not found" });

            // Log the action
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            await _auditLogService.LogActionAsync(
                userId,
                0,
                "SUBSCRIPTION_SUSPENDED",
                "Subscription",
                companyId.ToString(),
                $"Suspended subscription for company {companyId}"
            );

            return Ok(new { message = "Subscription suspended successfully" });
        }

        // ═══════════════════════════════════════════════════════════════════
        // REPORTS & ANALYTICS
        // ═══════════════════════════════════════════════════════════════════

        /// <summary>
        /// Get platform overview statistics
        /// </summary>
        [HttpGet("reports/overview")]
        public async Task<IActionResult> GetPlatformOverview()
        {
            var overview = await _reportsService.GetPlatformOverviewAsync();
            return Ok(overview);
        }

        /// <summary>
        /// Get company growth data
        /// </summary>
        [HttpGet("reports/company-growth")]
        public async Task<IActionResult> GetCompanyGrowth([FromQuery] int months = 6)
        {
            var growth = await _reportsService.GetCompanyGrowthAsync(months);
            return Ok(growth);
        }

        /// <summary>
        /// Get user activity data
        /// </summary>
        [HttpGet("reports/user-activity")]
        public async Task<IActionResult> GetUserActivity([FromQuery] int days = 30)
        {
            var activity = await _reportsService.GetUserActivityAsync(days);
            return Ok(activity);
        }

        /// <summary>
        /// Get subscription distribution
        /// </summary>
        [HttpGet("reports/subscription-distribution")]
        public async Task<IActionResult> GetSubscriptionDistribution()
        {
            var distribution = await _reportsService.GetSubscriptionDistributionAsync();
            return Ok(distribution);
        }

        /// <summary>
        /// Get expenses by company
        /// </summary>
        [HttpGet("reports/expenses-by-company")]
        public async Task<IActionResult> GetExpensesByCompany([FromQuery] int topN = 10)
        {
            var expenses = await _reportsService.GetExpensesByCompanyAsync(topN);
            return Ok(expenses);
        }

        /// <summary>
        /// Get expenses by category
        /// </summary>
        [HttpGet("reports/expenses-by-category")]
        public async Task<IActionResult> GetExpensesByCategory()
        {
            var expenses = await _reportsService.GetExpensesByCategoryAsync();
            return Ok(expenses);
        }

        /// <summary>
        /// Get top companies
        /// </summary>
        [HttpGet("reports/top-companies")]
        public async Task<IActionResult> GetTopCompanies([FromQuery] int topN = 10)
        {
            var companies = await _reportsService.GetTopCompaniesAsync(topN);
            return Ok(companies);
        }

        /// <summary>
        /// Get most active users
        /// </summary>
        [HttpGet("reports/most-active-users")]
        public async Task<IActionResult> GetMostActiveUsers([FromQuery] int topN = 10)
        {
            var users = await _reportsService.GetMostActiveUsersAsync(topN);
            return Ok(users);
        }

        /// <summary>
        /// Get recent platform activities
        /// </summary>
        [HttpGet("reports/recent-activities")]
        public async Task<IActionResult> GetRecentActivities([FromQuery] int count = 20)
        {
            var activities = await _reportsService.GetRecentActivitiesAsync(count);
            return Ok(activities);
        }

        /// <summary>
        /// Get system health metrics
        /// </summary>
        [HttpGet("reports/system-health")]
        public async Task<IActionResult> GetSystemHealth()
        {
            var health = await _reportsService.GetSystemHealthAsync();
            return Ok(health);
        }
    }
}
