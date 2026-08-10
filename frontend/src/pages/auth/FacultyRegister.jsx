import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { Alert } from '../../components/ui/Alert';
import { User, Mail, Lock, Building, GraduationCap, ArrowRight } from 'lucide-react';

export const FacultyRegister = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        institution: formData.institution || 'Independent Educator',
        department: formData.department || 'General Education'
      });

      if (res.success) {
        window.location.href = '/dashboard';
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create faculty account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <a href="/" className="inline-flex items-center">
            <Logo size="xl" />
          </a>
        </div>

        <Card className="shadow-xs border-zinc-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg sm:text-xl">Create Faculty Account</CardTitle>
            <CardDescription>
              Register your independent quiz creator workspace instantly
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
                label="Full Name *"
                name="name"
                placeholder="Dr. Sarah Jenkins"
                value={formData.name}
                onChange={handleChange}
                icon={User}
                required
              />

              <Input
                label="Email Address *"
                name="email"
                type="email"
                placeholder="s.jenkins@university.edu"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="College / Institute"
                  name="institution"
                  placeholder="Stanford University"
                  value={formData.institution}
                  onChange={handleChange}
                  icon={Building}
                />

                <Input
                  label="Department / Subject"
                  name="department"
                  placeholder="Computer Science"
                  value={formData.department}
                  onChange={handleChange}
                  icon={GraduationCap}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password *"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  icon={Lock}
                  required
                />

                <Input
                  label="Confirm Password *"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={Lock}
                  required
                />
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={isLoading} icon={ArrowRight}>
                Register Workspace
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-100 text-center text-xs text-zinc-600">
              Already registered?{' '}
              <a href="/login" className="font-bold text-zinc-900 hover:underline">
                Sign In to Account
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
