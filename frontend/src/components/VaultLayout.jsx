import React from 'react'
import { useState, useCallback, useEffect, useRef } from 'react';
import useUser from './hooks/useUser';
import NavigationPanel from './NavigationPanel';
import VaultHeader from './shared/VaultHeader';
import SearchBar from './shared/SearchBar';
import ProfileSettingsModal from '../utils/megaHelpers/ProfileSettingsModal';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

function VaultLayout() {
    const { user, loading } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const contentRef = useRef(null);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('accessToken');
        navigate('/login');
    }, [navigate]);

    // Scroll to top when route changes
    useEffect(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }, [location.pathname]);

    const handleCloseModal = useCallback(() => {
        setIsUploadModalOpen(false);
      }, []);
    
      const handleOpenModal = useCallback(() => {
        setIsUploadModalOpen(true);
      }, []);
  return (
<>
    {loading && user ? (
    <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ):(
        <>
        <div className="min-h-screen w-full">
          <div className="grid grid-cols-[320px_1fr] min-h-screen">
            {/* Left Side Panel */}
            <NavigationPanel />
            {/* Right Content Area */}
            <main className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 h-screen overflow-hidden">
              <div 
                ref={contentRef}
                className="relative z-10 p-8 h-full overflow-y-auto overflow-x-hidden max-w-full smooth-scroll"
              >
                <VaultHeader user={user} onProfileClick={() => setIsProfileModalOpen(true)} />
                {isProfileModalOpen ? (
                  <ProfileSettingsModal
                    isOpen={true}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={user}
                    onLogout={handleLogout}
                    inline
                  />
                ) : (
                  <>
                    <SearchBar/>
                    <div key={location.pathname} className="section-enter">
                      <Outlet/>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
        </>
    )}
    </>
  )
}

export default VaultLayout