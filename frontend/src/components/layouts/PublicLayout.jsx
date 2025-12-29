import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../Navbar';

function PublicLayout() {
    const location = useLocation();
    const path = location.pathname;
  return (
   <div className="relative min-h-screen w-full">
      <div className="fixed inset-0 -z-10 bg-linear-to-br from-slate-900 via-slate-800 to-blue-900">
        { path !== '/' && (
            <>
            <div className="absolute -top-5 -right-10 w-90 h-90 bg-blue-500/40 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 -left-50 w-100 h-100 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute -bottom-20 right-1/5 w-90 h-90 bg-cyan-500/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        </>
        )}
      </div>
      <div className="relative z-10 flex flex-col p-4">
        <Navbar/>
        <Outlet/>
    </div>
    </div>
  )
}

export default PublicLayout
