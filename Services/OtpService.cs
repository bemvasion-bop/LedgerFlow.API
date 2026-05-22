using System.Collections.Concurrent;

namespace LedgerFlow.API.Services
{
    public class OtpService
    {
        // In-memory storage for OTPs (for production, use Redis or database)
        private static readonly ConcurrentDictionary<string, OtpData> _otpStore = new();

        public class OtpData
        {
            public string Code { get; set; } = string.Empty;
            public DateTime ExpiresAt { get; set; }
            public string Email { get; set; } = string.Empty;
            public string CompanyName { get; set; } = string.Empty;
            public string CompanyEmail { get; set; } = string.Empty;
            public string? CompanyPhone { get; set; }
            public string? CompanyAddress { get; set; }
            public string AdminFirstName { get; set; } = string.Empty;
            public string AdminLastName { get; set; } = string.Empty;
            public string AdminPassword { get; set; } = string.Empty;
            public int PlanId { get; set; }
            public string BillingCycle { get; set; } = "Quarterly";
        }

        /// <summary>
        /// Generate a 6-digit OTP code
        /// </summary>
        public string GenerateOtp()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        /// <summary>
        /// Store OTP with registration data
        /// </summary>
        public void StoreOtp(string email, string otpCode, OtpData data)
        {
            data.Code = otpCode;
            data.ExpiresAt = DateTime.UtcNow.AddMinutes(5); // 5 minutes expiration
            _otpStore[email.ToLower()] = data;
        }

        /// <summary>
        /// Verify OTP code
        /// </summary>
        public (bool IsValid, OtpData? Data, string Message) VerifyOtp(string email, string code)
        {
            var emailKey = email.ToLower();

            if (!_otpStore.TryGetValue(emailKey, out var otpData))
            {
                return (false, null, "No OTP found for this email. Please request a new one.");
            }

            if (DateTime.UtcNow > otpData.ExpiresAt)
            {
                _otpStore.TryRemove(emailKey, out _);
                return (false, null, "OTP has expired. Please request a new one.");
            }

            if (otpData.Code != code)
            {
                return (false, null, "Invalid OTP code. Please try again.");
            }

            // OTP is valid - remove it from store
            _otpStore.TryRemove(emailKey, out _);
            return (true, otpData, "OTP verified successfully.");
        }

        /// <summary>
        /// Check if OTP exists for email
        /// </summary>
        public bool HasOtp(string email)
        {
            return _otpStore.ContainsKey(email.ToLower());
        }

        /// <summary>
        /// Remove OTP for email
        /// </summary>
        public void RemoveOtp(string email)
        {
            _otpStore.TryRemove(email.ToLower(), out _);
        }

        /// <summary>
        /// Clean up expired OTPs (call periodically)
        /// </summary>
        public void CleanupExpiredOtps()
        {
            var now = DateTime.UtcNow;
            var expiredKeys = _otpStore
                .Where(kvp => kvp.Value.ExpiresAt < now)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in expiredKeys)
            {
                _otpStore.TryRemove(key, out _);
            }
        }
    }
}
