using LedgerFlow.API.Data;
using LedgerFlow.API.DTOs;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class DepartmentService
    {
        private readonly AppDbContext _context;

        public DepartmentService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get all departments for a company
        /// </summary>
        public async Task<List<DepartmentResponseDto>> GetAllDepartmentsAsync(int companyId)
        {
            var departments = await _context.Departments
                .Where(d => d.CompanyId == companyId)
                .ToListAsync();

            var result = new List<DepartmentResponseDto>();

            foreach (var dept in departments)
            {
                var employeeCount = await _context.Users
                    .CountAsync(u => u.DepartmentId == dept.Id && u.IsActive);

                result.Add(new DepartmentResponseDto
                {
                    Id = dept.Id,
                    Name = dept.Name,
                    Description = dept.Description,
                    CompanyId = dept.CompanyId,
                    IsActive = dept.IsActive,
                    EmployeeCount = employeeCount,
                    CreatedAt = dept.CreatedAt,
                    UpdatedAt = dept.UpdatedAt
                });
            }

            return result;
        }

        /// <summary>
        /// Get a single department by ID
        /// </summary>
        public async Task<DepartmentResponseDto?> GetDepartmentByIdAsync(int id, int companyId)
        {
            var dept = await _context.Departments
                .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId);

            if (dept == null)
                return null;

            var employeeCount = await _context.Users
                .CountAsync(u => u.DepartmentId == dept.Id && u.IsActive);

            return new DepartmentResponseDto
            {
                Id = dept.Id,
                Name = dept.Name,
                Description = dept.Description,
                CompanyId = dept.CompanyId,
                IsActive = dept.IsActive,
                EmployeeCount = employeeCount,
                CreatedAt = dept.CreatedAt,
                UpdatedAt = dept.UpdatedAt
            };
        }

        /// <summary>
        /// Create a new department
        /// </summary>
        public async Task<DepartmentResponseDto> CreateDepartmentAsync(CreateDepartmentDto dto, int companyId)
        {
            // Check if department name already exists for this company
            var exists = await _context.Departments
                .AnyAsync(d => d.CompanyId == companyId && d.Name.ToLower() == dto.Name.ToLower());

            if (exists)
                throw new InvalidOperationException($"A department named '{dto.Name}' already exists in your company.");

            var department = new Department
            {
                Name = dto.Name,
                Description = dto.Description,
                CompanyId = companyId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return new DepartmentResponseDto
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description,
                CompanyId = department.CompanyId,
                IsActive = department.IsActive,
                EmployeeCount = 0,
                CreatedAt = department.CreatedAt,
                UpdatedAt = department.UpdatedAt
            };
        }

        /// <summary>
        /// Update an existing department
        /// </summary>
        public async Task<DepartmentResponseDto> UpdateDepartmentAsync(int id, UpdateDepartmentDto dto, int companyId)
        {
            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId);

            if (department == null)
                throw new KeyNotFoundException("Department not found");

            // Check for duplicate name if name is being changed
            if (!string.IsNullOrWhiteSpace(dto.Name) && dto.Name.ToLower() != department.Name.ToLower())
            {
                var exists = await _context.Departments
                    .AnyAsync(d => d.CompanyId == companyId && d.Name.ToLower() == dto.Name.ToLower() && d.Id != id);

                if (exists)
                    throw new InvalidOperationException($"A department named '{dto.Name}' already exists in your company.");

                department.Name = dto.Name;
            }

            if (dto.Description != null)
                department.Description = dto.Description;

            if (dto.IsActive.HasValue)
                department.IsActive = dto.IsActive.Value;

            department.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var employeeCount = await _context.Users
                .CountAsync(u => u.DepartmentId == department.Id && u.IsActive);

            return new DepartmentResponseDto
            {
                Id = department.Id,
                Name = department.Name,
                Description = department.Description,
                CompanyId = department.CompanyId,
                IsActive = department.IsActive,
                EmployeeCount = employeeCount,
                CreatedAt = department.CreatedAt,
                UpdatedAt = department.UpdatedAt
            };
        }

        /// <summary>
        /// Delete a department (soft delete by deactivating)
        /// </summary>
        public async Task DeleteDepartmentAsync(int id, int companyId)
        {
            var department = await _context.Departments
                .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId);

            if (department == null)
                throw new KeyNotFoundException("Department not found");

            // Check if any users are assigned to this department
            var hasUsers = await _context.Users
                .AnyAsync(u => u.DepartmentId == id && u.IsActive);

            if (hasUsers)
                throw new InvalidOperationException("Cannot delete department with active users. Please reassign users first.");

            // Soft delete by deactivating
            department.IsActive = false;
            department.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
