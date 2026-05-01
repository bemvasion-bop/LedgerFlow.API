using Microsoft.AspNetCore.Mvc;
using LedgerFlow.API.Data;
using LedgerFlow.API.Models;
using LedgerFlow.API.DTOs;
using BCrypt;
using LedgerFlow.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Org.BouncyCastle.Ocsp;


namespace LedgerFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;

        public UserController(AppDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // ✅ GET ALL USERS
        // GET: api/user
        [Authorize]
        [HttpGet]
        public IActionResult GetUsers()
        {
            var users = _context.Users.ToList();

            var result = users.Select(u => new UserResponseDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                RoleId = u.RoleId
            });

            return Ok(result);
        }

        //[Authorize(Policy = "AdminOnly")]
        //[HttpGet("admin-only")]
        //public IActionResult AdminOnly()
        //{
        //    return Ok("You are ADMIN 🔥");
        //}


        [Authorize(Roles = "Admin")]
        [HttpGet("admin-only")]
        public IActionResult AdminOnly()
        {
            return Ok("Only admin can access this");

        }

        [Authorize(Roles = "Employee")]
        [HttpPost("create-expense")]
        public IActionResult CreateExpense(Expense expense)
        {
            
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

            expense.UserId = userId;

            _context.Expenses.Add(expense);
            _context.SaveChanges();

            return Ok(expense);
        }

        [Authorize(Roles = "Employee")]
        [HttpGet("my-expenses")]
        public IActionResult GetExpense()
        {   
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var expenses = _context.Expenses
                    .Where(e=> e.UserId == userId)
                    .ToList();

            return Ok(expenses);
        }

        

        [Authorize(Roles = "Audit")]
        [HttpGet("reports")]
        public IActionResult GetReports()
        {
            var reports = _context.Expenses.ToList();

            return Ok(reports);
        }




        // ✅ GET USER BY ID
        // GET: api/user/1
        [Authorize]
        [HttpGet("{id}")]
        public IActionResult GetUserById(int id)
        {   
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Admin")
            {
                var user = _context.Users
                        .Include(u=>u.Role)
                        .FirstOrDefault(u=>u.Id == id);

                return Ok(user);
            }

            if (userId != id.ToString())
            {
                return Forbid();
            }

            var ownUser = _context.Users
                    .Include(u=> u.Role)
                    .FirstOrDefault(u => u.Id == id);

            return Ok(ownUser);
        }


        // ✅ ADD USER
        // POST: api/user
        [HttpPost]
        public IActionResult AddUser(RegisterDto request)
        {      
            
            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                RoleId = request.RoleId,
                IsVerified = false
            };

            // 🔐 STEP 1: HASH PASSWORD
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

            // STEP 2: OTP + verification
            var otp = GenerateOtp();
            user.IsVerified = false;
            user.VerificationCode = otp;

            // STEP 3: SAVE TO DATABASE
            _context.Users.Add(user);
            _context.SaveChanges();

            // STEP 4: SEND EMAIL
            var emailService = new EmailService();
            emailService.SendEmail(
                user.Email,
                "SpendSync Verification Code",
                $"Your verification code is: {otp}"
            );

            return Ok(new
            {
                message = "user registered. Please verify your email."
            });
        }

        // ✅ UPDATE USER
        // PUT: api/user/1
        [HttpPut("{id}")]
        public IActionResult UpdateUser(int id, User updatedUser)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return NotFound();

            user.FirstName = updatedUser.FirstName;
            user.LastName = updatedUser.LastName;
            user.Email = updatedUser.Email;
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(user.Password);
            user.RoleId = updatedUser.RoleId;

            _context.SaveChanges();

            return Ok(user);
        }

        // ✅ DELETE USER
        // DELETE: api/user/1
        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Users.Find(id);

            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok("User deleted successfully");
        }

        [HttpPost("login")]
        public IActionResult Login(LoginDto login)
        {
            var user = _context.Users
                .Include(u => u.Role)
                .FirstOrDefault(u => u.Email == login.Email);
            
            if (user == null)
                return Unauthorized("invalid email");
            
            if (!BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid password");
            }

            if (!user.IsVerified)
                return Unauthorized("Account not verified");

            // var jwtService = new JwtService(HttpContext.RequestServices.GetService<IConfiguration>());
            var token = _jwtService.GenerateToken(user);
            var refreshToken = Guid.NewGuid().ToString();

             
            //var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.Now.AddDays(7);

            _context.SaveChanges();

            LogAction(user.Id, "LOGIN", "User logged in");

            return Ok(new
            {
                message = "Login successful",
                token = token,
                refreshToken = refreshToken
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout(RefreshTokenDto request)
        {
            
            var user = _context.Users.FirstOrDefault(u =>
                    u.Email == request.Email && 
                    u.RefreshToken == request.RefreshToken);

            if (user == null)
            {
                return Unauthorized("Invalid refresh token");
            }

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;

            _context.SaveChanges();

            return Ok(new { message = "Logged out successfully" });

        }


        [HttpPost("send-test-email")]
        public IActionResult SendTestEmail()
        {
            var emailService = new EmailService();
            
            emailService.SendEmail(
                "latikon43@gmail.com",
                "SpendSync Test",
                "Your email system is working, YEY!!"
            );

            return Ok("Email sent successfully");
        }

        [HttpPost("verify")]
        public IActionResult VerifyUser([FromBody] VerifyDto dto)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == dto.Email);

            if (user == null)
                return NotFound("User not found");

            if (user.VerificationCode != dto.Code)
                return BadRequest("Invalid verification code");

            user.IsVerified = true;
            user.VerificationCode = null;

            _context.SaveChanges();

            return Ok(new
            {
                message = "Account verified successfully"
            });
        }

        private string GenerateOtp()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[32];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
                return Convert.ToBase64String(randomBytes);
            }
        }


        [HttpPost("refresh")]
        public IActionResult RefreshToken(RefreshTokenDto request)
        {
            var user = _context.Users
                .Include(u => u.Role)
                .FirstOrDefault(u => 
                    u.Email == request.Email && 
                    u.RefreshToken == request.RefreshToken);

            if (user == null)
            {
                return Unauthorized("Invalid refresh token");
            }

            if (user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                return Unauthorized("Refresh token expired");
            }
            // 🔥 Generate new JWT
            var newToken = _jwtService.GenerateToken(user);

            // 🔁 Generate new refresh token (rotation)
            var newRefreshToken = Guid.NewGuid().ToString();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            _context.SaveChanges();

            return Ok(new
            {
                token = newToken,
                refreshToken = newRefreshToken
            });

        }

        [Authorize(Roles = "Audit")]
        [HttpGet("logs")]
        public IActionResult GetAuditLogs()
        {
            var logs = _context.AuditLogs
                .OrderByDescending(l => l.Timestamp)
                .ToList();

            return Ok(logs);
        }

        private void LogAction(int userId, string action, string entity)
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                Entity = entity,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            _context.SaveChanges();
        }

        
    }
}