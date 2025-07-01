import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Mail, Loader2 } from 'lucide-react';
import rakshithShield from "@/assets/rakshith360-shield.svg";
import { useToast } from '@/hooks/use-toast';

const LoginForm = () => {
  console.log('LoginForm rendered');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  
  const { login, register, loading, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: unknown) {
      console.log('Login error:', err);
      let errorMsg = '';
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/user-not-found') {
          errorMsg = 'No user found with this email. Please register.';
        } else if (code === 'auth/wrong-password') {
          errorMsg = 'Incorrect password. Please try again.';
        } else if (code === 'auth/email-already-in-use') {
          errorMsg = 'This email is already in use. Please log in or use a different email.';
        } else if (code === 'auth/invalid-email') {
          errorMsg = 'Invalid email address format.';
        } else if (code === 'auth/weak-password') {
          errorMsg = 'Password should be at least 6 characters.';
        } else if (code === 'auth/invalid-credential') {
          errorMsg = 'The credentials you entered are incorrect. Please check your email and password.';
        } else if (code === 'auth/user-disabled') {
          errorMsg = 'This account has been disabled. Please contact support.';
        } else if (code === 'auth/too-many-requests') {
          errorMsg = 'Too many unsuccessful login attempts. Please try again later.';
        } else if (code === 'auth/network-request-failed') {
          errorMsg = 'Network error. Please check your connection and try again.';
        } else {
          errorMsg = 'An error occurred. Please try again.';
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      } else {
        errorMsg = 'An error occurred. Please try again.';
      }
      setError(errorMsg);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setResetError('');
    try {
      await resetPassword(resetEmail);
      setResetMessage('Password reset email sent! Please check your inbox.');
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('user-not-found')) {
        setResetError('No user found with this email.');
      } else if (err instanceof Error && err.message.includes('email')) {
        setResetError('Invalid email address format.');
      } else if (err instanceof Response && err.status === 0) {
        setResetError('Network error. Please check your connection and try again.');
      } else {
        setResetError('Failed to send password reset email. Please try again.');
      }
    }
  };

  const handleResetClick = () => {
    setShowReset(true);
  };

  const handleResetCancel = () => {
    setShowReset(false);
    setResetEmail('');
    setResetMessage('');
    setResetError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implementation of handleInputChange
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <img src={rakshithShield} alt="Rakshith360 Shield" className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Rakshith AI
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your Medical Assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="login" className="text-gray-300">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-gray-300">Register</TabsTrigger>
            </TabsList>
            
            {!showReset ? (
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
                
                {isLogin && (
                  <div className="text-right mb-2">
                    <button
                      type="button"
                      className="text-xs text-blue-400 hover:underline focus:outline-none"
                      onClick={handleResetClick}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
                
                {error && (
                  <div className="text-red-500 bg-red-100 border border-red-300 rounded px-3 py-2 text-sm text-center mb-2">
                    {error}
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
                <label className="text-sm font-medium text-gray-300 text-left block">Enter your email to reset password</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
                {resetMessage && (
                  <div className="text-green-600 bg-green-100 border border-green-300 rounded px-3 py-2 text-xs text-center">{resetMessage}</div>
                )}
                {resetError && (
                  <div className="text-red-500 bg-red-100 border border-red-300 rounded px-3 py-2 text-xs text-center">{resetError}</div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" className="w-full" disabled={loading}>Send Reset Email</Button>
                  <Button type="button" variant="outline" className="w-full" onClick={handleResetCancel}>Cancel</Button>
                </div>
              </form>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Rakshith AI may provide inaccurate information if you don't provide precise details.
              </p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm; 