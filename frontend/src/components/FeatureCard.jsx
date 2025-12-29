import React from 'react'
import {UserCheck} from 'lucide-react';
import { KeyRound } from 'lucide-react';

function FeatureCard({title , description , icon}) {
    
    console.log(icon)
    
  return (
    <>
    <div className="w-95 h-100 p-6 bg-slate-900/20 backdrop-blur-lg shadow-2xl rounded-2xl border border-gray-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all ease-out hover:scale-110 active:scale-50 cursor-pointer">
        <div className='text-center'>
            <div className='w-15 h-15 p-2 rounded-2xl bg-cyan-500/20 flex items-center justify-center'>
                {icon}
            </div>
            <h2 className='text-white text-[22px] font-semibold mt-4'>{title}</h2>
            <p className='mt-8 text-gray-300 text-justify text-[19px] mb-3'>{description}</p>
        </div>
    </div>
    </>
  );  
}

export default FeatureCard
