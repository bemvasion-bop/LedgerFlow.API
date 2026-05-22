using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using LedgerFlow.API.Services;
using LedgerFlow.API.DTOs;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Text;
using Microsoft.Extensions.Logging;

namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly AuditLogService _auditLogService;
        private readonly OtpService _otpService;
        private readonly EmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            AppDbContext context, 
            IConfiguration config, 
            AuditLogService auditLogService,
            OtpService otpService,
            EmailService emailService,
            ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _auditLogService = auditLogService;
            _otpService = otpService;
            _emailService = emailService;
            _logger = logger;
        }


        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            try
            {
                // Find user by email
                var user = _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Company)
                        .ThenInclude(c => c.Plan)
                    .FirstOrDefault(u => u.Email == request.Email);

                // Check if user exists
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found. Please check your email address." });
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Incorrect password. Please try again." });
                }

                // Check if user is verified
                if (!user.IsVerified)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Account not verified. Please check your email for verification code." });
                }

                // Check if user is active
                if (!user.IsActive)
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new { message = "Account is inactive. Please contact your administrator." });
                }

                // Check if user has a role
                if (user.Role == null)
                {
                    return BadRequest(new { message = "User has no role assigned. Please contact support." });
                }

                // Check company status (skip for SuperAdmin)
                if (user.Role.RoleName != "SuperAdmin")
                {
                    if (user.Company == null)
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Company not found. Please contact support." });
                    }

                    if (user.Company.Status != "Active")
                    {
                        return StatusCode(StatusCodes.Status403Forbidden, new { message = "Company account is suspended. Please contact support." });
                    }
                }

                // Generate JWT token with appropriate expiration
                var token = GenerateJwt(user, request.RememberMe);

                // Log successful login with role information
                Console.WriteLine($"=== LOGIN SUCCESS ===");
                Console.WriteLine($"User: {user.Email}");
                Console.WriteLine($"Role: {user.Role.RoleName}");
                Console.WriteLine($"CompanyId: {user.CompanyId}");
                Console.WriteLine($"Token generated successfully");
                Console.WriteLine($"====================");

                await _auditLogService.LogActionAsync(user.Id, user.CompanyId, "LOGIN", "Auth", user.Id.ToString());

                return Ok(new
                {
                    token,
                    expiresIn = request.RememberMe ? 30 * 24 * 60 * 60 : 2 * 60 * 60, // 30 days or 2 hours in seconds
                    rememberMe = request.RememberMe,
                    user = new
                    {
                        id = user.Id,
                        email = user.Email,
                        role = user.Role.RoleName,
                        companyId = user.CompanyId,
                        companyName = user.Company?.Name,
                        planName = user.Company?.Plan?.Name,
                        firstName = user.FirstName,
                        lastName = user.LastName
                    }
                });
            }
            catch (Exception ex)
            {
                // Log the error for debugging
                Console.WriteLine($"Login error: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred during login. Please try again." });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            var companyIdClaim = User.FindFirst("CompanyId");

            if (userIdClaim != null && companyIdClaim != null)
            {
                var userId = int.Parse(userIdClaim.Value);
                var companyId = int.Parse(companyIdClaim.Value);

                // Log logout
                await _auditLogService.LogActionAsync(userId, companyId, "LOGOUT", "Auth", userId.ToString());
            }

            return Ok(new { message = "Logged out successfully" });
        }

        /// <summary>
        /// Register a new company and send OTP verification email
        /// </summary>
        [HttpPost("register-company")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterCompany([FromBody] PublicCompanyRegistrationDto request)
        {
            try
            {
                // Validate company email doesn't exist
                var existingCompany = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Email.ToLower() == request.CompanyEmail.ToLower());

                if (existingCompany != null)
                {
                    return BadRequest(new RegistrationResponseDto
                    {
                        Success = false,
                        Message = "A company with this email already exists."
                    });
                }

                // Validate admin email doesn't exist
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.AdminEmail.ToLower());

                if (existingUser != null)
                {
                    return BadRequest(new RegistrationResponseDto
                    {
                        Success = false,
                        Message = "A user with this email already exists."
                    });
                }

                // Validate plan exists
                var plan = await _context.Plans.FindAsync(request.PlanId);
                
                // Debug logging
                _logger.LogInformation($"Registration attempt - PlanId: {request.PlanId}, BillingCycle: {request.BillingCycle}");
                _logger.LogInformation($"Plan found: {(plan != null ? $"Yes - {plan.Name}" : "No")}");
                
                if (plan == null)
                {
                    // Log all available plans for debugging
                    var availablePlans = await _context.Plans.ToListAsync();
                    _logger.LogWarning($"Available plans in database: {string.Join(", ", availablePlans.Select(p => $"ID:{p.Id} Name:{p.Name}"))}");
                    
                    return BadRequest(new RegistrationResponseDto
                    {
                        Success = false,
                        Message = "Invalid plan selected."
                    });
                }

                // Generate OTP
                var otpCode = _otpService.GenerateOtp();

                // Store OTP with registration data
                var otpData = new OtpService.OtpData
                {
                    Email = request.AdminEmail,
                    CompanyName = request.CompanyName,
                    CompanyEmail = request.CompanyEmail,
                    CompanyPhone = request.CompanyPhone,
                    CompanyAddress = request.CompanyAddress,
                    AdminFirstName = request.AdminFirstName,
                    AdminLastName = request.AdminLastName,
                    AdminPassword = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword),
                    PlanId = request.PlanId,
                    BillingCycle = request.BillingCycle
                };

                _otpService.StoreOtp(request.AdminEmail, otpCode, otpData);

                // Send OTP email
                var emailSent = await _emailService.SendOtpEmailAsync(
                    request.AdminEmail,
                    otpCode,
                    request.CompanyName
                );

                if (!emailSent)
                {
                    return StatusCode(500, new RegistrationResponseDto
                    {
                        Success = false,
                        Message = "Failed to send verification email. Please try again."
                    });
                }

                return Ok(new RegistrationResponseDto
                {
                    Success = true,
                    Message = "Registration initiated. Please check your email for the verification code.",
                    Email = request.AdminEmail,
                    OtpExpiresAt = DateTime.UtcNow.AddMinutes(5)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RegistrationResponseDto
                {
                    Success = false,
                    Message = $"An error occurred during registration: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Verify OTP and complete company registration
        /// </summary>
        [HttpPost("verify-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto request)
        {
            try
            {
                // Verify OTP
                var (isValid, otpData, message) = _otpService.VerifyOtp(request.Email, request.OtpCode);

                if (!isValid || otpData == null)
                {
                    return BadRequest(new VerificationResponseDto
                    {
                        Success = false,
                        Message = message
                    });
                }

                // Double-check company and user don't exist
                var existingCompany = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Email.ToLower() == otpData.CompanyEmail.ToLower());

                if (existingCompany != null)
                {
                    return BadRequest(new VerificationResponseDto
                    {
                        Success = false,
                        Message = "Company already exists."
                    });
                }

                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == otpData.Email.ToLower());

                if (existingUser != null)
                {
                    return BadRequest(new VerificationResponseDto
                    {
                        Success = false,
                        Message = "User already exists."
                    });
                }

                // Get plan
                var plan = await _context.Plans.FindAsync(otpData.PlanId);
                if (plan == null)
                {
                    return BadRequest(new VerificationResponseDto
                    {
                        Success = false,
                        Message = "Invalid plan."
                    });
                }

                // Create company
                var company = new Company
                {
                    Name = otpData.CompanyName,
                    Email = otpData.CompanyEmail,
                    Phone = otpData.CompanyPhone,
                    Address = otpData.CompanyAddress,
                    PlanId = otpData.PlanId,
                    BillingCycle = otpData.BillingCycle,
                    SubscriptionStatus = "Trial",
                    TrialEndsAt = DateTime.UtcNow.AddDays(plan.TrialDays),
                    SubscriptionStartedAt = DateTime.UtcNow,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Companies.Add(company);
                await _context.SaveChangesAsync();

                // Get Admin role
                var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
                if (adminRole == null)
                {
                    return StatusCode(500, new VerificationResponseDto
                    {
                        Success = false,
                        Message = "Admin role not found in database."
                    });
                }

                // Create admin user
                var adminUser = new User
                {
                    FirstName = otpData.AdminFirstName,
                    LastName = otpData.AdminLastName,
                    Email = otpData.Email,
                    PasswordHash = otpData.AdminPassword, // Already hashed
                    RoleId = adminRole.Id,
                    CompanyId = company.Id,
                    IsVerified = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                // ✅ Seed default departments for Business plan companies
                if (plan.Name == "Business")
                {
                    var defaultDepartments = new[]
                    {
                        new Department { Name = "Finance",     Description = "Financial operations and accounting", CompanyId = company.Id, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                        new Department { Name = "HR",          Description = "Human resources and recruitment",     CompanyId = company.Id, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                        new Department { Name = "IT",          Description = "Information technology and systems",  CompanyId = company.Id, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                        new Department { Name = "Operations",  Description = "Day-to-day business operations",      CompanyId = company.Id, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
                    };

                    _context.Departments.AddRange(defaultDepartments);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"Seeded {defaultDepartments.Length} default departments for Business plan company: {company.Name}");
                }

                // Reload user with relations
                adminUser = await _context.Users
                    .Include(u => u.Role)
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Id == adminUser.Id);

                if (adminUser == null)
                {
                    return StatusCode(500, new VerificationResponseDto
                    {
                        Success = false,
                        Message = "Failed to create user."
                    });
                }

                // Generate JWT token
                var token = GenerateJwt(adminUser);

                // Log registration
                await _auditLogService.LogActionAsync(
                    adminUser.Id,
                    company.Id,
                    "REGISTER",
                    "Auth",
                    $"Company '{company.Name}' registered with trial plan"
                );

                // Send welcome email
                await _emailService.SendWelcomeEmailAsync(
                    adminUser.Email,
                    company.Name,
                    $"{adminUser.FirstName} {adminUser.LastName}"
                );

                return Ok(new VerificationResponseDto
                {
                    Success = true,
                    Message = "Registration completed successfully!",
                    Token = token,
                    User = new UserInfoDto
                    {
                        Id = adminUser.Id,
                        Email = adminUser.Email,
                        FirstName = adminUser.FirstName,
                        LastName = adminUser.LastName,
                        Role = adminUser.Role.RoleName,
                        CompanyId = adminUser.CompanyId,
                        CompanyName = company.Name
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new VerificationResponseDto
                {
                    Success = false,
                    Message = $"An error occurred during verification: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Resend OTP verification code
        /// </summary>
        [HttpPost("resend-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto request)
        {
            try
            {
                // Check if OTP exists for this email
                if (!_otpService.HasOtp(request.Email))
                {
                    return BadRequest(new RegistrationResponseDto
                    {
                        Success = false,
                        Message = "No pending registration found for this email. Please start registration again."
                    });
                }

                // Generate new OTP
                var otpCode = _otpService.GenerateOtp();

                // Get existing OTP data
                var (_, existingData, _) = _otpService.VerifyOtp(request.Email, "000000"); // Dummy code to get data
                
                if (existingData == null)
                {
                    return BadRequest(new RegistrationResponseDto
                    {
                        Success = false,
                        Message = "Registration data not found. Please start registration again."
                    });
                }

                // Store new OTP with existing data
                _otpService.StoreOtp(request.Email, otpCode, existingData);

                // Send new OTP email
                var emailSent = await _emailService.SendOtpEmailAsync(
                    request.Email,
                    otpCode,
                    existingData.CompanyName
                );

                if (!emailSent)
                {
                    return StatusCode(500, new RegistrationResponseDto
                    {
                        Success = false,
                        Message = "Failed to send verification email. Please try again."
                    });
                }

                return Ok(new RegistrationResponseDto
                {
                    Success = true,
                    Message = "Verification code resent successfully. Please check your email.",
                    Email = request.Email,
                    OtpExpiresAt = DateTime.UtcNow.AddMinutes(5)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RegistrationResponseDto
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}"
                });
            }
        }


        private string GenerateJwt(User user, bool rememberMe = false)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.RoleName ?? "User"),
                new Claim("CompanyId", user.CompanyId.ToString())
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["Jwt:Key"])
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Set expiration based on Remember Me
            var expiration = rememberMe 
                ? DateTime.Now.AddDays(30)  // 30 days for Remember Me
                : DateTime.Now.AddHours(2);  // 2 hours for normal session

            var token = new JwtSecurityToken(
                claims: claims,
                expires: expiration,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Request password reset - sends reset email
        /// </summary>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request)
        {
            try
            {
                Console.WriteLine($"\n🔐 FORGOT PASSWORD REQUEST");
                Console.WriteLine($"Email: {request.Email}");
                
                // Find user by email
                var user = await _context.Users
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

                // SECURITY: Always return success to prevent email enumeration
                // Never reveal whether the email exists or not
                if (user == null)
                {
                    Console.WriteLine($"❌ User not found for email: {request.Email}");
                    return Ok(new ForgotPasswordResponseDto
                    {
                        Success = true,
                        Message = "If an account exists with that email, password reset instructions have been sent."
                    });
                }

                Console.WriteLine($"✅ User found: {user.FirstName} {user.LastName} (ID: {user.Id})");

                // Generate secure reset token
                var resetToken = Guid.NewGuid().ToString("N"); // 32 characters, no hyphens
                Console.WriteLine($"🔑 Generated token: {resetToken}");

                // Store token and expiration (30 minutes)
                user.PasswordResetToken = resetToken;
                user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                Console.WriteLine($"💾 Token saved to database");

                // Send reset email
                var resetLink = $"{_config["AppSettings:FrontendUrl"]}/reset-password?token={resetToken}";
                Console.WriteLine($"🔗 Reset link: {resetLink}");
                
                var emailSent = await _emailService.SendPasswordResetEmailAsync(
                    user.Email,
                    $"{user.FirstName} {user.LastName}",
                    resetLink,
                    user.Company?.Name ?? "SpendSync"
                );

                if (emailSent)
                {
                    Console.WriteLine($"✅ Email sent successfully to {user.Email}");
                }
                else
                {
                    Console.WriteLine($"⚠️ Failed to send email to {user.Email}");
                    Console.WriteLine($"📋 Use this link for testing: {resetLink}");
                }

                // Log password reset request
                await _auditLogService.LogActionAsync(
                    user.Id,
                    user.CompanyId,
                    "PASSWORD_RESET_REQUESTED",
                    "Auth",
                    user.Id.ToString(),
                    "Password reset requested"
                );

                Console.WriteLine($"✅ Password reset request completed\n");

                return Ok(new ForgotPasswordResponseDto
                {
                    Success = true,
                    Message = "If an account exists with that email, password reset instructions have been sent."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"\n❌ FORGOT PASSWORD ERROR:");
                Console.WriteLine($"Message: {ex.Message}");
                Console.WriteLine($"Stack Trace: {ex.StackTrace}\n");
                
                return Ok(new ForgotPasswordResponseDto
                {
                    Success = true,
                    Message = "If an account exists with that email, password reset instructions have been sent."
                });
            }
        }

        /// <summary>
        /// Reset password using token
        /// </summary>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(new ForgotPasswordResponseDto
                    {
                        Success = false,
                        Message = "Invalid request. Token and password are required."
                    });
                }

                // Validate password strength
                if (request.NewPassword.Length < 8)
                {
                    return BadRequest(new ForgotPasswordResponseDto
                    {
                        Success = false,
                        Message = "Password must be at least 8 characters long."
                    });
                }

                // Find user by reset token
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token);

                if (user == null)
                {
                    return BadRequest(new ForgotPasswordResponseDto
                    {
                        Success = false,
                        Message = "Invalid or expired reset token."
                    });
                }

                // Check if token is expired
                if (user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
                {
                    return BadRequest(new ForgotPasswordResponseDto
                    {
                        Success = false,
                        Message = "Reset token has expired. Please request a new password reset."
                    });
                }

                // Hash new password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                
                // Clear reset token
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpiry = null;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Log password reset
                await _auditLogService.LogActionAsync(
                    user.Id,
                    user.CompanyId,
                    "PASSWORD_RESET_COMPLETED",
                    "Auth",
                    user.Id.ToString(),
                    "Password reset completed successfully"
                );

                return Ok(new ForgotPasswordResponseDto
                {
                    Success = true,
                    Message = "Password reset successfully. You can now login with your new password."
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Reset password error: {ex.Message}");
                return StatusCode(500, new ForgotPasswordResponseDto
                {
                    Success = false,
                    Message = "An error occurred while resetting your password. Please try again."
                });
            }
        }
    }
}