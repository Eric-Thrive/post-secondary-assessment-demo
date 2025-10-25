import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, GraduationCap, Users, BookOpen, Sparkles, CheckCircle, ArrowRight, LogOut } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { AppNavigation } from '@/components/shared/AppNavigation';
import { useNavigate } from 'react-router-dom';

interface DemoLandingPageProps {
  environment: 'post-secondary-demo' | 'k12-demo' | 'tutoring-demo';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  primaryColor: string;
}

export default function DemoLandingPage({ environment, title, description, icon: Icon, features, primaryColor }: DemoLandingPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const { toast } = useToast();
  const { login: authLogin, user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Form states
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '', 
    email: '' 
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({ email: '' });
  const [forgotUsernameForm, setForgotUsernameForm] = useState({ email: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await authLogin(loginForm.username, loginForm.password, environment);
      
      if (success) {
        toast({
          title: "Welcome!",
          description: `Successfully logged into ${title}`,
        });
        navigate('/');
      }
      // Error handling is already done by the AuthContext login function
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        username: registerForm.username,
        password: registerForm.password,
        email: registerForm.email,
      };
      
      console.log('🔍 Registration Debug:', {
        environment,
        formData: registerForm,
        requestData,
        allFieldsPresent: !!(requestData.username && requestData.password && requestData.email)
      });

      const response = await apiClient.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'x-environment': environment,
        },
      });

      if (response.success) {
        // After successful registration, log in the user
        const loginSuccess = await authLogin(registerForm.username, registerForm.password, environment);
        
        if (loginSuccess) {
          toast({
            title: "Welcome!",
            description: `Successfully registered for ${title}`,
          });
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.request('/auth/reset-password-request', {
        method: 'POST',
        body: JSON.stringify({
          email: resetPasswordForm.email,
        }),
        headers: {
          'x-environment': environment,
        },
      });

      toast({
        title: "Password Reset Sent",
        description: "If an account with that email exists, a password reset link has been sent.",
      });
      
      setShowResetPassword(false);
      setResetPasswordForm({ email: '' });
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send password reset",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validation
    if (!forgotUsernameForm.email || !forgotUsernameForm.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.request('/auth/forgot-username', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotUsernameForm.email,
        }),
        headers: {
          'x-environment': environment,
        },
      });

      toast({
        title: "Username Information Sent",
        description: "If an account with that email exists, your username information has been sent.",
      });
      
      setShowForgotUsername(false);
      setForgotUsernameForm({ email: '' });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send username information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {user?.role === 'system_admin' && <AppNavigation />}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {user && user.role !== 'system_admin' && (
          <div className="flex justify-end mb-6">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className="space-y-8">
            <div className="text-center lg:text-left space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className={`p-3 rounded-full ${primaryColor}`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg">
                {description}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                What You'll Experience
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-start">
              <Badge variant="secondary" className="px-4 py-2">
                <span className="text-sm font-medium">Demo Environment - Full Access</span>
              </Badge>
            </div>
          </div>

          {/* Right Side - Authentication */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Get Started</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
                    <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <Input
                          id="login-username"
                          data-testid="login-username"
                          type="text"
                          placeholder="Enter your username"
                          value={loginForm.username}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            data-testid="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(prev => !prev)}
                            data-testid="toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                        data-testid="login-submit"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Signing In...
                          </>
                        ) : (
                          <>
                            Sign In
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      {/* Forgot Password & Username Links */}
                      <div className="text-center space-y-1">
                        <div>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowResetPassword(true)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                            data-testid="forgot-password-link"
                          >
                            Forgot your password?
                          </Button>
                        </div>
                        <div>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowForgotUsername(true)}
                            className="text-sm text-muted-foreground hover:text-foreground"
                            data-testid="forgot-username-link"
                          >
                            Forgot your username?
                          </Button>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-username">Username</Label>
                          <Input
                            id="register-username"
                            data-testid="register-username"
                            type="text"
                            placeholder="Choose a username"
                            value={registerForm.username}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-email">Email</Label>
                          <Input
                            id="register-email"
                            data-testid="register-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <div className="relative">
                            <Input
                              id="register-password"
                              data-testid="register-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={registerForm.password}
                              onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(prev => !prev)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Password must be at least 8 characters with uppercase, lowercase, and a number
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-confirm-password">Confirm Password</Label>
                          <Input
                            id="register-confirm-password"
                            data-testid="register-confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                        data-testid="register-submit"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent data-testid="reset-password-dialog">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                data-testid="reset-email"
                type="email"
                placeholder="your.email@example.com"
                value={resetPasswordForm.email}
                onChange={(e) => setResetPasswordForm({ email: e.target.value })}
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowResetPassword(false)}
                className="flex-1"
                data-testid="reset-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
                data-testid="reset-submit"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Username Dialog */}
      <Dialog open={showForgotUsername} onOpenChange={setShowForgotUsername}>
        <DialogContent data-testid="forgot-username-dialog">
          <DialogHeader>
            <DialogTitle>Forgot Username</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you your username information.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotUsername} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-username-email">Email</Label>
              <Input
                id="forgot-username-email"
                data-testid="forgot-username-email"
                type="email"
                placeholder="your.email@example.com"
                value={forgotUsernameForm.email}
                onChange={(e) => setForgotUsernameForm({ email: e.target.value })}
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForgotUsername(false)}
                className="flex-1"
                data-testid="forgot-username-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
                data-testid="forgot-username-submit"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Username Info'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
