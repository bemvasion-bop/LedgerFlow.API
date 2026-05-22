using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace LedgerFlow.API.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Send OTP verification email using MailKit
        /// </summary>
        public async Task<bool> SendOtpEmailAsync(string toEmail, string otpCode, string companyName)
        {
            try
            {
                var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpEmail = _configuration["Email:SmtpEmail"];
                var smtpPassword = _configuration["Email:SmtpPassword"];

                // If SMTP not configured, log the OTP instead (for development)
                if (string.IsNullOrEmpty(smtpEmail) || string.IsNullOrEmpty(smtpPassword))
                {
                    _logger.LogWarning("SMTP not configured. OTP Code for {Email}: {OtpCode}", toEmail, otpCode);
                    Console.WriteLine($"\n========================================");
                    Console.WriteLine($"📧 OTP EMAIL (Development Mode)");
                    Console.WriteLine($"========================================");
                    Console.WriteLine($"To: {toEmail}");
                    Console.WriteLine($"Company: {companyName}");
                    Console.WriteLine($"OTP Code: {otpCode}");
                    Console.WriteLine($"Expires: 5 minutes");
                    Console.WriteLine($"========================================\n");
                    return true;
                }

                // Create email message using MimeKit
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("SpendSync", smtpEmail));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = $"Your SpendSync Verification Code: {otpCode}";

                // Create HTML body
                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = GetOtpEmailTemplate(otpCode, companyName)
                };
                message.Body = bodyBuilder.ToMessageBody();

                // Send email using MailKit
                using var client = new SmtpClient();
                
                // Connect to Gmail SMTP
                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                
                // Authenticate
                await client.AuthenticateAsync(smtpEmail, smtpPassword);
                
                // Send message
                await client.SendAsync(message);
                
                // Disconnect
                await client.DisconnectAsync(true);

                _logger.LogInformation("OTP email sent successfully to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP email to {Email}", toEmail);
                
                // Log to console for debugging
                Console.WriteLine($"\n❌ EMAIL ERROR:");
                Console.WriteLine($"To: {toEmail}");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"OTP Code (for testing): {otpCode}\n");
                
                return false;
            }
        }

        /// <summary>
        /// Get HTML email template for OTP
        /// </summary>
        private string GetOtpEmailTemplate(string otpCode, string companyName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>SpendSync - Verification Code</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; background-color: #0a1929;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #0a1929; padding: 40px 20px;'>
        <tr>
            <td align='center'>
                <table width='600' cellpadding='0' cellspacing='0' style='background: linear-gradient(135deg, #1a4d5c 0%, #0f3a47 100%); border-radius: 16px; border: 1px solid rgba(0, 217, 217, 0.3); overflow: hidden;'>
                    <!-- Header -->
                    <tr>
                        <td style='padding: 40px 40px 20px 40px; text-align: center;'>
                            <div style='display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #00d9d9 0%, #20c997 100%); border-radius: 12px; margin-bottom: 20px;'>
                                <span style='color: #0a1929; font-size: 32px; font-weight: bold; line-height: 60px;'>S</span>
                            </div>
                            <h1 style='color: #00d9d9; margin: 0; font-size: 28px; font-weight: 700;'>
                                Spend<span style='color: #20c997;'>Sync</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style='padding: 20px 40px;'>
                            <h2 style='color: #ffffff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;'>
                                Welcome to SpendSync!
                            </h2>
                            <p style='color: #e0e0e0; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;'>
                                Thank you for registering <strong style='color: #00d9d9;'>{companyName}</strong> with SpendSync. 
                                To complete your registration and start your 14-day free trial, please verify your email address.
                            </p>
                            <p style='color: #e0e0e0; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;'>
                                Your verification code is:
                            </p>
                            
                            <!-- OTP Code -->
                            <div style='background: rgba(0, 217, 217, 0.1); border: 2px solid #00d9d9; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;'>
                                <div style='color: #00d9d9; font-size: 48px; font-weight: 700; letter-spacing: 8px; font-family: ""Courier New"", monospace;'>
                                    {otpCode}
                                </div>
                            </div>
                            
                            <p style='color: #e0e0e0; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;'>
                                ⏱️ This code will expire in <strong style='color: #00d9d9;'>5 minutes</strong>.
                            </p>
                            <p style='color: #e0e0e0; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;'>
                                🔒 For security reasons, never share this code with anyone.
                            </p>
                            
                            <div style='background: rgba(255, 107, 107, 0.1); border-left: 4px solid #ff6b6b; padding: 15px; border-radius: 8px; margin-bottom: 30px;'>
                                <p style='color: #ff8a8a; margin: 0; font-size: 14px; line-height: 1.6;'>
                                    <strong>⚠️ Didn't request this code?</strong><br>
                                    If you didn't register for SpendSync, please ignore this email or contact our support team.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style='padding: 30px 40px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(0, 217, 217, 0.2);'>
                            <p style='color: #a0a0a0; margin: 0 0 10px 0; font-size: 14px; text-align: center;'>
                                Need help? Contact us at <a href='mailto:support@spendsync.com' style='color: #00d9d9; text-decoration: none;'>support@spendsync.com</a>
                            </p>
                            <p style='color: #808080; margin: 0; font-size: 12px; text-align: center;'>
                                © 2026 SpendSync - Expense & Reimbursement Management
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        /// <summary>
        /// Send welcome email after successful registration using MailKit
        /// </summary>
        public async Task<bool> SendWelcomeEmailAsync(string toEmail, string companyName, string adminName)
        {
            try
            {
                var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpEmail = _configuration["Email:SmtpEmail"];
                var smtpPassword = _configuration["Email:SmtpPassword"];

                if (string.IsNullOrEmpty(smtpEmail) || string.IsNullOrEmpty(smtpPassword))
                {
                    _logger.LogWarning("SMTP not configured. Welcome email not sent to {Email}", toEmail);
                    return true;
                }

                // Create email message using MimeKit
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("SpendSync", smtpEmail));
                message.To.Add(new MailboxAddress(adminName, toEmail));
                message.Subject = $"Welcome to SpendSync, {companyName}!";

                // Create HTML body
                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = GetWelcomeEmailTemplate(companyName, adminName)
                };
                message.Body = bodyBuilder.ToMessageBody();

                // Send email using MailKit
                using var client = new SmtpClient();
                
                // Connect to Gmail SMTP
                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                
                // Authenticate
                await client.AuthenticateAsync(smtpEmail, smtpPassword);
                
                // Send message
                await client.SendAsync(message);
                
                // Disconnect
                await client.DisconnectAsync(true);

                _logger.LogInformation("Welcome email sent successfully to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", toEmail);
                return false;
            }
        }

        private string GetWelcomeEmailTemplate(string companyName, string adminName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Welcome to SpendSync</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, sans-serif; background-color: #0a1929;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #0a1929; padding: 40px 20px;'>
        <tr>
            <td align='center'>
                <table width='600' cellpadding='0' cellspacing='0' style='background: linear-gradient(135deg, #1a4d5c 0%, #0f3a47 100%); border-radius: 16px; border: 1px solid rgba(0, 217, 217, 0.3);'>
                    <tr>
                        <td style='padding: 40px; text-align: center;'>
                            <h1 style='color: #00d9d9; margin: 0 0 20px 0; font-size: 32px;'>
                                🎉 Welcome to SpendSync!
                            </h1>
                            <p style='color: #e0e0e0; font-size: 18px; margin: 0 0 30px 0;'>
                                Hi {adminName},
                            </p>
                            <p style='color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;'>
                                Your company <strong style='color: #00d9d9;'>{companyName}</strong> has been successfully registered!
                            </p>
                            <p style='color: #e0e0e0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;'>
                                Your 14-day free trial has started. Explore all features and see how SpendSync can transform your expense management.
                            </p>
                            <a href='http://localhost:3001/login' style='display: inline-block; background: linear-gradient(135deg, #00d9d9 0%, #20c997 100%); color: #0a1929; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;'>
                                Go to Dashboard
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        /// <summary>
        /// Send password reset email using MailKit
        /// </summary>
        public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink, string companyName)
        {
            try
            {
                var smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var smtpEmail = _configuration["Email:SmtpEmail"];
                var smtpPassword = _configuration["Email:SmtpPassword"];

                // If SMTP not configured, log the reset link instead (for development)
                if (string.IsNullOrEmpty(smtpEmail) || string.IsNullOrEmpty(smtpPassword))
                {
                    _logger.LogWarning("SMTP not configured. Password reset link for {Email}: {ResetLink}", toEmail, resetLink);
                    Console.WriteLine($"\n========================================");
                    Console.WriteLine($"🔑 PASSWORD RESET EMAIL (Development Mode)");
                    Console.WriteLine($"========================================");
                    Console.WriteLine($"To: {toEmail}");
                    Console.WriteLine($"User: {userName}");
                    Console.WriteLine($"Company: {companyName}");
                    Console.WriteLine($"Reset Link: {resetLink}");
                    Console.WriteLine($"Expires: 30 minutes");
                    Console.WriteLine($"========================================\n");
                    return true;
                }

                // Create email message using MimeKit
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("SpendSync", smtpEmail));
                message.To.Add(new MailboxAddress(userName, toEmail));
                message.Subject = "Reset Your SpendSync Password";

                // Create HTML body
                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = GetPasswordResetEmailTemplate(userName, resetLink, companyName)
                };
                message.Body = bodyBuilder.ToMessageBody();

                // Send email using MailKit
                using var client = new SmtpClient();
                
                // Connect to Gmail SMTP
                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                
                // Authenticate
                await client.AuthenticateAsync(smtpEmail, smtpPassword);
                
                // Send message
                await client.SendAsync(message);
                
                // Disconnect
                await client.DisconnectAsync(true);

                _logger.LogInformation("Password reset email sent successfully to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
                
                // Log to console for debugging
                Console.WriteLine($"\n❌ EMAIL ERROR:");
                Console.WriteLine($"To: {toEmail}");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Reset Link (for testing): {resetLink}\n");
                
                return false;
            }
        }

        /// <summary>
        /// Get HTML email template for password reset
        /// </summary>
        private string GetPasswordResetEmailTemplate(string userName, string resetLink, string companyName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>SpendSync - Password Reset</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, ""Helvetica Neue"", Arial, sans-serif; background-color: #0a1929;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #0a1929; padding: 40px 20px;'>
        <tr>
            <td align='center'>
                <table width='600' cellpadding='0' cellspacing='0' style='background: linear-gradient(135deg, #1a4d5c 0%, #0f3a47 100%); border-radius: 16px; border: 1px solid rgba(0, 217, 217, 0.3); overflow: hidden;'>
                    <!-- Header -->
                    <tr>
                        <td style='padding: 40px 40px 20px 40px; text-align: center;'>
                            <div style='display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #00d9d9 0%, #20c997 100%); border-radius: 12px; margin-bottom: 20px;'>
                                <span style='color: #0a1929; font-size: 32px; font-weight: bold; line-height: 60px;'>S</span>
                            </div>
                            <h1 style='color: #00d9d9; margin: 0; font-size: 28px; font-weight: 700;'>
                                Spend<span style='color: #20c997;'>Sync</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style='padding: 20px 40px;'>
                            <h2 style='color: #ffffff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;'>
                                🔑 Password Reset Request
                            </h2>
                            <p style='color: #e0e0e0; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;'>
                                Hi <strong style='color: #00d9d9;'>{userName}</strong>,
                            </p>
                            <p style='color: #e0e0e0; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;'>
                                We received a request to reset your password for your <strong style='color: #00d9d9;'>{companyName}</strong> account on SpendSync.
                            </p>
                            <p style='color: #e0e0e0; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;'>
                                Click the button below to reset your password:
                            </p>
                            
                            <!-- Reset Button -->
                            <div style='text-align: center; margin-bottom: 30px;'>
                                <a href='{resetLink}' style='display: inline-block; background: linear-gradient(135deg, #00d9d9 0%, #20c997 100%); color: #0a1929; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 217, 217, 0.3);'>
                                    Reset Password
                                </a>
                            </div>
                            
                            <p style='color: #e0e0e0; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;'>
                                ⏱️ This link will expire in <strong style='color: #00d9d9;'>30 minutes</strong>.
                            </p>
                            <p style='color: #e0e0e0; margin: 0 0 20px 0; font-size: 14px; line-height: 1.6;'>
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <div style='background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 217, 217, 0.2); border-radius: 8px; padding: 15px; margin-bottom: 30px; word-break: break-all;'>
                                <a href='{resetLink}' style='color: #00d9d9; text-decoration: none; font-size: 13px;'>{resetLink}</a>
                            </div>
                            
                            <div style='background: rgba(255, 107, 107, 0.1); border-left: 4px solid #ff6b6b; padding: 15px; border-radius: 8px; margin-bottom: 30px;'>
                                <p style='color: #ff8a8a; margin: 0; font-size: 14px; line-height: 1.6;'>
                                    <strong>⚠️ Didn't request this?</strong><br>
                                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                                </p>
                            </div>
                            
                            <div style='background: rgba(0, 217, 217, 0.1); border-left: 4px solid #00d9d9; padding: 15px; border-radius: 8px;'>
                                <p style='color: #00d9d9; margin: 0; font-size: 14px; line-height: 1.6;'>
                                    <strong>🔒 Security Tip:</strong><br>
                                    For your security, never share your password or reset links with anyone.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style='padding: 30px 40px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(0, 217, 217, 0.2);'>
                            <p style='color: #a0a0a0; margin: 0 0 10px 0; font-size: 14px; text-align: center;'>
                                Need help? Contact us at <a href='mailto:support@spendsync.com' style='color: #00d9d9; text-decoration: none;'>support@spendsync.com</a>
                            </p>
                            <p style='color: #808080; margin: 0; font-size: 12px; text-align: center;'>
                                © 2026 SpendSync - Expense & Reimbursement Management
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}
