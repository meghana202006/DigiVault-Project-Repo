import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { Mail } from "lucide-react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import ModalContainer from "../../shared/ModalContainer";
import Toast from "../../shared/Toast";
import useAuthLoader from "../../hooks/useAuthLoader";

function VerifyOtpStep({ email, flowType, onSuccess }) {
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [toast, setToast] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const loader = useAuthLoader();
  const location = useLocation();
  const navigate = useNavigate();

  // Get userData safely
  //   const userData = location.state?.userData;
  //  if(!otpRequired || !userData)
  //  {
  //     return <Navigate to="/login" replace/>
  //  }

  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);
  const verifyOTP = async (newotp) => {
    setIsVerifying(true);
    setToast(null); // Clear previous toast
    loader.start(); // Start progress animation

    try {
      const endpoint =
        flowType === "LOGIN" ? 
        "http://localhost:5000/api/users/verifyOTP" : "http://localhost:5000/api/users/verifyForgotPasswordOTP";
      const res = await axios.post(
        endpoint,
        {
          email:email,
          otp: newotp,
        },
        { withCredentials: true }
      );

      if(res.status == 200)
      {
          // Store access token for protected routes
          if (flowType === "LOGIN" && res.data.token) {
            localStorage.setItem('accessToken', res.data.token);
          }
          
          // Wait for progress bar to complete (minimum 2.5 seconds for animation)
          // This ensures both spinner and progress bar are visible together
          const minDelay = 2500; // 2.5 seconds minimum to show loading animation
          
          // Wait for minimum delay to ensure both spinner and progress bar are visible
          setTimeout(() => {
            loader.stop(); // Complete progress animation (sets to 100% and hides after 100ms)
            
            // Small delay after progress completes to show full animation
            setTimeout(() => {
              setIsVerified(true); // Mark as verified to hide back button for LOGIN flow
              setIsVerifying(false); // Hide spinner
              setToast({ message: "OTP verified successfully!", type: "success" });
              
              // Wait a moment to show success toast before proceeding
              setTimeout(() => {
                // Pass OTP to onSuccess callback for RESET flow
                if(flowType === "RESET") {
                  onSuccess(newotp);
                } else {
                  onSuccess();
                }
              }, 1000);
            }, 300); // Small delay after progress completes to show 100% state
          }, minDelay);
      }

      
    } catch (err) {
      console.log(err)
      loader.stop(); // Stop progress on error
      setIsVerifying(false); // Hide spinner on error
      setToast({ 
        message: err.response?.data?.message || "Invalid or expired OTP", 
        type: "error" 
      });
    }
  };
  const handleOtpChange = (index, value) => {
    // Clear toast when user starts typing
    if (value && !otp[index]) {
      setToast(null);
    }
    const newotp = [...otp];
    newotp[index] = value;
    setOTP(newotp);
    console.log(newotp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newotp.every((digit) => digit !== "") && index === 5) {
      verifyOTP(newotp.join(""));
    }
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleOtpPaste = (e) => {
    const pastedOTP = e.clipboardData.getData("text").slice(0, 6);
    
    const newotp = [...otp];
    pastedOTP.split("").forEach((digit, idx) => {
      if (idx < 6) newotp[idx] = digit;
    });
    setOTP(newotp);
    console.log(pastedOTP);
    if (newotp.every((digit) => digit !== "")) {
      verifyOTP(newotp.join(""));
    }
  };
  const resendOTP = async () => {
    setTimeLeft(60);
    setCanResend(false);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/resendOTP",
        { email: email.email || email }
      );
      alert(res.data.message);
    } catch (err) {
      console.log(err.response?.data?.message);
      alert(err.response?.data?.message || "Failed to resend OTP");
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
      <ModalContainer 
        maxWidth="2xl" 
        padding="lg" 
        showCloseButton={false}
        loader={loader}
        onClose={() => window.location.hash = ""}
      >
        {/* Hide back button after OTP verification for LOGIN flow only */}
        {!(isVerified && flowType === "LOGIN") && (
          <button
            className="flex items-center justify-center gap-2 cursor-pointer mb-4"
            onClick={() => window.location.hash = ""}
          >
            <FaArrowLeft className="text-gray-300" />
            <span className="text-gray-300 text-[18px]">Back to login</span>
          </button>
        )}
        <div className="relative flex items-center gap-5">
          <Mail className="absolute top-0.2 w-10 h-10 text-cyan-400 mt-6" />

          <h2 className="text-[34px] text-white font-semibold mt-5 ml-15">
            Verify OTP
          </h2>
        </div>
        <hr className="text-gray-300 h-1 mt-4" />
        <p className="text-slate-300 mt-4 text-[20px]">
          Enter the 6-digit code sent to{" "}
          <span className="text-white inline">{email}</span>
        </p>
        <div className="flex flex-col gap-6">
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
                className="w-20 h-20 bg-slate-800 border border-gray-300 rounded-2xl px-8 text-white text-2xl font-semibold focus:outline-none focus:ring-4 focus:ring-cyan-300 focus:border-transparent mt-10"
              ></input>
            ))}
          </div>

          {isVerifying && (
            <div className="flex items-center justify-center gap-3 mt-1 mb-1">
              <div className="w-8 h-8 border-[3px] border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-cyan-400 text-[20px] font-medium tracking-wide">
                Verifying
              </span>
            </div>
          )}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
        </div>

        <div className="flex flex-col mx-auto">
          {!canResend ? (
            <p className="text-gray-400 mt-5 block mx-auto text-[18px]">
              Request new OTP in :
              <span className="text-white font-semibold ml-2">{timeLeft}s</span>
            </p>
          ) : (
            <>
              <p className="text-gray-400 mt-5 block mx-auto">
                Didn't receive the code?
              </p>
              <button
                className="text-cyan-500 font-semibold text-[17px] mt-3 cursor-pointer"
                onClick={resendOTP}
              >
                Resend Code
              </button>
            </>
          )}
        </div>
      </ModalContainer>
    </>
  );
}

export default VerifyOtpStep;
