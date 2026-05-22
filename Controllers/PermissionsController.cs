using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Services;
using System.Security.Claims;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PermissionsController : ControllerBase
    {
        private readonly PermissionService _permissionService;

        public PermissionsController(PermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                throw new UnauthorizedAccessException("User context not found");

            return int.Parse(userIdClaim.Value);
        }

        /// <summary>
        /// Get current user's permissions based on role and company plan
        /// </summary>
        [HttpGet("my-permissions")]
        public async Task<IActionResult> GetMyPermissions()
        {
            try
            {
                var userId = GetUserId();
                var planName = await _permissionService.GetUserPlanAsync(userId);
                
                var permissions = new
                {
                    planName = planName,
                    canApproveExpenses = await _permissionService.CanApproveExpensesAsync(userId),
                    canRejectExpenses = await _permissionService.CanRejectExpensesAsync(userId),
                    canProcessReimbursements = await _permissionService.CanProcessReimbursementsAsync(userId),
                    isStarterPlan = await _permissionService.IsStarterPlanAsync(userId),
                    isBusinessPlan = await _permissionService.IsBusinessPlanAsync(userId)
                };

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
