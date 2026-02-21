import React, { useEffect, useState, useCallback } from 'react';
import { Trash2, X, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';

function DeleteToast({ fileName, onConfirm, onUndo, onClose, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);

  console.log('DeleteToast rendered with fileName:', fileName);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  }, [onClose]);

  const handleUndo = useCallback(() => {
    if (onUndo) {
      onUndo();
    }
    handleClose();
  }, [onUndo, handleClose]);

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

    // Auto confirm after duration
    const timer = setTimeout(() => {
      if (onConfirm) {
        onConfirm();
      }
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onConfirm, handleClose]);

  if (!fileName) return null;

  return createPortal(
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[10002] animate-upload-slideIn">
      <div className="bg-[#1a2332] border-2 border-red-500/60 rounded-xl p-4 shadow-2xl min-w-[320px] max-w-[420px] relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-700/30">
          <div 
            className="h-full bg-red-500/80 transition-all duration-50"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">
              <span className="truncate block" title={fileName}>
                {fileName}
              </span>
              <span className="text-xs text-[#94a3b8]"> will be deleted</span>
            </p>
          </div>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            onClick={handleClose}
            className="text-[#94a3b8] hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeleteToast;

