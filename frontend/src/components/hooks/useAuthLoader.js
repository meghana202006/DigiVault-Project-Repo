import React, { useEffect, useState , useRef } from 'react'

function useAuthLoader() {
    const [isLoading , setIsLoading] = useState(false)
    const [ progress , setProgress] = useState(0)
    const [dots , setDots] = useState('')
    const progressRef = useRef(null)
    const dotsRef = useRef(null)

    useEffect(()=>{
        if(isLoading)
        {   progressRef.current = setInterval(()=>{
            setProgress((p) =>{
                if(p < 60) return p + 15;
                if(p < 90) return p + 12;
                if(p < 95) return p + 5;
                return p;
            })
            },100)
            dotsRef.current= setInterval(()=>{
            setDots((prev)=> prev.length <= 6 ? prev+" .":"")
            },200)
        }else{
            if(progressRef.current) clearInterval(progressRef.current)
            if(dotsRef.current) clearInterval(dotsRef.current)
        }
        
        return ()=> {
                if(progressRef.current) clearInterval(progressRef.current)
                if(dotsRef.current) clearInterval(dotsRef.current)
        }
            

    },[isLoading])


    const start = ()=>{
        setIsLoading(true)
        setDots("")
        setProgress(0)
    }
    const stop = () =>{
        // Clear intervals immediately so they don't keep updating state
        if (progressRef.current) clearInterval(progressRef.current);
        if (dotsRef.current) clearInterval(dotsRef.current);
        setProgress(100)
        setTimeout(() => {
            setIsLoading(false)
            setProgress(0)
        }, 40);
    }
  return {
        isLoading,
        progress,
        start,
        stop,
        dots
  }
}

export default useAuthLoader;

