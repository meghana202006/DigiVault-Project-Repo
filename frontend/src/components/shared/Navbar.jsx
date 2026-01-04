import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck , ArrowLeftCircle} from 'lucide-react';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const path = location.pathname;

    const PAGE_TITLES = {
        "/":"DigiVault",
        "/login":"DigiVault Access Portal",
        "/register":"DigiVault Registration Portal",
        "/verify-otp":"DigiVault Verification Portal"

    }
    const heading = PAGE_TITLES[path]

  return (
    <div className="flex gap-3 items-center h-25 sticky top-2 z-50 w-full  bg-gray-300/20 backdrop-blur-sm shadow-2xl border border-gray-400 rounded-md px-15">
          <ShieldCheck className="text-sky-500 h-15 w-15" />
          <h1 className="text-white font-bold text-[30px]">{heading}</h1>
          <div className="ml-auto flex gap-5">
            { path === '/' && (
                <>
            <div
              className="w-32 h-15 border-4 border-cyan-400 shadow-2xl rounded-3xl flex items-center justify-center cursor-pointer text-cyan-400 font-semibold text-[20px] p-2 relative overflow-hidden group transition-all duration-300 ease-out hover:scale-110 active:scale-95 hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] animate-pulse-slow"
              onClick={() => navigate("/login")}
            >
              {/* Glow effect overlay */}
              <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <span className="relative z-10">Login</span>
            </div>
            <div
              className="w-32 h-15 bg-cyan-400 shadow-2xl rounded-3xl flex items-center justify-center cursor-pointer text-white font-semibold text-[20px] p-2 hover:bg-cyan-300 hover:text-slate-800 transition-all ease-out hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]"
              onClick={() => navigate("/register")}
            >
              Sign up
            </div>
          </>
            )}
            { path === '/login' && (
                <>
                    <button className="flex w-100 h-20 items-center justify-center gap-2 ml-auto cursor-pointer" onClick={()=>navigate('/')}>
                    <ArrowLeftCircle className="h-10 w-10 text-cyan-400"/>
                    <span className="text-cyan-400 font-semibold text-[22px]">Back to Home</span>
                    </button>
                </>
            )}  
            {
                path === '/register' && (
                    <>
                        <button className="flex w-100 h-20 items-center justify-center gap-2 ml-auto cursor-pointer" onClick={()=>navigate('/')}>
                        <ArrowLeftCircle className="h-10 w-10 text-cyan-400"/>
                        <span className="text-cyan-400 font-semibold text-[22px]">Back to Home</span>
                        </button>
                    </>
                )
            }
            {
              path === '/verify-otp' && (
                 <>
                        <button className="flex w-100 h-20 items-center justify-center gap-2 ml-auto cursor-pointer" onClick={()=>navigate('/')}>
                        <ArrowLeftCircle className="h-10 w-10 text-cyan-400"/>
                        <span className="text-cyan-400 font-semibold text-[22px]">Back to Home</span>
                        </button>
                    </>
              )
            }
            
        </div>
        </div>
  )
}

export default Navbar
