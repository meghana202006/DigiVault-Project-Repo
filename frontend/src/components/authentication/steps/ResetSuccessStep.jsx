import React from 'react'
import { CheckCircle } from 'lucide-react'
import { FaArrowRight } from 'react-icons/fa'
import ModalContainer from '../../shared/ModalContainer'
import { useNavigate } from 'react-router-dom'

function ResetSuccessStep({ onClose }) {
  const navigate = useNavigate();

  // Handle close button - navigate to login
  const handleClose = () => {
    // Clear hash using onClose prop to trigger modal close
    if (onClose) {
      onClose();
    } else {
      window.location.hash = "";
    }
    // Use setTimeout to ensure hash change is processed and modal closes before navigation
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 350);
  };

  // Handle Back to Login button - same behavior as close
  const handleBackToLogin = () => {
    handleClose();
  };

  return (
    <>
      <ModalContainer
      maxWidth="xl" 
      padding="xl" 
      onClose={handleClose}
      >
        <div className='flex flex-col items-center text-center justify-center gap-3 mb-4'>
            <div className='bg-green-500/10 p-3 rounded-full w-35 h-35 flex items-center justify-center'>
              <CheckCircle className="text-green-400 h-20 w-20" /> 
            </div>
            <h2 className="text-3xl font-medium text-white">
                Password Reset Successfully!
            </h2>
        </div>
        <p className="text-[20px] text-slate-400 mb-4 text-center">
            Your password has been reset successfully. You can now login to your account.
        </p>
        <button 
          onClick={handleBackToLogin}
          className='flex gap-3 items-center justify-center w-full h-12 rounded-md bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500 mt-8 mb-3 text-white font-semibold text-[20px] p-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Back to Login <FaArrowRight/>
        </button>
        </ModalContainer>
    </>
    
  )
}

export default ResetSuccessStep