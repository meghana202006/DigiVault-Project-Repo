import React, { useEffect, useState } from "react";
import {loginStyles as styles}  from "../styles/tailwindClasses";
import Navbar from "./Navbar";
import {Mail , Lock ,ShieldCheck, ArrowLeftCircle , AlertCircle , Eye , EyeOff} from 'lucide-react'


import { FaArrowRight} from 'react-icons/fa';
import axios from "axios"
import OTPForm from "./OTPForm";
import { useNavigate } from "react-router-dom";
function Login() {
    const [formData , setFormData] = useState({
        email:"",
        password:"",
        
    });
    const navigate = useNavigate()
    // console.log(formData)
    const [authStep , setAuthStep] = useState('login')
    const [error , setError] = useState('')
    const [isLoading , setIsLoading] = useState(false)
    const [loadingProgress , setLoadingProgress] = useState(0)
    const [dots , setDots] = useState("")
    const [showPassword,setShowPassword] = useState(false)
    const handleChange =(e)=>{
        const {name , value} = e.target;
         setFormData((prevData) => ({
         ...prevData,   // keep existing values
         [name]: value  // update only the changed field
  }));
        setError('');
        
    }

    useEffect(()=>{
      if(!isLoading)
      {
        setDots("")
        return;
      }

      const dotInterval = setInterval(()=>{
          setDots((prev) => prev.length <= 6 ? prev +" .":"")
      },200)
      return () => clearInterval(dotInterval)
    },[isLoading])
        useEffect(() => {
              if (authStep === 'otp') {
              alert('Login successful! OTP sent to your email.');
          }
          }, [authStep]);
          
    const onSubmit =async(e)=>{
        e.preventDefault();
        if(!formData.email || !formData.password)
        {
            setError('Please fill all fields')
            return
        }
        
        setIsLoading(true)
        setLoadingProgress(0)
        const progressInterval = setInterval(()=>{
            setLoadingProgress((prev)=>{
                if(prev >= 90)
                {
                  clearInterval(progressInterval)
                  return 90;
                }
                return prev + 10
            })
        },80)
        try{
          const res = await axios.post("http://localhost:5000/api/users/login",
            formData
          )
          setFormData({email:"",password:""})
          setTimeout(() => {
            clearInterval(progressInterval)
            setLoadingProgress(100)
              setTimeout(()=>{
                  setIsLoading(false)
                  setLoadingProgress(0)
                  setAuthStep('otp')
                  
              },100)
          },200);
          
      
        } 
        catch(err){
           
           setTimeout(()=>{
               clearInterval(progressInterval)
               setLoadingProgress(100)

               setTimeout(() => {
                 setIsLoading(false)
                 setLoadingProgress(0)
                 setAuthStep('login')
                 alert(err.response.data.message)
               },300);
           },600)
          
        
    }
          
           
         
        
       
    }
  return (
  <>
  
  {/* <div className="relative min-h-screen w-full">
    <div className="fixed inset-0 -z-10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute -top-5 -right-10 w-90 h-90 bg-blue-500/40 rounded-full blur-3xl animate-pulse"></div>
       <div className="absolute top-1/2 -left-50 w-100 h-100 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 right-1/5 w-90 h-90 bg-cyan-500/30 rounded-full blur-3xl animate-pulse delay-500"></div>
    </div>
      <div className="relative z-10 flex flex-col p-6">
       <Navbar/> */}
    { authStep === "login"?(<div className="flex flex-col items-center justify-center">
        <div className={`w-130 relative bg-slate-700/10 backdrop-blur-md rounded-md p-10 shadow-2xl border border-slate-400 overflow-hidden mb-20 mt-20`}>
        {isLoading && (
            
              <div
                className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-300 ease-out z-50"
                style={{ width: `${loadingProgress}%` }}
              />
              
        )}
        
          
         
        <h2 className="text-[35px] font-medium mb-3 text-white">Welcome Back</h2>
        <p className="text-gray-400 mb-3 text-[18px]">Sign in to securely access your DigiVault account</p>
        <hr className="border-gray-400 my-4"/>
        <div className="mt-3">
          <label for="usr" className={styles.labelBase}>
            Email Id
          </label>
          <div className="relative mb-8">
          <Mail className="absolute left-3 top-7 text-slate-400" />
          <input id="usr" name='email'placeholder="Enter email id"className={styles.inputField} onChange={handleChange} value={formData.email}></input>
        </div>
          <label for="pwd" className={styles.labelBase}>
            Password
          </label>
          <div className="relative mb-10">
          <Lock className="absolute left-3 top-7 text-slate-400" />
          <input id="pwd" name='password' placeholder="Enter password" className={styles.inputField} onChange={handleChange} value={formData.password} type={showPassword?"text":"password"}></input>
          <button className="absolute top-7.5 right-6 text-slate-400 cursor-pointer" onClick={()=>setShowPassword(!showPassword)}>
            {showPassword?<Eye/>:<EyeOff/>}
          </button>
          </div>
          {error && (
            <div className="w-full h-14 bg-red-500/10 border border-red-500/50 rounded-md p-4 mt-6 flex gap-2 items-center">
              <AlertCircle className="text-red-400"/>
              <p className="text-red-400">{error}</p>
            </div>
          )}
          <button disabled={isLoading} className={`w-full h-14 flex items-center justify-center gap-2 text-white mb-4 rounded-md p-2 mt-10 text-[17px] shadow-2xl mx-auto ${isLoading ? "bg-gray-600 cursor-not-allowed":" bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500 hover:bg-amber-500 hover:text-slate-800"}`} onClick={onSubmit}>
            <span className="font-semibold text-[18px]">Continue to Verification</span>
            <FaArrowRight/>
          </button>
          {isLoading && (
            <div className="mt-4 flex mx-auto">
              <p className="text-slate-200 text-[18px] font-semibold block mx-auto">Authenticating
              <span className="text-white font-bold text-[18px] inline-block w-10 text-left">
                {dots}
              </span>
              </p>
              
            </div>
          )}
          <div className="flex justify-center mx-auto gap-2 mt-10">
            <p className="text-slate-400 text-[18px]">Don't have an account?</p>
            <button className="text-cyan-500 font-semibold text-[18px] cursor-pointer" onClick={()=>navigate('/register')}>Sign up here</button>
          </div>
          </div>
      </div>
      </div>
      
    ):(<OTPForm formData={formData} onAuthChange={setAuthStep}/>)}
      {/* </div>
    </div> */}
    
    </>

  );
}

export default Login;
