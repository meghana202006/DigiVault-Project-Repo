import React, { useMemo, useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { generateRandomSalt } from "../../utils/megaHelpers/saltGenerator";
import { deriveMasterKey } from "../../utils/megaHelpers/genMasterKey";
import { useHashRoute } from "../hooks/useHashRoute";
import useUsernameAvailability from "../hooks/useUsernameAvailability";
import useEmailAvailability from "../hooks/useEmailAvailability";
import FormField from "../shared/FormField";
import axios from "axios";
import { getApiBaseURL } from "../../utils/axiosInstance";

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
  CheckCircle,
} from "lucide-react";
import { registerStyles as styles } from "../../styles/tailwindClasses";
import RuleItem from "../shared/RuleItem";
import Navbar from "../shared/Navbar";
import Toast from "../shared/Toast";
import RecoveryKeyDownloadModal from "../shared/RecoveryKeyDownloadModal";
import { downloadRecoveryKey } from "../../utils/recoveryKeyDownload";

function Register() {
  const initialState = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    security:{
      salt:null,
      recoveryVault:null,
      vaultIv:null,
    }
    
  };
  const [profileData, setProfileData] = useState(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  
  // Use custom hooks for username and email availability
  const {
    status: usernameStatus,
    checkUsername,
    checkUsernameImmediate,
    resetStatus: resetUsernameStatus
  } = useUsernameAvailability(500);
  
  // const {
  //   status: emailStatus,
  //   checkEmail,
  //   checkEmailImmediate,
  //   resetStatus: resetEmailStatus
  // } = useEmailAvailability(500);
  
  const { status: emailStatus, checkEmail } = useEmailAvailability(500);
  const [confirmPasswordStatus, setConfirmPasswordStatus] = useState({
    checking: false,
    matches: null, // null = not checked, true = matches, false = doesn't match
    message: ''
  });
  const [confirmPasswordDebounceTimer, setConfirmPasswordDebounceTimer] = useState(null);
  
  // Hash routing for recovery key modal
  const { step, navigation, close } = useHashRoute();
  const isRecoveryKeyStep = step === 'recovery-key';
  
  // Recovery key download modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState(null);

  // Check for recovery key hash on mount and load data from sessionStorage
  useEffect(() => {
    if (isRecoveryKeyStep) {
      const storedRecoveryData = sessionStorage.getItem('pendingRecoveryKey');
      if (storedRecoveryData) {
        try {
          const parsed = JSON.parse(storedRecoveryData);
          // Only update if recoveryData is null or different
          setRecoveryData(prev => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(parsed)) {
              return parsed;
            }
            return prev;
          });
          // Only set modal to true if it's not already true
          setShowRecoveryModal(prev => prev || true);
        } catch (error) {
          console.error('Error parsing recovery data:', error);
          // Clear invalid data
          sessionStorage.removeItem('pendingRecoveryKey');
          // Clear hash to close modal (use direct hash change to avoid dependency)
          window.location.hash = '';
        }
      } else {
        // No recovery data found, clear hash to close modal
        window.location.hash = '';
      }
    } else {
      // Only update if modal is currently showing
      setShowRecoveryModal(prev => prev ? false : prev);
    }
    // Only depend on isRecoveryKeyStep - close function is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecoveryKeyStep]);

  // Username and email checks are now handled by custom hooks

  // Handle confirm password match check
  const handleConfirmPasswordCheck = (password, confirmPassword) => {
    if (!confirmPassword || confirmPassword.trim() === '') {
      setConfirmPasswordStatus({ checking: false, matches: null, message: '' });
      return;
    }

    if (!password || password.trim() === '') {
      setConfirmPasswordStatus({ 
        checking: false, 
        matches: null, 
        message: 'Enter password first' 
      });
      return;
    }

    // Check if passwords match
    if (password === confirmPassword) {
      setConfirmPasswordStatus({
        checking: false,
        matches: true,
        message: 'Passwords match ✓'
      });
    } else {
      setConfirmPasswordStatus({
        checking: false,
        matches: false,
        message: 'Passwords do not match'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setToast(null); // Clear toast when user starts typing
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Check username availability with debounce (handled by hook)
    if (name === 'username') {
      checkUsername(value);
    }

    // Check email availability with debounce (handled by hook)
    if (name === 'email') {
      checkEmail(value);
    }

    // Check confirm password match with debounce
    if (name === 'confirmPassword') {
      // Clear previous timer
      if (confirmPasswordDebounceTimer) {
        clearTimeout(confirmPasswordDebounceTimer);
      }

      // Set new timer (wait 300ms after user stops typing)
      const timer = setTimeout(() => {
        handleConfirmPasswordCheck(profileData.password, value);
      }, 300);
      
      setConfirmPasswordDebounceTimer(timer);
    }

    // Also check confirm password when password changes
    if (name === 'password' && profileData.confirmPassword) {
      // Clear previous timer
      if (confirmPasswordDebounceTimer) {
        clearTimeout(confirmPasswordDebounceTimer);
      }

      // Set new timer (wait 300ms after user stops typing)
      const timer = setTimeout(() => {
        handleConfirmPasswordCheck(value, profileData.confirmPassword);
      }, 300);
      
      setConfirmPasswordDebounceTimer(timer);
    }
  };

  const clearFormData = () => {
    setProfileData(initialState);
    setError("");
    setToast(null);
    setFocusPassword(false);
    resetUsernameStatus();
    resetEmailStatus();
  };

  const handleSignIn = () => {
    clearFormData();
    navigate("/login");
  };
  // Cleanup confirm password timer on unmount (username/email timers handled by hooks)
  useEffect(() => {
    return () => {
      if (confirmPasswordDebounceTimer) {
        clearTimeout(confirmPasswordDebounceTimer);
      }
    };
  }, [confirmPasswordDebounceTimer]);

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
  
  // Recovery key download handlers
  const handleRecoveryDownload = async () => {
    // Use recoveryData from state (loaded from sessionStorage) or profileData
    const dataToUse = recoveryData || profileData;
    
    if (!dataToUse.security || !dataToUse.security.salt) {
      return false;
    }
    
    try {
      const success = await downloadRecoveryKey(
        dataToUse.security, 
        dataToUse.email
      );
      return success;
    } catch (error) {
      console.error('Recovery key download error:', error);
      return false;
    }
  };

  const handleRecoveryModalClose = () => {
    setShowRecoveryModal(false);
    // Clear sessionStorage
    sessionStorage.removeItem('pendingRecoveryKey');
    setRecoveryData(null);
    // Clear hash
    close();
    // Navigate to login after modal closes
    setProfileData(initialState);
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };
  
  const validateForm = async (e) => {
    e.preventDefault();
    
    // Trim and check if fields are empty FIRST (before other validations)
    // Use nullish coalescing and ensure we handle undefined/null/empty strings
    const trimmedUsername = String(profileData.username || '').trim();
    const trimmedEmail = String(profileData.email || '').trim();
    const trimmedPassword = String(profileData.password || '').trim();
    const trimmedConfirmPassword = String(profileData.confirmPassword || '').trim();
    
    // Check if any field is empty
    const missingFields = [];
    if (!trimmedUsername) missingFields.push('Username');
    if (!trimmedEmail) missingFields.push('Email');
    if (!trimmedPassword) missingFields.push('Password');
    if (!trimmedConfirmPassword) missingFields.push('Confirm Password');
    
    if (missingFields.length > 0) {
      const errorMessage = missingFields.length === 1 
        ? `${missingFields[0]} is required`
        : `Please fill in: ${missingFields.join(', ')}`;
      
      console.log('Validation failed - Missing fields:', missingFields);
      console.log('Field values:', {
        username: profileData.username || '(empty)',
        email: profileData.email || '(empty)',
        password: profileData.password ? '(has value)' : '(empty)',
        confirmPassword: profileData.confirmPassword ? '(has value)' : '(empty)'
      });
      
      setToast({ 
        message: errorMessage, 
        type: "error" 
      });
      console.log("Here is the error of required fields");
      return;
    }
    
    // Check if username is available
    if (usernameStatus.available === false || usernameStatus.checking) {
      setToast({ 
        message: usernameStatus.checking 
          ? "Please wait while we check username availability" 
          : "Username is already taken. Please choose another one.", 
        type: "error" 
      });
      return;
    }
    
    // If username hasn't been checked yet, check it now
    // if (trimmedUsername && usernameStatus.available === null) {
    //   await checkUsernameImmediate(trimmedUsername);
    //   // Wait a moment for state to update
    //   setTimeout(() => {
    //     if (usernameStatus.available === false) {
    //       setToast({ 
    //         message: "Username is already taken. Please choose another one.", 
    //         type: "error" 
    //       });
    //     }
    //   }, 100);
    //   return;
    // }

    const isUserAvailable = await checkUsernameImmediate(trimmedUsername);
    if (!isUserAvailable) return

    // Check if email is available
    if (emailStatus.available === false || emailStatus.checking) {
      setToast({ 
        message: emailStatus.checking 
          ? "Please wait while we check email availability" 
          : "Email is already registered. Please use another email.", 
        type: "error" 
      });
      return;
    }
    
    // If email hasn't been checked yet, check it now
    // if (trimmedEmail && emailStatus.available === null) {
    //   await checkEmailImmediate(trimmedEmail);
    //   // Wait a moment for state to update
    //   setTimeout(() => {
    //     if (emailStatus.available === false) {
    //       setToast({ 
    //         message: "Email is already registered. Please use another email.", 
    //         type: "error" 
    //       });
    //     }
    //   }, 100);
    //   return;
    // }

    
    // Check password validity using trimmed password
    const passwordRules = {
      minLength: trimmedPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(trimmedPassword),
      hasLowerCase: /[a-z]/.test(trimmedPassword),
      hasNumber: /[0-9]/.test(trimmedPassword),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword),
    };
    const isPasswordValidNow = Object.values(passwordRules).every(Boolean);
    
    if (!isPasswordValidNow) {
      setToast({ 
        message: "Password does not meet all requirements", 
        type: "error" 
      });
      return;
    }
    if (trimmedPassword !== trimmedConfirmPassword) {
      setToast({ 
        message: "Passwords do not match", 
        type: "error" 
      });
      return;
    }
    // Setup a salt
    const salt = generateRandomSalt();

    // Derive the master key from password and salt (use trimmed password)
    const masterKey = await deriveMasterKey(trimmedPassword, salt);

    // Create a Recovery Key (256 bits)
    const recoveryKey = await window.crypto.subtle.generateKey({
      name: "AES-GCM",
      length: 256
    },
    true,
    ["wrapKey", "unwrapKey"]
  );
  const vaultIv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Wrap the recovery key with the master key (encrypt it)
  const wrappedRecoveryKey = await window.crypto.subtle.wrapKey("raw", recoveryKey, masterKey, { name: "AES-GCM", iv: vaultIv });
  
  // Convert ArrayBuffer to Array for storage
  const securityObject = { 
    salt : Array.from(salt),
    recoveryVault : Array.from(new Uint8Array(wrappedRecoveryKey)),
    vaultIv : Array.from(vaultIv)
  }
  
    

    
    try {
      // Prepare registration data (use trimmed values, remove confirmPassword, keep security object)
      const registrationData = {
        username: trimmedUsername,
        email: trimmedEmail,
        password: trimmedPassword,
        security: securityObject
      };
      console.log(registrationData);
      console.log("Security object:",registrationData.security);
      const res = await axios.post(
        `${getApiBaseURL()}/users/register`,
        registrationData
      );
      
      setProfileData(prevData =>({...prevData, security:securityObject}));
      console.log(res.data.message);
      
      // Show recovery key download modal after successful registration
      // Use securityObject directly since state update is async
      if (securityObject && securityObject.salt) {
        // Store recovery data in sessionStorage for persistence on refresh
        const recoveryDataToStore = {
          email: profileData.email,
          security: securityObject
        };
        sessionStorage.setItem('pendingRecoveryKey', JSON.stringify(recoveryDataToStore));
        setRecoveryData(recoveryDataToStore);
        
        setToast({ message: "Registration successful! Please download your recovery key.", type: "success" });
        // Navigate to recovery key hash route
        navigation('#recovery-key');
        setShowRecoveryModal(true);
      } else {
        // If no recovery key, just navigate
        setToast({ message: "Registration is successful! Redirecting to login...", type: "success" });
        setProfileData(initialState);
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      }
      
    } catch (err) {
      console.log(err);
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
      
      {/* Recovery Key Download Modal */}
      {showRecoveryModal && (recoveryData || profileData.security) && (
        <RecoveryKeyDownloadModal
          isOpen={showRecoveryModal}
          onClose={handleRecoveryModalClose}
          onDownload={handleRecoveryDownload}
          userEmail={recoveryData?.email || profileData.email}
        />
      )}
      <div className="flex justify-center items-center">
        <div 
          className="flex flex-col items-center bg-slate-800/10 backdrop-blur-xl shadow-2xl rounded-md border border-amber-50 mt-10 px-18 py-10 mb-32"
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
            
             
 {/* Username Field */}
  <FormField
    label="Username"
    name="username"
    icon={User}
    placeholder="Enter the username"
    value={profileData.username}
    onChange={handleChange}
    status={usernameStatus}
  />
  {/* Email Field */}
  {/* Change the status prop to pass the object directly */}
<FormField
  label="Email Id"
  name="email"
  icon={MailIcon}
  placeholder="Enter Email Id"
  value={profileData.email}
  onChange={handleChange}
  status={emailStatus} // <--- Pass emailStatus directly
  rightElement={
    <div className="flex items-center">
      {emailStatus.checking && (
        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      )}
      {!emailStatus.checking && emailStatus.available && (
        <CheckCircle className="text-green-400 w-5 h-5" />
      )}
      {!emailStatus.checking && emailStatus.available === false && (
        <AlertCircle className="text-red-400 w-5 h-5" />
      )}
    </div>
  }
/>
             
  {/* Password Field */}
            <FormField
            label="Password"
            name="password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Enter the password"
            value={profileData.password}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={() => setFocusPassword(false)}
            rightElement={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white">
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          }
        />
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
            {/* Confirm Password Field */}
            {/* Confirm Password Field - FIXED VERSION */}
<FormField
  label="Confirm Password"
  name="confirmPassword"
  icon={Lock}
  type={showConfirmPassword ? "text" : "password"}
  placeholder="Confirm the password"
  value={profileData.confirmPassword}
  onChange={handleChange}
  status={{
    isValid: confirmPasswordStatus.matches,
    message: confirmPasswordStatus.message
  }}
  rightElement={
    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-slate-400 hover:text-white">
        {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
    </button>
  }
/>
              
        
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
