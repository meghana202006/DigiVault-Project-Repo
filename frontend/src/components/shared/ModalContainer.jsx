import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

function ModalContainer({ 
  children, 
  onClose, 
  maxWidth = "xl", // xl, 2xl, 3xl, etc.
  padding = "md", // sm, md, lg
  borderRadius = "2xl", // none, sm, md, lg, xl, 2xl, 3xl, full
  showCloseButton = true,
  loader = null,
  maxHeight = null,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        window.location.hash = "";
      }
    }, 300);
  };

  // Width mapping
  const widthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  // Max height mapping
  const maxHeightClasses = {
    sm: 'max-h-32',
    md: 'max-h-48',
    lg: 'max-h-60',
    xl: 'max-h-72',
    "2xl": 'max-h-[42rem]', // 672px
    "3xl": 'max-h-96', // 384px
    "4xl": 'max-h-[32rem]', // 512px
    full: 'max-h-full',
  }

  // Padding mapping
  const paddingClasses = {
    sm: "p-4",
    md: "p-8",
    lg: "p-10",
    xl: "p-12",
  };

  // Border radius mapping
  const borderRadiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  };

  return (
    <div
      className={`relative bg-slate-800 ${borderRadiusClasses[borderRadius]} shadow-2xl border border-slate-400 ${widthClasses[maxWidth]} ${maxHeight ? maxHeightClasses[maxHeight] : ''} w-full overflow-hidden z-50 ${
        isClosing ? 'email-step-zoom-out' : isVisible ? 'email-step-zoom-in' : ''
      }`}
      style={{
        transformOrigin: 'center center',
        opacity: isClosing ? 0 : isVisible ? 1 : 0,
      }}
    >
      <div className="w-full">
        {/* Loader Progress Bar */}
        {loader?.isLoading && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-700/50 z-50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-300 ease-out shadow-lg shadow-cyan-400/50"
              style={{ 
                width: `${loader.progress}%`,
                boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)'
              }}
            ></div>
          </div>
        )}

        {/* Close Button */}
        {showCloseButton && (
          <button
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all duration-200 hover:scale-110 z-10 cursor-pointer"
            onClick={handleClose}
          >
            <X className="h-6 w-6" />
          </button>
        )}

        {/* Content */}
        <div className={`${paddingClasses[padding]} ${maxHeight ? 'overflow-y-auto' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default ModalContainer;

