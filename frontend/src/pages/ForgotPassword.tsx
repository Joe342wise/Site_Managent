import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Mail } from 'lucide-react';
import { useMutation } from 'react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');

  const forgotPasswordMutation = useMutation(
    (email: string) => apiService.forgotPassword(email),
    {
      onSuccess: () => {
        setCodeSent(true);
        setStep('reset');
        toast.success('Verification code sent to your email');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to send verification code');
      },
    }
  );

  const resetPasswordMutation = useMutation(
    (data: { email: string; verificationCode: string; newPassword: string }) =>
      apiService.resetPassword(data),
    {
      onSuccess: () => {
        toast.success('Password reset successfully! Redirecting to login page...');
        // Redirect to login page after a short delay to show the success message
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      },
    }
  );

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    forgotPasswordMutation.mutate(email);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    resetPasswordMutation.mutate({
      email,
      verificationCode,
      newPassword,
    });
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCodeSent(false);
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home Button */}
        <div className="flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            De'Aion Contractors
          </p>
          <p className="mt-4 text-center text-sm text-gray-500">
            {step === 'email'
              ? 'Enter your email to receive a verification code'
              : 'Enter the verification code and your new password'
            }
          </p>
        </div>

        {step === 'email' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your email address"
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={forgotPasswordMutation.isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotPasswordMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="verification-code"
                  name="verificationCode"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Check your email for the verification code
                </p>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={resetPasswordMutation.isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetPasswordMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              <div className="flex justify-center space-x-4 text-sm">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Use Different Email
                </button>
                <span className="text-gray-300">|</span>
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;