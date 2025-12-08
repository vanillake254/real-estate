import { useState, useEffect } from 'react';
import api from '../api';
import { Icons } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || '',
        phoneNumber: user.phoneNumber || '',
      }));
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.patch('/users/me', {
        username: formData.username,
        phoneNumber: formData.phoneNumber,
      });
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await api.patch('/users/me', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess('Password changed successfully!');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 mt-1">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg shadow-violet-500/25">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-semibold text-white">{user?.username || 'User'}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>

            {/* Referral Code */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Your Referral Code</p>
              <p className="text-lg font-bold text-emerald-400 font-mono tracking-wider">
                {user?.referralCode || 'N/A'}
              </p>
            </div>

            {/* Account Info */}
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Icons.Phone className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm text-white">{user?.phoneNumber || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Icons.User className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Account Type</p>
                  <p className="text-sm text-white">Investor</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit mb-6">
            <button
                onClick={() => {
                  setActiveTab('profile');
                  setError(null);
                  setSuccess(null);
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Edit Profile
              </button>
              <button
                onClick={() => {
                  setActiveTab('password');
                  setError(null);
                  setSuccess(null);
                }}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'password'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Change Password
              </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mb-6">
              <Icons.Success className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 mb-6">
              <Icons.Alert className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 space-y-5">
              <h3 className="text-lg font-semibold text-white">Profile Information</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-2">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g., 0712345678"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icons.Spinner className="w-5 h-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icons.Check className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          )}

          {/* Password Form */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 space-y-5">
              <h3 className="text-lg font-semibold text-white">Change Password</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                  minLength={6}
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Icons.Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-400">
                    <p className="font-medium text-amber-400 mb-1">Password Requirements</p>
                    <ul className="space-y-1">
                      <li>• At least 6 characters long</li>
                      <li>• Use a mix of letters and numbers for better security</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Icons.Spinner className="w-5 h-5" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Icons.Check className="w-5 h-5" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
