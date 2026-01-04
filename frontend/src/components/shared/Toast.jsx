import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / duration) * 50; // Update every 50ms
        const newProgress = prev - decrement;
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    // Auto close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  const bgColor = type === 'success' 
    ? 'bg-green-400/30 backdrop-blur-md border-green-600 border-2' 
    : 'bg-red-400/30 backdrop-blur-md border-red-500 border-2';
  
  const textColor = type === 'success' 
    ? 'text-white' 
    : 'text-white';

  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ${
        isClosing 
          ? 'opacity-0 translate-y-[-20px]' 
          : isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-[-20px]'
      }`}
    >
      <div className={`${bgColor} rounded-lg shadow-2xl px-4 py-3 p-5 flex flex-col gap-3 min-w-[300px] max-w-[500px] relative overflow-hidden`}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-700/30">
          <div 
            className={`h-full transition-all duration-50 ${
              type === 'success' ? 'bg-green-600/80' : 'bg-red-600/80'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex items-center gap-3 pt-1">
          <Icon className={`${textColor} w-8 h-8 flex-shrink-0`} />
          <p className={`${textColor} text-[20px] font-medium flex-1 text-center break-words`}>{message}</p>
          <button
            onClick={handleClose}
            className={`${textColor} hover:opacity-70 transition-opacity cursor-pointer flex-shrink-0`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toast;

