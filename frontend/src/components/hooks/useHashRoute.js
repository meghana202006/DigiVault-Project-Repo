import React from 'react'
import { useEffect , useState } from 'react'

function useHashRoute() {
    const [step , setStep] = useState(null)
    const [isOpen , setIsOpen] = useState(false)

    useEffect(()=>{
        const handleHash = ()=>{
            const hash = window.location.hash;
            const routes = {
                "#forgot-password" :'forgot-password',
                "#verify-identity":"verify",
                "#reset-password":"reset-password",
                "#success":"success",
                
            }
            if(routes[hash]){
                setStep(routes[hash])
                setIsOpen(true)
            }else{
                setIsOpen(false)
                setStep(null)
            }
        }
        window.addEventListener('hashchange',handleHash)
        handleHash()
        return ()=> window.removeEventListener('hashchange',handleHash)
    },[])
    const navigation = (hash)=>{ window.location.hash = hash}
    const close = ()=>{ window.location.hash = ''}
  return { isOpen , step , navigation , close}
}

export {useHashRoute}
