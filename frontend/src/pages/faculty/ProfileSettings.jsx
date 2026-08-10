import React, { useState } from 'react';
import { FacultyLayout } from '../../components/layout/FacultyLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Switch } from '../../components/ui/Switch';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Building, GraduationCap, Lock, Save, Shield, Bell, KeyRound } from 'lucide-react';

export const ProfileSettings = () => {
  const { faculty, updateFacultyProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    name: faculty?.name || '',
    institution: faculty?.institution || '',
    department: faculty?.department || '',
    currentPassword: '',
    newPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    setLoading(true);
    try {
      const res = await api.auth.updateProfile(formData);
      if (res.success && res.faculty) {
        updateFacultyProfile(res.faculty);
        setSuccessMsg('Faculty profile & account settings updated successfully!');
        setFormData({ ...formData, currentPassword: '', newPassword: '' });
      } else {
        setErrorMsg(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FacultyLayout title="Unified Faculty Profile & Workspace Settings" activePath="/dashboard/profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {successMsg && <Alert type="success">{successMsg}</Alert>}
        {errorMsg && <Alert type="error">{errorMsg}</Alert>}

        {/* Tab Selection Bar */}
        <Tabs
          tabs={[
            { id: 'profile', label: 'Faculty Information', icon: User },
            { id: 'security', label: 'Security & Password', icon: Shield }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* TAB 1: FACULTY INFORMATION */}
        {activeTab === 'profile' && (
          <Card className="p-6 border-zinc-200 shadow-xs space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-white font-mono font-bold text-xl flex items-center justify-center shadow-xs">
                {faculty?.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900">{faculty?.name || 'Faculty Educator'}</h2>
                <p className="text-xs text-zinc-500 font-mono">{faculty?.email || 'professor@university.edu'}</p>
                <span className="inline-block mt-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700">
                  {faculty?.institution || 'Independent Educator'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                icon={User}
                required
              />

              <Input
                label="Primary Email Address (Immutable Identifier)"
                value={faculty?.email || ''}
                disabled
                icon={User}
                helperText="Email address is tied to your workspace account identity."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="College / Institution"
                  name="institution"
                  placeholder="e.g. Stanford University"
                  value={formData.institution}
                  onChange={handleChange}
                  icon={Building}
                />

                <Input
                  label="Department / Field"
                  name="department"
                  placeholder="e.g. Computer Science"
                  value={formData.department}
                  onChange={handleChange}
                  icon={GraduationCap}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" isLoading={loading} icon={Save}>
                  Save Profile Information
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <Card className="p-6 border-zinc-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 mb-1 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-zinc-900" /> Account Security Credentials
              </h3>
              <p className="text-xs text-zinc-500">Update your faculty account login password</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  icon={Lock}
                />

                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleChange}
                  icon={Lock}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" isLoading={loading} icon={Save}>
                  Update Password Credentials
                </Button>
              </div>
            </form>
          </Card>
        )}

      </div>
    </FacultyLayout>
  );
};
