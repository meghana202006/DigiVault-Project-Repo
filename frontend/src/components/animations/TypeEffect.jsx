import React, { useState , useEffect} from 'react'

function TypeEffect({text , typeSpeed}) {
    const [displayedText , setDisplayedText] = useState("")
    const [index , setIndex] = useState(0)
    
    useEffect(()=>{
        if(index < text.length)
        {
           const timeout = setTimeout(() => {
              setDisplayedText((prev)=> prev + text.charAt(index))
              setIndex((prev)=> prev + 1)
           },typeSpeed);
           return ()=>clearTimeout(timeout)
        }

    
  },[index , text , typeSpeed])
  return (
    <span className="relative">
      {/* The Text */}
      <span className="whitespace-pre-wrap">{displayedText}</span>
      
      {/* The Cursor 
          - inline-block: allows us to give it width/height while staying in line
          - align-middle: keeps it centered with the text height
      */}
      <span 
        className="inline-block w-[2px] h-[1em] bg-white ml-1 animate-pulse align-middle"
      ></span>
    </span>
  )
}

export default TypeEffect
