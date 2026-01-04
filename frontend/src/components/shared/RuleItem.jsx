import React from 'react'

function RuleItem({text , fullfilled}) {
  return (
    <div className='flex items-start gap-2.5 transition-all duration-300'>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 border mt-1.5 flex-shrink-0 ${fullfilled?'bg-cyan-400 border-transparent':'bg-transparent border-slate-300'}`}
        ></div>
        <span className={`text-[16px] leading-relaxed transition-colors duration-300 break-words ${fullfilled?'text-green-400':'text-slate-300'}`}>{text}</span>
    </div>
  )
}

export default RuleItem
