import React, { useMemo, useState } from 'react'
import {useNavigate} from 'react-router-dom'
import axios from 'axios'

import { ShieldCheck , UserPlus , ArrowLeftCircle , User , MailIcon, Lock , AlertCircle , Eye , EyeOff} from 'lucide-react'
import { loginStyles as styles } from '../styles/tailwindClasses'
import RuleItem from './RuleItem'
import Navbar from './Navbar'

function Register() {
  const initialState = {
    username:"",
    email:"",
    password:"",
    confirmPassword:""
   }
  const [profileData , setProfileData] = useState(initialState)
  const [showPassword , setShowPassword] = useState(false)
  const [showConfirmPassword , setShowConfirmPassword] = useState(false)
  const [focusPassword , setFocusPassword] = useState(false)
   const navigate = useNavigate()
   
  const [error , setError] = useState("")
  const handleChange = (e)=>{
      const {name , value} = e.target
      setError("")
      setProfileData((prevData)=>({
          ...prevData,
          [name]: value
  }))
  
  }
  const passwordRules = useMemo(()=>{
    const password = profileData.password
    return{
      minLength : password.length >= 8,
      hasUpperCase:/[A-Z]/.test(password),
      hasLowerCase:/[a-z]/.test(password),
      hasNumber:/[0-9]/.test(password),
      hasSpecialChar:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
  },[profileData.password])
  const isPasswordValid = Object.values(passwordRules).every(Boolean)
  const handleFocus = ()=>{
      setFocusPassword(true)
  }
  const validateForm = async(e) =>{
      e.preventDefault()
      if(!profileData.username || !profileData.email || !profileData.password || !profileData.confirmPassword)
     {
       setError("All fields are required")
       return
     }
     if(!isPasswordValid)
     {
      setError("Password does not meet all requirement")
      return
     }
     if(profileData.password !== profileData.confirmPassword)
     {
      setError("Passwords do not match")
      return
     }
     try{
        const res = await axios.post("http://localhost:5000/api/users/register",
        profileData
        )
        console.log(res.data.message)
        setProfileData(initialState)
        setTimeout(()=>{
          navigate('/login')
        },500)
        alert(res.data.message)
     }catch(err)
     {
      alert(err.response.data.message)
     }
     
  }
 
  return (
  <>
    
    <div className='flex justify-center items-center'>
      <div className='w-160 max-h-7xl flex flex-col items-center  bg-slate-800/10 backdrop-blur-xl shadow-2xl rounded-md border border-amber-50 mt-10 p-10'>
        <div className='bg-linear-to-br from-cyan-500 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center border border-cyan-400 mx-auto'>
        <UserPlus className='text-white w-10 h-10'/>
        </div>
        <h2 className='text-white font-bold text-3xl mt-5'>Create Account</h2>
        <p className='text-slate-300 text-[19px] font-semibold mt-2 mb-3'>Create your account to securely access DigiVault.</p>
        <div className='h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent mt-3'></div>
        { error && (
          <div className='h-14 w-full rounded-md border border-red-500 bg-red-400/20 backdrop-blur-2xl mt-5 flex items-center gap-5'>
            <AlertCircle className='text-red-400 ml-3 text-[18px]'/>
            <span className='text-red-400 font-semibold text-[18px]'>{error}</span>
          </div>
        )

        }
      <form className='w-full h-full'>
        <div className='relative'>
        <label className={styles.labelBase}>Username</label>
        <User className='absolute top-14 left-4 text-slate-400'/>
        <input className={styles.inputField} placeholder="Enter the username" name="username" value={profileData.username} onChange={handleChange}/>
        </div>
        <div className='relative'>
        <label className={styles.labelBase}>Email Id</label>
        <MailIcon className='absolute top-15 left-3 text-slate-400'/>
        <input className={styles.inputField} placeholder='Enter Email Id' name="email" value={profileData.email} onChange={handleChange}/>
        </div>
        <div className='relative'>
        <label className={styles.labelBase}>Password</label>
        <Lock className='absolute top-15 left-3 text-slate-400'/>
        <button className='absolute right-3 top-1/2 translate-y-2 text-slate-400 cursor-pointer mr-2' onClick={()=>setShowPassword(!showPassword)}>
          {showPassword? <Eye className='w-5 h-5'/> : <EyeOff className='w-5 h-5'/>}
        </button>
        <input className={styles.inputField} placeholder='Enter the password' name="password" value={profileData.password} onChange={handleChange} onFocus={handleFocus} type={showPassword?'text':'password'}/>
        </div>
        {focusPassword && profileData.password && (
          <div className='flex flex-col w-full mb-5 mt-5 p-5 gap-2 bg-slate-900/20 backdrop-blur-sm rounded-md border border-slate-300'>
            <p className='text-gray-300 font-medium text-[18px]'>Password must contain:</p>
            <RuleItem fullfilled={passwordRules.minLength} text='Atleast 8 characters'/>
            <RuleItem fullfilled={passwordRules.hasUpperCase} text='One uppercase letter (A-Z)'/>
            <RuleItem fullfilled={passwordRules.hasLowerCase} text='One lowercase letter (a-z)'/>
            <RuleItem fullfilled={passwordRules.hasNumber} text='One number (0-9)'/>
            <RuleItem fullfilled={passwordRules.hasSpecialChar} text='One special character (!@#$%^&*)'/>
          </div>
        )}
        <div className='relative'>        
        <label className={styles.labelBase}>Confirm Password</label>
        <Lock className='absolute top-15 left-3 text-slate-400'/>
        <input className={styles.inputField} placeholder='Confirm you password' name="confirmPassword" value={profileData.confirmPassword}  onChange={handleChange} type={showConfirmPassword?'text':'password'}/>
        <button className='absolute right-3 top-1/2 translate-y-2 text-slate-400 mr-3 cursor-pointer' onClick={()=>setShowConfirmPassword(!showConfirmPassword)}>
          {showConfirmPassword? <Eye className='w-5 h-5'/> : <EyeOff className='w-5 h-5'/>}
        </button>
        </div>
      <button className='w-full h-12 rounded-md bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500 mt-10 mb-10 text-white font-semibold text-[20px] p-2 cursor-pointer' type="submit" onClick={validateForm}>Sign up</button>        
      <div className='flex justify-center gap-2'>
      <p className='text-slate-300 text-[18px]'>Already have an account?</p>
      <button className='text-cyan-400 font-semibold text-[18px] cursor-pointer'onClick={()=> navigate('/login')}>Sign in</button>
      </div>
      </form>
      
    </div>
  </div>
    
   </> 
  )
}

export default Register
