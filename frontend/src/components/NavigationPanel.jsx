import React, { memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck  , LayoutDashboard, FileText, Image, Music, Video, Lock} from 'lucide-react';
import folderImage from '../assets/folder_image.png'

const navItems = [
  { id: 1 , label:'Dashboard', icon:LayoutDashboard, path: '/vault'},
  { id :2 , label:'Documents',icon:FileText, path: '/vault/documents'},
  { id :3 , label:'Images',icon:Image, path: '/vault/images'},
  { id :4 , label:'Audio',icon:Music, path: '/vault/audio'},
  { id :5 , label:'Videos',icon:Video, path: '/vault/videos'},
  { id :6 , label:'Private',icon:Lock, path: '/vault/private'},
]

const NavigationPanel = memo(function NavigationPanel() {
  const location = useLocation();

  // Function to check if a nav item is active
  const isActive = (path) => {
    // For Dashboard (/vault), match exactly or just /vault/
    if (path === '/vault') {
      return location.pathname === '/vault' || location.pathname === '/vault/';
    }
    // For other routes, check if current path starts with the nav item path
    return location.pathname.startsWith(path);
  };

  return (
    <>
         <aside className="bg-slate-900 border-r border-slate-400 p-6 flex flex-col h-screen">
              <div className="flex-1 overflow-hidden min-h-0">
                <div className='flex items-center gap-5 mb-6'>
                  <ShieldCheck className="text-blue-500 w-12 h-12 font-bold" />
                  <div className='flex flex-col gap-1'>
                    <h2 className="text-white text-3xl font-bold">DigiVault</h2>
                    <p className="text-slate-400 text-lg">Secure Storage</p>
                  </div>
                </div>
                {/* Navigation */}
                <nav className="space-y-3 mt-10">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        to={item.path}
                        key={item.id}
                        className={`flex items-center gap-5 cursor-pointer py-4 px-5 rounded-2xl transition-all duration-200 w-full ${
                          active
                            ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/20 backdrop-blur-sm text-cyan-400'
                            : 'text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/30 hover:to-blue-500/20 hover:backdrop-blur-sm hover:text-cyan-400'
                        }`}
                      >
                        <IconComponent className="w-7 h-7 flex-shrink-0" />
                        <span className='text-xl font-medium'>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              
              {/* Image at bottom */}
              <div className="mt-auto pb-0">
                <img 
                  src={folderImage} 
                  alt="Secure folder illustration" 
                  className="w-[280px] h-[280px] rounded-lg object-cover mx-auto"
                />
              </div>
            </aside>
    </>
  )
});

export default NavigationPanel