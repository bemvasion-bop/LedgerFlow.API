using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Services;
using LedgerFlow.API.DTOs;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly ILogger<AdminUsersController> _logger;

        public AdminUsersController(UserService userService, ILogger<AdminUsersController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        /// <summary>
        /// Get all users for the admin's company
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                var users = await _userService.GetAllUsersAsync(companyId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users");
                return StatusCode(500, new { message = "Failed to fetch users" });
            }
        }

        /// <summary>
        /// Get a specific user by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                var user = await _userService.GetUserByIdAsync(id, companyId);

                if (user == null)
                    return NotFound(new { message = "User not found" });

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user {UserId}", id);
                return StatusCode(500, new { message = "Failed to fetch user" });
            }
        }

        /// <summary>
        /// Create a new user in the admin's company
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    
                    _logger.LogWarning("User creation validation failed: {Errors}", string.Join(", ", errors));
                    return BadRequest(new { message = "Validation failed", errors });
                }

                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                
                _logger.LogInformation("Creating user {Email} for company {CompanyId} with role {RoleId} and department {DepartmentId}", 
                    dto.Email, companyId, dto.RoleId, dto.DepartmentId);

                var user = await _userService.CreateUserAsync(dto, companyId);

                _logger.LogInformation("User {UserId} created successfully", user.Id);
                return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning("User creation failed - not found: {Message}", ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning("User creation failed - invalid operation: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating user for company {CompanyId}", 
                    User.FindFirst("CompanyId")?.Value);
                return StatusCode(500, new { message = "Failed to create user", error = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing user
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return BadRequest(new { message = "Validation failed", errors });
                }

                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                var user = await _userService.UpdateUserAsync(id, dto, companyId);

                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, new { message = "Failed to update user" });
            }
        }

        /// <summary>
        /// Deactivate a user
        /// </summary>
        [HttpPatch("{id}/deactivate")]
        public async Task<IActionResult> DeactivateUser(int id)
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                await _userService.DeactivateUserAsync(id, companyId);
                return Ok(new { message = "User deactivated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating user {UserId}", id);
                return StatusCode(500, new { message = "Failed to deactivate user" });
            }
        }

        /// <summary>
        /// Activate a user
        /// </summary>
        [HttpPatch("{id}/activate")]
        public async Task<IActionResult> ActivateUser(int id)
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                await _userService.ActivateUserAsync(id, companyId);
                return Ok(new { message = "User activated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating user {UserId}", id);
                return StatusCode(500, new { message = "Failed to activate user" });
            }
        }

        /// <summary>
        /// Get available roles for the admin's company (filtered by plan)
        /// </summary>
        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                var roles = await _userService.GetRolesForCompanyAsync(companyId);
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching roles");
                return StatusCode(500, new { message = "Failed to fetch roles" });
            }
        }

        /// <summary>
        /// Get plan features for the admin's company
        /// </summary>
        [HttpGet("plan-features")]
        public async Task<IActionResult> GetPlanFeatures()
        {
            try
            {
                var companyIdClaim = User.FindFirst("CompanyId");
                _logger.LogInformation("GetPlanFeatures called. CompanyId claim: {CompanyIdClaim}", companyIdClaim?.Value);
                
                if (companyIdClaim == null)
                {
                    _logger.LogError("CompanyId claim not found in token");
                    return Unauthorized(new { message = "CompanyId not found in token" });
                }
                
                var companyId = int.Parse(companyIdClaim.Value);
                _logger.LogInformation("Fetching plan features for company {CompanyId}", companyId);
                
                var planFeatures = await _userService.GetPlanFeaturesAsync(companyId);
                
                if (planFeatures == null)
                {
                    _logger.LogWarning("Plan features not found for company {CompanyId}", companyId);
                    return NotFound(new { message = "Plan features not found" });
                }

                _logger.LogInformation("Successfully retrieved plan features for company {CompanyId}: {PlanName}", companyId, planFeatures.PlanName);
                return Ok(planFeatures);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching plan features for company {CompanyId}", 
                    User.FindFirst("CompanyId")?.Value);
                return StatusCode(500, new { message = "Failed to fetch plan features", error = ex.Message });
            }
        }
    }
}
