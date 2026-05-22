using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using LedgerFlow.API.Services;
using LedgerFlow.API.DTOs;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DepartmentController : ControllerBase
    {
        private readonly DepartmentService _departmentService;
        private readonly ILogger<DepartmentController> _logger;

        public DepartmentController(DepartmentService departmentService, ILogger<DepartmentController> logger)
        {
            _departmentService = departmentService;
            _logger = logger;
        }

        /// <summary>
        /// Get all departments for the admin's company
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllDepartments()
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                var departments = await _departmentService.GetAllDepartmentsAsync(companyId);
                return Ok(departments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching departments");
                return StatusCode(500, new { message = "Failed to fetch departments" });
            }
        }

        /// <summary>
        /// Get a specific department by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartmentById(int id)
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                var department = await _departmentService.GetDepartmentByIdAsync(id, companyId);

                if (department == null)
                    return NotFound(new { message = "Department not found" });

                return Ok(department);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching department {DepartmentId}", id);
                return StatusCode(500, new { message = "Failed to fetch department" });
            }
        }

        /// <summary>
        /// Create a new department
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDto dto)
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
                var department = await _departmentService.CreateDepartmentAsync(dto, companyId);

                return CreatedAtAction(nameof(GetDepartmentById), new { id = department.Id }, department);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating department");
                return StatusCode(500, new { message = "Failed to create department" });
            }
        }

        /// <summary>
        /// Update an existing department
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, [FromBody] UpdateDepartmentDto dto)
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
                var department = await _departmentService.UpdateDepartmentAsync(id, dto, companyId);

                return Ok(department);
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
                _logger.LogError(ex, "Error updating department {DepartmentId}", id);
                return StatusCode(500, new { message = "Failed to update department" });
            }
        }

        /// <summary>
        /// Delete a department (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            try
            {
                var companyId = int.Parse(User.FindFirst("CompanyId")!.Value);
                await _departmentService.DeleteDepartmentAsync(id, companyId);
                return Ok(new { message = "Department deleted successfully" });
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
                _logger.LogError(ex, "Error deleting department {DepartmentId}", id);
                return StatusCode(500, new { message = "Failed to delete department" });
            }
        }
    }
}
