import React from 'react'

function RuleItem({text , fullfilled}) {
    console.log(fullfilled)
  return (
    <div className='flex items-center gap-3 transition-all duration-300'>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 border ${fullfilled?'bg-cyan-400 border-transparent':'bg-transparent border-slate-300'}`}
        ></div>
        <span className={`text-[18px] transition-colors duration-300  ${fullfilled?'text-green-400':'text-slate-300'}`}>{text}</span>
    </div>
  )
}

export default RuleItem
