import { useState } from 'react';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ResetPassword = () => {
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const oobCode = urlParams.get('oobCode');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!oobCode) {
      setError('Invalid or expired reset link.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    
    try {
      // In a real app, this would validate the reset code and update the password
      // For demo purposes, we'll just show a success message
      console.log('Password reset for code:', oobCode);
      setSuccess('Password has been reset! You can now log in.');
      setTimeout(() => setLocation('/'), 3000);
    } catch (err: any) {
      setError('Failed to reset password. The link may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <form onSubmit={handleReset} className="bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-white">Reset Password</h2>
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mb-2"
          required
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="mb-2"
          required
        />
        {error && <div className="text-red-500 bg-red-100 border border-red-300 rounded px-3 py-2 text-sm text-center mb-2">{error}</div>}
        {success && <div className="text-green-600 bg-green-100 border border-green-300 rounded px-3 py-2 text-sm text-center mb-2">{success}</div>}
        <Button type="submit" className="w-full">Reset Password</Button>
      </form>
    </div>
  );
};

export default ResetPassword; 