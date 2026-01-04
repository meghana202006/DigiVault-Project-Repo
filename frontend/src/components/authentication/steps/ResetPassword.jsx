import React, { useState, useMemo, useEffect } from 'react'
import useAuthLoader  from '../../hooks/useAuthLoader';
import {Lock} from 'lucide-react'
import { resetpwdStyles as styles } from '../../../styles/tailwindClasses';
import RuleItem from '../../shared/RuleItem';
import { Eye, EyeOff } from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";
import ModalContainer from '../../shared/ModalContainer';
import Toast from '../../shared/Toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function ResetPassword({ email, otp , onNext  }) {
  const [formData , setFormData] = useState({
    newPassword:"",
    confirmPassword:""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);
  const loader = useAuthLoader();
  const navigate = useNavigate();

  // Clear messages when component mounts
  useEffect(() => {
    setError("");
    setSuccess("");
  }, []);
  
  const handleChange = (e) =>{
    setToast(null);
      const {name , value} = e.target;
      setFormData((prevData)=>({
          ...prevData,
          [name]:value
      }))
      setError("");
  }

  const passwordRules = useMemo(() => {
    const password = formData.newPassword;
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [formData.newPassword]);

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.newPassword || !formData.confirmPassword) {
      setToast({ message: "All fields are required", type: "error" });
      return;
    }

    if (!isPasswordValid) {
      setToast({ message: "Password does not meet all requirements", type: "error" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }

    if (!otp) {
      setToast({ message: "OTP is missing. Please verify OTP again.", type: "error" });
      return;
    }

    try {
      loader.start();
      const res = await axios.post("http://localhost:5000/api/users/resetPassword", {
        email: email,
        otp: otp,
        password: formData.newPassword
      });

      if (res.status === 200) {
        setError(""); // Clear any previous errors
        // Wait a moment for progress to complete, then stop and show success
        setTimeout(() => {
          loader.stop(); // Complete progress animation
          setToast({ message: "Password reset successful!", type: "success" });
          // Wait a bit before navigating to show success message
          setTimeout(() => {
            onNext();
          }, 1000);
        }, 500);
      }
    } catch (err) {
      setSuccess(""); // Clear any previous success messages
      // Wait a moment for progress to show, then stop on error
      setTimeout(() => {
        loader.stop();
        setToast({message: err.response?.data?.message || "Failed to reset password. Please try again.", type: "error"});
      }, 500);
    }
  }

  return (
    <>
    {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    <ModalContainer 
      maxWidth="xl" 
      padding="lg" 
      loader={loader}
      showCloseButton={false}
      onClose={() => window.location.hash = ""}
    >
      <button
        className="flex items-center justify-center gap-2 cursor-pointer mb-4"
        onClick={() => window.location.hash = "#verify-identity"}
      >
        <FaArrowLeft className="text-gray-300" />
        <span className="text-gray-300 text-[18px]">Back to OTP verification</span>
      </button>
      <div className='relative flex items-center gap-3 mb-4'>
        <Lock className='w-10 h-10 text-cyan-400'/>
        <h2 className='text-3xl font-medium text-white'>New Password</h2>
      </div>
      <p className='text-[20px] text-slate-400 mb-4'>Create a strong password for your account</p>
      <hr className='border-gray-400 my-4'/>
      
      <label className={styles.labelBase}>New password</label>
      <div className='relative mb-2'>
        <Lock className='absolute left-3 top-7 text-slate-400'/>
        <input 
          className={styles.inputField} 
          name="newPassword"
          placeholder='Enter new password' 
          value={formData.newPassword}
          onChange={handleChange} 
          type={showPassword ? "text" : "password"}
        />
        <button
          className="absolute right-3 top-5 translate-y-2 text-slate-400 cursor-pointer mr-2"
          onClick={() => setShowPassword(!showPassword)}  type="button" 
        >
         {showPassword?<Eye/>:<EyeOff/>}
        </button>
      </div>

      <label className={styles.labelBase}>Confirm password</label>
      <div className='relative mb-2'>
        <Lock className='absolute left-3 top-7 text-slate-400'/>
        <input 
          className={styles.inputField} 
          name="confirmPassword"
          placeholder='Confirm new password' 
          value={formData.confirmPassword}
          onChange={handleChange}
          type={showConfirmPassword ? "text" : "password"}
        />
        <button
          className="absolute right-3 top-5 translate-y-2 text-slate-400 cursor-pointer mr-2"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}  type="button" 
        >
         {showConfirmPassword?<Eye/>:<EyeOff/>}
        </button>
      </div>
      {/* Password Rules - Always Visible */}
      <div className='p-4 mb-3 mt-5 bg-slate-700/30 rounded-md border border-slate-400/50'>
        <p className='text-slate-400 text-[18px] font-medium mb-3'>Password must contain:</p>
        <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
          <div className='min-w-0'>
            <RuleItem
              fullfilled={passwordRules.minLength}
              text="At least 8 characters"
            />
          </div>
          <div className='min-w-0'>
            <RuleItem
              fullfilled={passwordRules.hasUpperCase}
              text="One uppercase letter (A-Z)"
            />
          </div>
          <div className='min-w-0'>
            <RuleItem
              fullfilled={passwordRules.hasLowerCase}
              text="One lowercase letter (a-z)"
            />
          </div>
          <div className='min-w-0'>
            <RuleItem
              fullfilled={passwordRules.hasNumber}
              text="One number (0-9)"
            />
          </div>
          <div className='col-span-2 min-w-0'>
            <RuleItem
              fullfilled={passwordRules.hasSpecialChar}
              text="One special character (!@#$%^&*)"
            />
          </div>
        </div>
      </div>
      {error && (
        <div className="w-full bg-red-500/10 border border-red-500/50 p-3 mb-3 mt-5 flex gap-2 items-center rounded-md">
          <p className="text-red-400 text-md">{error}</p>
        </div>
      )}
      {success && (
        <div className="w-full bg-green-500/10 border border-green-500/50 p-3 mb-4 flex gap-2 items-center rounded-md">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}
      <button 
        className='w-full h-12 rounded-md bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500 mt-5 mb-3 text-white font-semibold text-[20px] p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
        onClick={handleResetPassword}
        disabled={loader.isLoading || !isPasswordValid}
      >
        Reset Password
      </button>
    </ModalContainer>
    </>
  )
}

export default ResetPassword;
