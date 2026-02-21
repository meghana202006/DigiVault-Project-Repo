import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Settings,
  Lock,
  Bell,
  LogOut,
  Trash2,
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function ProfileSettingsModal({ isOpen, onClose, user, onLogout, inline = false }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [autoBackupOn, setAutoBackupOn] = useState(false);

  if (!isOpen) return null;

  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  const cardContent = (
    <div
      className={`flex flex-col bg-slate-800/95 border border-slate-600/50 rounded-2xl shadow-2xl overflow-hidden ${
        inline ? 'w-full max-w-2xl min-h-[420px]' : 'relative w-full max-w-2xl max-h-[90vh]'
      }`}
    >
        {/* Header - gradient */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold border-2 border-white/30">
              {initial}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Profile Settings</h1>
              <p className="text-white/90 text-sm">Manage your account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-600/50 bg-slate-800/80 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-white bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border-b-2 border-pink-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Full Name</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                  <User className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                  <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="flex-1 bg-transparent text-white outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">Storage Usage</label>
                <p className="text-white text-sm mb-2">300 GB used of 1 TB</p>
                <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: '30%' }}
                  />
                </div>
                <p className="text-white text-sm text-right mt-1">30%</p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Current Password</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                      <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">New Password</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                      <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-2">Confirm Password</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                      <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600/50">
                <div>
                  <h3 className="text-white font-semibold">Two-Factor Authentication</h3>
                  <p className="text-slate-400 text-sm mt-1">Add an extra layer of security</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Enable
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600/50">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">Notifications</h3>
                    <p className="text-slate-400 text-sm">Receive email notifications</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationsOn}
                  onClick={() => setNotificationsOn((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notificationsOn ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      notificationsOn ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600/50">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">Auto-Backup</h3>
                    <p className="text-slate-400 text-sm">Automatically backup files</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoBackupOn}
                  onClick={() => setAutoBackupOn((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    autoBackupOn ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      autoBackupOn ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <div className="p-4 rounded-lg border-2 border-red-500/50 bg-slate-700/20">
                <h3 className="text-red-400 font-semibold">Danger Zone</h3>
                <p className="text-slate-400 text-sm mt-1">Permanently delete your account and all data</p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-600/50 bg-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        </div>
    </div>
  );

  if (inline) {
    return cardContent;
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {cardContent}
      </div>
    </div>
  );
}

export default ProfileSettingsModal;
