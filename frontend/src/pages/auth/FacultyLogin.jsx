import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { Alert } from '../../components/ui/Alert';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export const FacultyLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login({ email, password });
      if (res.success) {
        window.location.href = '/dashboard';
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center">
            <Logo size="xl" />
          </a>
        </div>

        <Card className="shadow-xs border-zinc-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg sm:text-xl">Faculty Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your isolated workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {error && (
              <Alert type="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Faculty Email Address"
                type="email"
                placeholder="professor@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />

              <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isLoading} icon={ArrowRight}>
                Sign In to Workspace
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-100 text-center text-xs text-zinc-600">
              New educator on QuizX?{' '}
              <a href="/register" className="font-bold text-zinc-900 hover:underline">
                Create Faculty Account
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
