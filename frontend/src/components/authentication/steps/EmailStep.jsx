import React, { useState } from "react";
import {
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import useAuthLoader from "../../hooks/useAuthLoader";
import { resetpwdStyles as styles } from "../../../styles/tailwindClasses";
import axios from "axios";
import ModalContainer from "../../shared/ModalContainer";
import Toast from "../../shared/Toast";

function EmailStep({userData , onNext}) {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);
  const loader = useAuthLoader();

  const handleChange = (e) => {
    setToast(null);
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };
  const handleSendOTP = async(e) =>{
      e.preventDefault()
      setError("");
      setSuccess("");
      
      if(!formData.email){
        setToast({ message: "Please enter the email address", type: "error" });
        return
      }
      try{
          loader.start()
          const res = await axios.post("http://localhost:5000/api/users/resendOTP",
            {
                email : formData.email
            }
          )
          const emailToPass = formData.email;
          setFormData((prev)=>({
            ...prev,
            email:""
          }))
          
          // Wait for progress to reach ~95%, then complete and show message
          setTimeout(() => {
            loader.stop() // Complete progress animation to 100%
            // Show success message immediately after progress completes
            setTimeout(() => {
              setToast({ message: "OTP is sent successfully to your email", type: "success" });
              // Wait for user to see the success message, then move to next step
              setTimeout(() => {
                onNext(emailToPass);
              }, 1200);
            }, 80);
          }, 80);
      }catch(err){
          // Wait for progress to show, then stop on error
          setTimeout(() => {
            loader.stop();
            setToast({ message: err.response?.data?.message || "Failed to send OTP. Please try again.", type: "error" });
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
      padding="xl" 
      loader={loader}
      onClose={() => window.location.hash = ""}
    >
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="text-cyan-400 h-10 w-10" />
            <h2 className="text-3xl font-medium text-white">
              Reset Password
            </h2>
          </div>
          <p className="text-[20px] text-slate-400 mb-4">
            Enter your email address and we'll send you an OTP to reset your
            password
          </p>
          <hr className="border-gray-400 my-4" />
          <div>
            <label className={styles.labelBase}>Email Address</label>
            <div className="relative mb-3">
              <Mail className="text-slate-400 absolute left-3 top-7" />
              <input
                className={styles.inputField}
                placeholder="Enter your email id"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loader.isLoading}
              />
            </div>
          </div>
          {error && (
            <div className="relative w-full bg-red-500/10 border border-red-500/50 p-3 mb-3 mt-5 flex gap-2 items-center rounded-md">
              <AlertCircle className="absolute left-3 top-2 text-red-400 h-8 w-8" />
            
              <p className="text-red-400 text-[18px] ml-10">{error}</p>
            </div>
          )}
          {success && (
            <div className="relative w-full bg-green-500/10 border border-green-500/50 p-3 mb-4 mt-5 flex gap-2 items-center rounded-md">
              <CheckCircle className="absolute left-3 top-3 text-green-400 h-8 w-8" />
              <p className="text-green-400 text-[18px] ml-10">{success}</p>
            </div>
          )}
          <div>
              <button
                className={`w-full h-13 flex items-center rounded-md justify-center gap-2 text-white text-base shadow-lg mt-7 ${
                  loader.isLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500"
                }`}
                onClick={handleSendOTP}
                disabled={loader.isLoading}
              >
                <span className="font-semibold text-[20px]">Send OTP</span>
                <ArrowRight className="h-6 w-6" />
              </button>
              { loader.isLoading && (
                <div className="w-full mx-auto flex justify-center mt-5">
                  <p className="text-white text-[19px] block mx-auto">Sending OTP
                    <span className="inline-block font-semibold text-[19px] w-[6ch] text-left">{loader.dots}</span>
                  </p>
                </div>
              )}
          </div>
    </ModalContainer>
    </>
  );
}

export default EmailStep;
