using LedgerFlow.API.Data;
using LedgerFlow.API.DTOs;
using LedgerFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace LedgerFlow.API.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;
        private readonly PlanEnforcementService _planEnforcement;

        public UserService(AppDbContext context, PlanEnforcementService planEnforcement)
        {
            _context = context;
            _planEnforcement = planEnforcement;
        }

        public async Task<List<AdminUserResponseDto>> GetAllUsersAsync(int companyId)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .Where(u => u.CompanyId == companyId) // CRITICAL: Filter by CompanyId
                .Select(u => new AdminUserResponseDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.Phone,
                    Position = u.Position,
                    RoleId = u.RoleId,
                    RoleName = u.Role != null ? u.Role.RoleName : string.Empty,
                    CompanyId = u.CompanyId,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department != null ? u.Department.Name : null,
                    IsActive = u.IsActive
                })
                .ToListAsync();
        }

        public async Task<AdminUserResponseDto?> GetUserByIdAsync(int id, int companyId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .Where(u => u.CompanyId == companyId) // CRITICAL: Filter by CompanyId
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return null;

            return new AdminUserResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.Phone,
                Position = user.Position,
                RoleId = user.RoleId,
                RoleName = user.Role != null ? user.Role.RoleName : string.Empty,
                CompanyId = user.CompanyId,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department != null ? user.Department.Name : null,
                IsActive = user.IsActive
            };
        }

        public async Task<AdminUserResponseDto> CreateUserAsync(CreateUserDto dto, int adminCompanyId)
        {
            // Validate role exists
            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                throw new KeyNotFoundException("Role not found");

            // ✅ CRITICAL: Prevent SuperAdmin creation by company admins
            if (role.RoleName == "SuperAdmin")
                throw new InvalidOperationException("SuperAdmin role cannot be assigned to company users");

            // Check if email already exists
            var existing = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (existing)
                throw new InvalidOperationException("A user with this email already exists");

            // CRITICAL: Always use admin's CompanyId, ignore dto.CompanyId
            var companyId = adminCompanyId;

            // Get company with plan
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                throw new KeyNotFoundException("Company not found");

            // ✅ Plan-based role validation
            if (company.Plan?.Name == "Starter")
            {
                // Starter plan: Only Admin and Employee allowed
                if (role.RoleName != "Admin" && role.RoleName != "Employee")
                    throw new InvalidOperationException($"Starter plan does not support {role.RoleName} role. Upgrade to Business plan.");
            }

            // ✅ Department validation for Business plan
            if (company.Plan?.Name == "Business")
            {
                // Employee, Finance, and Audit roles require department
                if (role.RoleName == "Employee" || role.RoleName == "Finance" || role.RoleName == "Audit")
                {
                    if (!dto.DepartmentId.HasValue)
                        throw new InvalidOperationException($"{role.RoleName} role requires a department assignment");

                    // Validate department exists and belongs to company
                    var department = await _context.Departments
                        .FirstOrDefaultAsync(d => d.Id == dto.DepartmentId.Value && d.CompanyId == companyId);

                    if (department == null)
                        throw new KeyNotFoundException("Department not found or does not belong to your company");
                }
            }

            // Check plan limits before creating user
            var (allowed, message) = await _planEnforcement.CanAddUserAsync(companyId);
            if (!allowed)
                throw new InvalidOperationException(message);

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.PhoneNumber,
                Position = dto.Position,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                RoleId = dto.RoleId,
                CompanyId = companyId, // CRITICAL: Use admin's CompanyId
                DepartmentId = dto.DepartmentId, // ✅ Set department
                IsVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // ✅ Create audit log
            var auditLog = new AuditLog
            {
                UserId = user.Id,
                CompanyId = companyId,
                Action = "CREATE",
                Entity = "User",
                EntityId = user.Id.ToString(),
                Details = $"Admin created user {user.FirstName} {user.LastName} (Position: {user.Position}, Role: {role.RoleName})",
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            // Load department name if assigned
            string? departmentName = null;
            if (user.DepartmentId.HasValue)
            {
                var dept = await _context.Departments.FindAsync(user.DepartmentId.Value);
                departmentName = dept?.Name;
            }

            return new AdminUserResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.Phone,
                Position = user.Position,
                RoleId = user.RoleId,
                RoleName = role.RoleName,
                CompanyId = user.CompanyId,
                DepartmentId = user.DepartmentId,
                DepartmentName = departmentName,
                IsActive = user.IsActive
            };
        }

        public async Task<AdminUserResponseDto> UpdateUserAsync(int id, UpdateUserDto dto, int companyId)
        {
            var user = await _context.Users
                .Include(u => u.Department)
                .Where(u => u.CompanyId == companyId) // CRITICAL: Filter by CompanyId
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null)
                throw new KeyNotFoundException("User not found");

            // Get company with plan for validation
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            if (company == null)
                throw new KeyNotFoundException("Company not found");

            Role? role = null;
            if (dto.RoleId.HasValue)
            {
                role = await _context.Roles.FindAsync(dto.RoleId.Value);
                if (role == null)
                    throw new KeyNotFoundException("Role not found");

                // ✅ Plan-based role validation
                if (company.Plan?.Name == "Starter")
                {
                    // Starter plan: Only Admin and Employee allowed
                    if (role.RoleName != "Admin" && role.RoleName != "Employee")
                        throw new InvalidOperationException($"Starter plan does not support {role.RoleName} role. Upgrade to Business plan.");
                }

                user.RoleId = dto.RoleId.Value;
            }
            else
            {
                // Load current role if not changing
                role = await _context.Roles.FindAsync(user.RoleId);
            }

            // ✅ Department validation for Business plan
            if (company.Plan?.Name == "Business" && role != null)
            {
                // Employee, Finance, and Audit roles require department
                if (role.RoleName == "Employee" || role.RoleName == "Finance" || role.RoleName == "Audit")
                {
                    // If department is being updated or role requires it
                    if (dto.DepartmentId.HasValue)
                    {
                        // Validate department exists and belongs to company
                        var department = await _context.Departments
                            .FirstOrDefaultAsync(d => d.Id == dto.DepartmentId.Value && d.CompanyId == companyId);

                        if (department == null)
                            throw new KeyNotFoundException("Department not found or does not belong to your company");

                        user.DepartmentId = dto.DepartmentId.Value;
                    }
                    else if (!user.DepartmentId.HasValue)
                    {
                        // Role requires department but none is set
                        throw new InvalidOperationException($"{role.RoleName} role requires a department assignment");
                    }
                }
                else if (role.RoleName == "Admin")
                {
                    // Admin doesn't need department, clear it if provided
                    if (dto.DepartmentId.HasValue)
                    {
                        user.DepartmentId = dto.DepartmentId.Value;
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                user.FirstName = dto.FirstName;

            if (!string.IsNullOrWhiteSpace(dto.LastName))
                user.LastName = dto.LastName;

            if (!string.IsNullOrWhiteSpace(dto.Email))
                user.Email = dto.Email;

            if (dto.PhoneNumber != null)
                user.Phone = dto.PhoneNumber;

            if (!string.IsNullOrWhiteSpace(dto.Position))
                user.Position = dto.Position;

            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // ✅ Create audit log
            var changes = new List<string>();
            if (!string.IsNullOrWhiteSpace(dto.FirstName) || !string.IsNullOrWhiteSpace(dto.LastName))
                changes.Add($"Name: {user.FirstName} {user.LastName}");
            if (!string.IsNullOrWhiteSpace(dto.Position))
                changes.Add($"Position: {user.Position}");
            if (dto.PhoneNumber != null)
                changes.Add($"Phone: {user.Phone}");
            if (dto.DepartmentId.HasValue)
            {
                var dept = await _context.Departments.FindAsync(dto.DepartmentId.Value);
                if (dept != null)
                    changes.Add($"Department: {dept.Name}");
            }
            if (dto.RoleId.HasValue)
            {
                var newRole = await _context.Roles.FindAsync(dto.RoleId.Value);
                if (newRole != null)
                    changes.Add($"Role: {newRole.RoleName}");
            }

            var auditLog = new AuditLog
            {
                UserId = user.Id,
                CompanyId = companyId,
                Action = "UPDATE",
                Entity = "User",
                EntityId = user.Id.ToString(),
                Details = $"Admin updated user {user.FirstName} {user.LastName}" + 
                         (changes.Any() ? $" - Changes: {string.Join(", ", changes)}" : ""),
                Timestamp = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            // Reload department name if assigned
            string? departmentName = null;
            if (user.DepartmentId.HasValue)
            {
                var dept = await _context.Departments.FindAsync(user.DepartmentId.Value);
                departmentName = dept?.Name;
            }

            var updatedRole = await _context.Roles.FindAsync(user.RoleId);

            return new AdminUserResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.Phone,
                Position = user.Position,
                RoleId = user.RoleId,
                RoleName = updatedRole?.RoleName ?? string.Empty,
                CompanyId = user.CompanyId,
                DepartmentId = user.DepartmentId,
                DepartmentName = departmentName,
                IsActive = user.IsActive
            };
        }

        public async Task DeactivateUserAsync(int id, int companyId)
        {
            var user = await _context.Users
                .Where(u => u.CompanyId == companyId) // CRITICAL: Filter by CompanyId
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null)
                throw new KeyNotFoundException("User not found");

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task ActivateUserAsync(int id, int companyId)
        {
            var user = await _context.Users
                .Where(u => u.CompanyId == companyId) // CRITICAL: Filter by CompanyId
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null)
                throw new KeyNotFoundException("User not found");

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<List<RoleDto>> GetRolesAsync()
        {
            // ✅ CRITICAL: Exclude SuperAdmin from company user creation
            return await _context.Roles
                .Where(r => r.RoleName != "SuperAdmin")
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    RoleName = r.RoleName
                })
                .ToListAsync();
        }

        /// <summary>
        /// Get roles filtered by company's plan
        /// </summary>
        public async Task<List<RoleDto>> GetRolesForCompanyAsync(int companyId)
        {
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            var roles = await _context.Roles
                .Where(r => r.RoleName != "SuperAdmin") // ✅ Always exclude SuperAdmin
                .ToListAsync();

            // ✅ Filter by plan
            if (company?.Plan?.Name == "Starter")
            {
                // Starter plan: Only Admin and Employee
                roles = roles.Where(r => r.RoleName == "Admin" || r.RoleName == "Employee").ToList();
            }
            // Business plan: All roles except SuperAdmin (already filtered above)

            return roles.Select(r => new RoleDto
            {
                Id = r.Id,
                RoleName = r.RoleName
            }).ToList();
        }

        /// <summary>
        /// Get plan features for a company
        /// </summary>
        public async Task<PlanFeaturesDto?> GetPlanFeaturesAsync(int companyId)
        {
            Console.WriteLine($"[DEBUG] GetPlanFeaturesAsync called for companyId: {companyId}");
            
            var company = await _context.Companies
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == companyId);

            Console.WriteLine($"[DEBUG] Company found: {company != null}");
            if (company != null)
            {
                Console.WriteLine($"[DEBUG] Company.Id: {company.Id}, Company.Name: {company.Name}, Company.PlanId: {company.PlanId}");
                Console.WriteLine($"[DEBUG] Company.Plan loaded: {company.Plan != null}");
                if (company.Plan != null)
                {
                    Console.WriteLine($"[DEBUG] Plan.Id: {company.Plan.Id}, Plan.Name: {company.Plan.Name}");
                }
                else
                {
                    Console.WriteLine($"[DEBUG] Plan is NULL - checking if Plan exists in database...");
                    var planExists = await _context.Plans.AnyAsync(p => p.Id == company.PlanId);
                    Console.WriteLine($"[DEBUG] Plan with Id {company.PlanId} exists in database: {planExists}");
                }
            }

            if (company?.Plan == null)
            {
                Console.WriteLine($"[DEBUG] Returning null - company or plan not found");
                return null;
            }

            var result = new PlanFeaturesDto
            {
                PlanName = company.Plan.Name,
                MaxUsers = company.Plan.MaxUsers,
                MaxExpensesPerMonth = company.Plan.MaxExpensesPerMonth,
                CanUploadReceipt = company.Plan.CanUploadReceipt,
                HasAdvancedReports = company.Plan.HasAdvancedReports,
                HasAdvancedAnalytics = company.Plan.HasAdvancedAnalytics,
                HasDepartmentAnalytics = company.Plan.HasDepartmentAnalytics,
                HasRoleBasedWorkflows = company.Plan.HasRoleBasedWorkflows,
                HasPrioritySupport = company.Plan.HasPrioritySupport
            };
            
            Console.WriteLine($"[DEBUG] Returning plan features: {result.PlanName}");
            return result;
        }
    }
}
