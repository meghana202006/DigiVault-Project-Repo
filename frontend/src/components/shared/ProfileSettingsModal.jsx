import React, { useState } from 'react';
import ModalContainer from './ModalContainer'; // Adjust path
import { createPortal } from 'react-dom';
import {useLocation , useNavigate} from 'react-router-dom'
import ProfileTab from './ProfileComponents.jsx/ProfileTab';
import SecurityTab from './ProfileComponents.jsx/SecurityTab';
import SettingsTab from './ProfileComponents.jsx/SettingsTab';
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

function ProfileSettingsModal({onClose, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [autoBackupOn, setAutoBackupOn] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Detect the visibilty based on URL
  const isOpen = location.hash === '#profile'
  

  // Function to remove the hash on close
  const handleClose = () =>{
    navigate(location.pathname, {replace:true})
    if(onClose) onClose();

  }
  if (!isOpen) return null;
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <ModalContainer 
        onClose={handleClose} 
        maxWidth="xl" 
        padding="none" // Important: We handle padding inside for the header/footer
        borderRadius="2xl"
        maxHeight="" // Keeps the scrollable height consistent
      >
        <div className="flex flex-col bg-slate-800 min-h-[600px] max-h-[90vh]">
          {/* Header - Keeps your specific gradient design */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 shrink-0 h-28">
            <div className="flex items-center gap-5">
              <div className="w-15 h-15 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30">
                {initial}
              </div>
              <div>
                <h1 className="text-[25px] font-bold text-white">Profile Settings</h1>
                <p className="text-white/90 text-[16px]">Manage your account</p>
              </div>
            </div>
            {/* We use ModalContainer's X, but we can keep yours here if preferred */}
          </div>

          {/* Tabs */}
          <div className="flex justify-center border-b border-slate-600/50 bg-slate-900 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex flex-1 justify-center items-center gap-2 px-6 py-4 text-xl font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border-b-2 border-pink-400 text-pink-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                {label}
              </button>
            ))}
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                 <ProfileTab/>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <SecurityTab/>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <SettingsTab/>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-5 border-t border-slate-600/50 bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center text-xl gap-2 text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              <LogOut className="w-6 h-6" />
              Logout
            </button>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={handleClose}
                className="px-12 py-3 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors text-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 text-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </ModalContainer>
    </div>,
    document.body
  );
}

export default ProfileSettingsModal;