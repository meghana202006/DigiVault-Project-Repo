import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios"

function OTPForm({formData , onAuthChange}) {
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [timeLeft , setTimeLeft] = useState(60)
  const [canResend , setCanResend] = useState(false)
  useEffect(()=>{
    if(timeLeft === 0)
    {
        setCanResend(true)
        return;
    }
    const timer = setInterval(()=>{
        setTimeLeft((prev)=> prev - 1)
    },1000)
    return ()=>clearInterval(timer)
  },[timeLeft])
  const verifyOTP = async(newotp)=>{
    try{
       const res = await axios.post("http://localhost:5000/api/users/verifyOTP",
      {
        email:formData.email,
        otp:newotp
      }
    )
      console.log(res.data.message)
      alert(res.data.message)
    }catch(err)
    {
      console.log(err.response.data.message)
      alert(err.response.data.message)
    }
   
  }
  const handleOtpChange = (index , value) =>{
      const newotp = [...otp]
      newotp[index] = value
      setOTP(newotp)
      console.log(newotp)
      if( value && index < 5)
      {

        otpRefs.current[index + 1]?.focus()
      }
      if(newotp.every((digit)=> digit !== '') &&  index === 5){
          verifyOTP(newotp.join(''))
      }
  }
  const handleOtpKeyDown =(index , e)=>{
      if(e.key === 'Backspace' && !otp[index] && index > 0)
      {
        otpRefs.current[index - 1]?.focus()
      }
  }
  const handleOtpPaste = (e) =>{
      const pastedOTP = e.clipboardData.getData('text').slice(0,6)
      console.log(e.clipboardData)
      const newotp = [...otp]
      pastedOTP.split('').forEach((digit , idx)=>{
        if(idx < 6 ) newotp[idx] = digit
      })
      setOTP(newotp)
      console.log(pastedOTP)
      if(newotp.every((digit) => digit !== '')){
          verifyOTP(newotp.join(''))
      }

  }
  const resendOTP = async()=>{
    setTimeLeft(60)
    setCanResend(false)
    try{
      const res = await axios.post("http://localhost:5000/api/users/resendOTP",
      { email : formData.email}
      )
    alert(res.data.message)
    }catch(err){
        console.log(err.response.data.message)
        alert(err.response.data.message)
    }
    

  }
  return (
    <>
    <div className="flex justify-center mt-40 mb-50">
      <div className="max-w-2xl max-h-2xl bg-gray-500/10 backdrop-blur-lg rounded-md p-14 shadow-2xl border border-gray-300">
        <button className="flex items-center justify-center gap-2 cursor-pointer" onClick={()=> onAuthChange('login')}>
          <FaArrowLeft className="text-gray-300" />
          <span className="text-gray-300">Back to login</span>
        </button>
        <h2 className="text-3xl text-white font-semibold mt-5">
          Verify Your Identity
        </h2>
        <hr className="text-gray-300 h-1 mt-4" />
        <p className="text-slate-300 mt-4 text-[18px]">
          Enter the 6-digit code sent to <span className="text-white inline">{formData.email}</span>
        </p>
      
      <div className="flex gap-4">
      
        {otp.map((digit, index) => (
          <input
            key={index}
            value={digit}
            maxLength={1}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            ref={(el) => (otpRefs.current[index] = el)}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => {
              handleOtpKeyDown(index, e);
            }}
            onPaste={handleOtpPaste}
            className="w-17 h-17 bg-slate-800 border border-gray-300 rounded-2xl px-6 text-white text-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-cyan-300 focus:border-transparent transition mt-10"
          ></input>
        ))}
        
      </div>
      <div className="flex flex-col mx-auto">
      { !canResend ? (
        <p className="text-gray-400 mt-5 block mx-auto text-[18px]">Request new OTP in :<span className="text-white font-semibold ml-2">{timeLeft}s</span></p>
      ):(
        <>
        <p className="text-gray-400 mt-5 block mx-auto">Didn't receive the code?</p>
        <button className="text-cyan-500 font-semibold text-[17px] mt-3 cursor-pointer" onClick={resendOTP}>Resend Code</button>
        </>
      )}
      
      </div>
      </div>
      </div>
    </>
  );
}

export default OTPForm;
