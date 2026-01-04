import React, { useEffect, useState } from "react";
import { loginStyles as styles } from "../../styles/tailwindClasses";
import Navbar from "../shared/Navbar";
import useAuthLoader from "../hooks/useAuthLoader";
import {useNavigate} from "react-router-dom";
import {
  Mail,
  Lock,
  ShieldCheck,
  ArrowLeftCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useHashRoute } from "../hooks/useHashRoute";

import { FaArrowRight } from "react-icons/fa";
import axios from "axios";
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
  const navigate = useNavigate();
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

 

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setToast({ message: "Please fill all fields", type: "error" });
      return;
    }

    try {
      loader.start();
      const res = await axios.post(
        "http://localhost:5000/api/users/login",
        formData,
        { withCredentials: true }
      );

      if (res.status === 200) {
        // Check if OTP is required
        // If requireOTP is explicitly false, skip OTP; otherwise require it
        if (res.data.requireOTP === false && res.data.token) {
          // Valid refresh token exists - skip OTP and go directly to filemanager
          // Store access token if needed
          if (res.data.token) {
            // You can store token in localStorage or context if needed
            localStorage.setItem('accessToken', res.data.token);
          }
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
          <div className="mt-3">
            <label for="usr" className={styles.labelBase}>
              Email Id
            </label>
            <div className="relative mb-8">
              <Mail className="absolute left-3 top-7 text-slate-400" />
              <input
                id="usr"
                name="email"
                placeholder="Enter email id"
                className={styles.inputField}
                onChange={handleChange}
                value={formData.email}
              ></input>
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
              ></input>
              <button
                className="absolute top-7.5 right-6 text-slate-400 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
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
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
