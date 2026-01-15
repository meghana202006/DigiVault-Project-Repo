import React from 'react'
import folderImage from '../assets/folder_image.png'
import { ShieldCheck, LayoutDashboard , FileText, Image, Music, Video, Lock ,Search,HardDrive, Clock} from 'lucide-react'
import useUser from './hooks/useUser';
import StorageDisplay from './shared/StorageDisplay';
const navItems = [
    { id: 1 , label:'Dashboard', icon:LayoutDashboard},
    { id :2 , label:'Documents',icon:FileText},
    { id :3 , label:'Images',icon:Image},
    { id :4 , label:'Audio',icon:Music},
    { id :5 , label:'Videos',icon:Video},
    { id :6 , label:'Private',icon:Lock},
]

const storageItems = [
  {id:1 , icon:FileText, section:'Documents',storage:100 , color:'from-blue-500/80 to-cyan-500/80'},
  {id:2 , icon:Image, section:'Images',storage:100 , color:'from-rose-500/80 to-pink-500/80'},
  {id:3 , icon:Music, section:'Audio',storage:100 , color:'from-indigo-500/80 to-purple-500/80'},
  {id:4 , icon:Video, section:'Videos',storage:100 , color:'from-emerald-500/80 to-green-500/80'},
  {id:5 , icon:Lock, section:'Private',storage:100 , color:'from-sky-500/80 to-blue-500/80'},
]
const recentFiles = [
  {id:1 , icon:FileText, title:'Document 1', size:100},
  {id:2 , icon:Image, title:'Image 1', size:100},
]



function Vault() {
  const { user, loading } = useUser();
  
  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="min-h-screen w-full">
          <div className="grid grid-cols-[380px_1fr] min-h-screen">
            {/* Left Side Panel */}
            <aside className="bg-slate-800 border-r border-slate-400 p-6 flex flex-col h-screen">
              <div className="flex-1 overflow-hidden min-h-0">
                <div className='flex items-center gap-5 mb-6'>
                  <ShieldCheck className="text-blue-500 w-12 h-12 font-bold" />
                  <div className='flex flex-col gap-1'>
                    <h2 className="text-white text-3xl font-bold">DigiVault</h2>
                    <p className="text-slate-400 text-lg">Secure Storage</p>
                  </div>
                </div>
                {/* Navigation */}
                <nav className="space-y-3 mt-10 px-6">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div 
                        className="flex items-center gap-5 text-slate-300 cursor-pointer py-4 px-10 rounded-2xl hover:bg-gradient-to-r hover:from-cyan-500/30 hover:to-blue-500/20 hover:backdrop-blur-sm hover:text-cyan-400 transition-all duration-200" 
                        key={item.id}
                      >
                        <IconComponent className="w-7 h-7" />
                        <span className='text-xl font-medium'>{item.label}</span>
                      </div>
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

            {/* Right Content Area */}
            <main className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 h-screen overflow-hidden">
              {/* Blur Glow Effects - Same as Login/Register */}
              <div className="absolute inset-0 pointer-events-none -z-0">
                <div className="absolute -top-5 -right-10 w-[360px] h-[360px] bg-blue-500/40 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 -left-[200px] w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>
                <div className="absolute -bottom-20 right-1/5 w-[360px] h-[360px] bg-cyan-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }}></div>
              </div>
              
              {/* Content - Scrollable area: vertical scroll only when content overflows */}
              <div className="relative z-10 p-8 h-full overflow-y-auto overflow-x-hidden max-w-full">
                <header className='flex items-start justify-between mb-8'>
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-white mb-4">
                      Welcome back,{' '}
                      <span className='bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text'>
                        {user?.name || 'User'}
                      </span>
                    </h1>
                    <p className="text-slate-300 text-[20px]">Manage your files securely and efficiently</p>
                  </div>
                  {user && (
                    <div className='flex items-center gap-5 ml-8'>
                      <div className='flex flex-col gap-1 text-right'>
                        <div className='text-white text-2xl font-bold'>{user?.name || 'User'}</div>
                        <div className='text-slate-400 text-lg'>{user?.email || ''}</div>
                      </div>
                      <div className='w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 shadow-2xl border-2 border-slate-500'>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    </div>
                  )}
                </header>
                {/* Add your main content here */}
                <div className='relative'>
                  <Search className='w-7 h-7 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 z-10 font-medium' />
                  
                <input className='w-full h-16 rounded-2xl border border-slate-400/30 px-16 py-8 bg-slate-700/50 backdrop-blur-sm shadow-2xl placeholder-slate-400 text-slate-400 text-[20px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200' placeholder='Search for files and folders..'></input>
                </div>
                <div className='w-full mx-h-xl bg-gradient-to-r from-rose-500/80 to-pink-500/80 mt-8 rounded-2xl px-8 py-8 flex items-center gap-5 justify-between'>
                  <div className="w-45 h-45 rounded-full bg-rose-50/90 shadow-2xl border-2 border-slate-500 flex items-center justify-center ml-8">
                
                  </div>
                  <HardDrive className='w-25 h-25 text-white mr-10'/>
                </div>
                <div className='grid grid-cols-3 gap-8 mt-8'>
                  {storageItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <StorageDisplay key={item.id} storage={item.storage} icon={item.icon} section={item.section} color={item.color} />
                    );
                  })}
                </div>
                <div className='mt-10 w-full bg-slate-700/50 backdrop-blur-sm shadow-2xl border border-slate-400/30 rounded-2xl px-8 py-8'>
                  <div className='flex gap-5 items-center'>
                    <Clock className='w-10 h-10 text-cyan-400'/>
                    <h2 className=' text-2xl text-white font-medium'>Recent Files</h2>
                  </div>
                 
                </div>
                <div className='h-32'></div>
              </div>
            </main>
          </div>
        </div>
      )}
</>
  )
}

export default Vault

