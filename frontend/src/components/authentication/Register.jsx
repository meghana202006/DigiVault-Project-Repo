import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  ShieldCheck,
  UserPlus,
  ArrowLeftCircle,
  User,
  MailIcon,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { registerStyles as styles } from "../../styles/tailwindClasses";
import RuleItem from "../shared/RuleItem";
import Navbar from "../shared/Navbar";
import Toast from "../shared/Toast";

function Register() {
  const initialState = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
  const [profileData, setProfileData] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setToast(null); // Clear toast when user starts typing
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const clearFormData = () => {
    setProfileData(initialState);
    setError("");
    setToast(null);
    setFocusPassword(false);
  };

  const handleSignIn = () => {
    clearFormData();
    navigate("/login");
  };
  const passwordRules = useMemo(() => {
    const password = profileData.password;
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [profileData.password]);
  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const handleFocus = () => {
    setFocusPassword(true);
  };
  const validateForm = async (e) => {
    e.preventDefault();
    if (
      !profileData.username ||
      !profileData.email ||
      !profileData.password ||
      !profileData.confirmPassword
    ) {
      setToast({ 
        message: "All fields are required", 
        type: "error" 
      });
      return;
    }
    if (!isPasswordValid) {
      setToast({ 
        message: "Password does not meet all requirements", 
        type: "error" 
      });
      return;
    }
    if (profileData.password !== profileData.confirmPassword) {
      setToast({ 
        message: "Passwords do not match", 
        type: "error" 
      });
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/register",
        profileData
      );
      console.log(res.data.message);
      setToast({ message: "Registration is successful! Redirecting to login...", type: "success" });
      setProfileData(initialState);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
      
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || "Registration failed. Please try again.", 
        type: "error" 
      });
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2500}
        />
      )}
      <div className="flex justify-center items-center">
        <div 
          className="flex flex-col items-center bg-slate-800/10 backdrop-blur-xl shadow-2xl rounded-4xl border border-amber-50 mt-10 px-18 py-10 mb-32"
          style={{ 
            minWidth: '700px', 
            maxWidth: '1152px'
          }}
        >
          <div className="bg-linear-to-br from-cyan-500 to-blue-500 w-18 h-18 rounded-3xl flex items-center justify-center border border-cyan-400 mx-auto">
            <UserPlus className="text-white w-10 h-10" />
          </div>
          <h2 className="text-white font-bold text-[32px] mt-3">Create Account</h2>
          <p className="text-slate-300 text-[20px] font-semibold mt-2 mb-3">
            Create your account to securely access DigiVault.
          </p>
          <div className="h-px w-full bg-linear-to-r from-transparent via-cyan-500 to-transparent mt-3"></div>

          <form className="max-w-xl min-w-150 flex flex-col gap-3">
            <div className="relative">
              <label className={styles.labelBase}>Username</label>
              <User className="absolute top-19 left-4 text-slate-400" />
              <input
                className={styles.inputField}
                placeholder="Enter the username"
                name="username"
                value={profileData.username}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label className={styles.labelBase}>Email Id</label>
              <MailIcon className="absolute top-20 left-3 text-slate-400" />
              <input
                className={styles.inputField}
                placeholder="Enter Email Id"
                name="email"
                value={profileData.email}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label className={styles.labelBase}>Password</label>
              <Lock className="absolute top-19 left-3 text-slate-400" />
              <button
                className="absolute right-3 top-17 translate-y-2 text-slate-400 cursor-pointer mr-2"
                onClick={() => setShowPassword(!showPassword)}  type="button" 
              >
                {showPassword?<Eye/>:<EyeOff/>}
              </button>
              <input
                className={styles.inputField}
                placeholder="Enter the password"
                name="password"
                value={profileData.password}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={()=>setFocusPassword(false)}
                type={showPassword ? "text" : "password"}
              />
            </div>
            {focusPassword && profileData.password && (
              <div className="flex flex-col w-full mb-5 mt-5 p-5 gap-2 bg-slate-900/20 backdrop-blur-sm rounded-md border border-slate-300">
                <p className="text-red-400 font-medium text-[19px]">
                  Password must contain:
                </p>
                <div className="grid grid-cols-2 gap-3">
                <RuleItem
                  fullfilled={passwordRules.minLength}
                  text="Atleast 8 characters"
                />
                <RuleItem
                  fullfilled={passwordRules.hasUpperCase}
                  text="One uppercase letter (A-Z)"
                />
                <RuleItem
                  fullfilled={passwordRules.hasLowerCase}
                  text="One lowercase letter (a-z)"
                />
                <RuleItem
                  fullfilled={passwordRules.hasNumber}
                  text="One number (0-9)"
                />
                <RuleItem
                  fullfilled={passwordRules.hasSpecialChar}
                  text="One special character (!@#$%^&*)"
                />
                </div>
              </div>
            )}
            <div className="relative">
              <label className={styles.labelBase}>Confirm Password</label>
              <Lock className="absolute top-19 left-3 text-slate-400" />
              <input
                className={styles.inputField}
                placeholder="Confirm you password"
                name="confirmPassword"
                value={profileData.confirmPassword}
                onChange={handleChange}
                type={showConfirmPassword ? "text" : "password"}
              />
              <button
                className="absolute right-3 top-17 translate-y-2 text-slate-400 mr-3 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}  type="button" 
              >
               {showConfirmPassword?<Eye/>:<EyeOff/>}
              </button>
            </div>
            <button
              className="w-full h-14 rounded-md bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500 mt-8 mb-4 text-white font-semibold text-[20px] p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              onClick={validateForm}
              disabled={!isPasswordValid && focusPassword}
            >
              Sign up
            </button>
            <div className="flex justify-center gap-2 mb-2">
              <p className="text-slate-300 text-[18px]">
                Already have an account?
              </p>
              <button
                className="text-cyan-400 font-semibold text-[18px] cursor-pointer"
                onClick={handleSignIn}
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Register;
