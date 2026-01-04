import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHashRoute } from "../hooks/useHashRoute";
import VerifyOtpStep from "./steps/VerifyOtpStep";
import EmailStep from "./steps/EmailStep";
import ResetPassword from "./steps/ResetPassword";
import Vault from "../Vault";
import Login from "./Login";
import ResetSuccessStep from "./steps/ResetSuccessStep";

function AuthFlowManager() {
  const { step, close, navigation  } = useHashRoute();
  const navigate = useNavigate();
  const [sharedData, setSharedData] = useState({ email: "", flowType: "", otp: "" });

  //Centralized function for transition between steps
  const startFlow = (email, flowType, nextHash) => {
    setSharedData({ email, flowType, otp: "" });
    window.location.hash = nextHash;
  };

  // Function to update OTP when verified
  const handleOtpVerified = (otp) => {
    setSharedData((prev) => ({ ...prev, otp }));
  };

  return (
    <>
    <div className="relative">
      <Login onLoginSuccess={(email)=>startFlow(email , "LOGIN" , "#verify-identity")}/>
      {step && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={close}
          />
          
          {step === "verify" && (
            <VerifyOtpStep
              email={sharedData.email}
              flowType={sharedData.flowType}
              onSuccess={(otp)=>{
                if(sharedData.flowType === 'LOGIN') {
                  // Navigate to Vault (protected route) using React Router
                  navigate('/vault', { replace: true });
                } else {
                  // Store OTP and navigate to reset password
                  handleOtpVerified(otp);
                  navigation('#reset-password');
                }
              }}
            />
          )}
          { step === "forgot-password" && (
            <EmailStep onNext={(email)=> startFlow(email,"RESET","#verify-identity")}/>
          )}
          { step === "reset-password" && (
            <ResetPassword email={sharedData.email} otp={sharedData.otp} onNext={()=> navigation('#success')}/>
          )}
          {
            step === "success" && (
              <ResetSuccessStep />
            )
          }
          
        </div>
      )}
      </div>
    </>
  );
}

export default AuthFlowManager;
