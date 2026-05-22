import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const email = location.state?.email || '';
  const companyName = location.state?.companyName || '';

  useEffect(() => {
    if (!email) {
      navigate('/register-company');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpCode(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    const lastInput = document.getElementById(`otp-${lastIndex}`);
    lastInput?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otpCode: code,
      });

      if (response.data.success) {
        setSuccess('Email verified! Redirecting to dashboard...');
        
        // Login with the token
        login(response.data.token);

        // Redirect to admin dashboard
        setTimeout(() => {
          window.location.replace('/admin');
        }, 1500);
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/resend-otp', { email });

      if (response.data.success) {
        setSuccess('Verification code resent! Check your email.');
        setCanResend(false);
        setCountdown(60);
        setOtpCode(['', '', '', '', '', '']);
      } else {
        setError(response.data.message || 'Failed to resend code');
      }
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1929] via-[#0f2f47] to-[#0a1929] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-green-400 rounded-2xl mb-6 shadow-lg shadow-cyan-500/50">
            <span className="text-4xl">📧</span>
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 mb-2">
            Verify Your Email
          </h1>
          <p className="text-gray-400">
            We sent a 6-digit code to
          </p>
          <p className="text-cyan-400 font-semibold mt-1">{email}</p>
        </div>

        {/* Verification Form */}
        <div className="bg-gradient-to-br from-[#1a4d5c]/40 to-[#0f3a47]/40 backdrop-blur-lg rounded-2xl border border-cyan-500/30 shadow-2xl p-8">
          <form onSubmit={handleVerify}>
            {/* OTP Input */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-4 text-center font-medium">
                Enter Verification Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-[#0a1929]/50 border-2 border-cyan-500/30 rounded-lg text-cyan-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500 text-center mt-3">
                Code expires in 5 minutes
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                <p className="text-green-400 text-sm text-center">{success}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otpCode.join('').length !== 6}
              className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="text-cyan-400 font-semibold hover:text-cyan-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
              </button>
            </div>
          </form>
        </div>

        {/* Back to Registration */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/register-company')}
            className="text-gray-400 hover:text-cyan-400 transition text-sm"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
