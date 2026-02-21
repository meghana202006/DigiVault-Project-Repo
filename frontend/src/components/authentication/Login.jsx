import React, { useEffect, useState } from "react";
import { loginStyles as styles } from "../../styles/tailwindClasses";
import Navbar from "../shared/Navbar";
import useAuthLoader from "../hooks/useAuthLoader";
import {useNavigate} from "react-router-dom";
import { deriveAndStoreMasterKey } from "../../utils/megaHelpers/dbStorage";
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowLeftCircle,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { useHashRoute } from "../hooks/useHashRoute";

import { FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { getApiBaseURL } from "../../utils/axiosInstance";
import Toast from "../shared/Toast";



// import VerifyOtp from "./VerifyOtp";
function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const loader = useAuthLoader();
 
  const [showPassword, setShowPassword] = useState(false);
  const [error , setError] = useState('');
  const [toast, setToast] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  if (!formData.email) {
    setEmailError('');
    setIsEmailValid(false);
    return;
  }

  const handler = setTimeout(() => {
    const email = formData.email.trim().toLowerCase();
    if (!email.includes('@')) return;

    const [username, domain] = email.split('@');

    // 1. Gmail Domain Check
    const isGmail = domain === 'gmail.com';

    // 2. Character Check (The fix for user_name)
    // This regex ONLY allows lowercase letters, numbers, and dots.
    const validCharsRegex = /^[a-z0-9.]+$/;
    const hasForbiddenChars = !validCharsRegex.test(username);

    // 3. Gmail Dot Rules
    const hasInvalidDots = 
      username.startsWith('.') || 
      username.endsWith('.') || 
      username.includes('..');

    // 4. Length Check (excluding dots)
    const cleanUsername = username.replace(/\./g, '');
    const isValidLength = cleanUsername.length >= 6 && cleanUsername.length <= 30;

    const isFullyValid = isGmail && !hasForbiddenChars && !hasInvalidDots && isValidLength;

    setIsEmailValid(isFullyValid);

    // --- Specific Error Messaging ---
    if (!isGmail) {
      setEmailError('Please use a @gmail.com address');
    } else if (hasForbiddenChars) {
      // This catches underscores, dashes, etc.
      setEmailError('Gmail usernames only allow letters, numbers, and dots');
    } else if (hasInvalidDots) {
      setEmailError('Invalid placement of dots');
    } else if (cleanUsername.length < 6) {
      setEmailError('Username must be at least 6 characters');
    } else {
      setEmailError('');
    }
  }, 400);

  return () => clearTimeout(handler);
}, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData, // keep existing values
      [name]: value, // update only the changed field
    }));
    setError("");
    
    
  };

  const clearFormData = () => {
    setFormData({
      email: "",
      password: "",
    });
    setError("");
    setEmailError("");
    setIsEmailValid(false);
    setToast(null);
  };

  const handleResetPassword = () => {
    clearFormData();
    window.location.hash = "#forgot-password";
  };

  const handleSignUp = () => {
    clearFormData();
    navigate("/register");
  };

 const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !loader.isLoading) {
    e.preventDefault();
    onSubmit(e);
  }
 };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setToast({ message: "Please fill all fields", type: "error" });
      return;
    }
    
    // Validate email format before submission
   if (!isEmailValid) {
    setToast({ 
      message: emailError || "Please enter a valid Gmail address", 
      type: "error" 
    });
    return; 
  }

    try {
      loader.start();
      const res = await axios.post(
        `${getApiBaseURL()}/users/login`,
        formData,
        { withCredentials: true }
      );

      if (res.status === 200) {
        // Check if OTP is required
        // If requireOTP is explicitly false, skip OTP; otherwise require it
        if (res.data.requireOTP === false && res.data.token) {
          // Valid refresh token exists - skip OTP and go directly to filemanager
          // Store access token if needed
          // Check if the salt is recieved from server
          if (!res.data.salt) {
          throw new Error("Security data (salt) is missing from server response.");
          }
          if (res.data.token) {
            // You can store token in localStorage or context if needed
            localStorage.setItem('accessToken', res.data.token);
          }
          const saltBuffer = new Uint8Array(res.data.salt);
          await deriveAndStoreMasterKey(formData.password, saltBuffer)
          .then(()=>{
            console.log('Master key stored successfully');
          }).catch((error)=>{
            console.error('Error storing master key:', error);
            setToast({ message: "Failed to store master key", type: "error" });
          });
          setToast({ message: "Login successful!", type: "success" });
          setTimeout(() => {
            navigate('/vault', { replace: true });
          }, 1000);
        } else {
          // OTP required - proceed to OTP verification step
          onLoginSuccess(formData.email);
        }
      } else {
        setToast({ message: "Invalid Credentials", type: "error" });
      }
    } catch (err) {
      console.log(err);
      setToast({ 
        message: err.response?.data?.message || "Login failed. Please try again.", 
        type: "error" 
      });
    } finally {
      loader.stop();
    }
  };
  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-col items-center justify-center">
        <div
          className={`w-150 relative bg-slate-700/10 backdrop-blur-md rounded-md p-12 shadow-2xl border border-slate-400 overflow-hidden mb-20 mt-20`}
        >
          {loader.isLoading && (
            <div
              className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-500 via-cyan-400 to-blue-500 transition: width 0.4s ease-out z-50"
              style={{ width: `${loader.progress}%` }}
            />
          )}

          <h2 className="text-[35px] font-medium mb-3 text-white">
            Welcome Back
          </h2>
          <p className="text-gray-400 mb-3 text-[18px]">
            Sign in to securely access your DigiVault account
          </p>
          <hr className="border-gray-400 my-4" />
          <form onSubmit={onSubmit} className="mt-3">
            <label for="usr" className={styles.labelBase}>
              Email Id
            </label>
            <div className="relative mb-8">
              <Mail className={`absolute left-3 top-7 ${
                emailError ? 'text-red-400' : isEmailValid ? 'text-green-400' : 'text-slate-400'
              }`} />
              <input
                id="usr"
                name="email"
                type="email"
                placeholder="Enter email id"
                className={`${styles.inputField} ${
                  emailError 
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400' 
                    : isEmailValid 
                    ? 'border-green-400 focus:border-green-400 focus:ring-green-400' 
                    : ''
                }`}
                onChange={handleChange}
                value={formData.email}
              ></input>
              {formData.email && (
                <div className="absolute right-3 top-7">
                  {emailError ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : isEmailValid ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : null}
                </div>
              )}
              {emailError && (
                <p className="text-red-400 text-sm mt-1 ml-1">{emailError}</p>
              )}
            </div>
            <label for="pwd" className={styles.labelBase}>
              Password
            </label>
            <div className="relative mb-10">
              <Lock className="absolute left-3 top-7 text-slate-400" />
              <input
                id="pwd"
                name="password"
                placeholder="Enter password"
                className={styles.inputField}
                onChange={handleChange}
                value={formData.password}
                type={showPassword ? "text" : "password"}
                onKeyDown={handleKeyDown}
              ></input>
              <button
                className="absolute top-7.5 right-6 text-slate-400 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <Eye /> : <EyeOff />}
              </button>
            </div>
            {error && (
              <div className="w-full h-14 bg-red-500/10 border border-red-500/50 rounded-md p-4 mt-6 flex gap-2 items-center">
                <AlertCircle className="text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            )}
            <button
              disabled={loader.isLoading}
              type="submit"
              className={`w-full h-14 flex items-center justify-center gap-2 text-white mb-4 rounded-md p-2 mt-10 text-[17px] shadow-2xl mx-auto group ${
                loader.isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : " bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500 hover:bg-amber-500 hover:text-slate-800"
              }`}
              onClick={onSubmit}
            >
              <span className="font-semibold text-[18px]">
                Continue to Verification
              </span>
              <FaArrowRight className="transition-transform duration-300 ease-out group-hover:translate-x-2 group-active:translate-x-3" />
            </button>
            {loader.isLoading && (
              <div className="mt-4 flex mx-auto">
                <p className="text-slate-200 text-[20px] font-semibold block mx-auto">
                  Authenticating
                  <span className="text-white font-bold text-[18px] inline-block w-10 text-left">
                    {loader.dots}
                  </span>
                </p>
              </div>
            )}
            <div className="flex justify-center mx-auto gap-2 mt-8">
              <p className="text-slate-300 text-[18px]">
                Forgot your password?
              </p>
              <button
                className="text-cyan-500 font-semibold text-[18px] cursor-pointer hover:text-cyan-300"
                onClick={handleResetPassword}
              >
                Reset here
              </button>
            </div>
            <div className="flex justify-center mx-auto gap-2 mt-5">
              <p className="text-slate-300 text-[18px]">
                Don't have an account?
              </p>
              <button
                className="text-cyan-500 font-semibold text-[18px] cursor-pointer hover:text-cyan-300"
                onClick={handleSignUp}
              >
                Sign up here
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
