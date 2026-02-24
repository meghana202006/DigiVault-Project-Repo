import React, { useState } from 'react';
import { Download, AlertCircle, CheckCircle, Key, Lightbulb, Shield } from 'lucide-react';

const RecoveryKeyDownloadModal = ({ isOpen, onClose, onDownload, userEmail }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const success = await onDownload();
      if (success) {
        setDownloadSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setIsDownloading(false);
      }
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
   <div className={`fixed inset-0 z-50 flex justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto transition-all duration-500 ${
    downloadSuccess 
      ? 'items-center pt-0' 
      : 'items-start pt-40'
}`}>
      {/* Backdrop - no click to close */}
      <div className="absolute inset-0 animate-fade-in" />
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-400/50 relative z-10 overflow-hidden animate-modal-slide-up p-3">
        {!downloadSuccess && (
          <>
            {/* Header - Centered with icon, title, and subtitle */}
            <div className="pt-6 pb-4 px-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/30 flex items-center justify-center mx-auto mb-3">
                <Key className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Download Recovery Key</h2>
              <p className="text-slate-400 text-[16px]">Essential for account recovery</p>
            </div>

            {/* Content */}
            <div className="px-6 pb-4">
              {/* Important Warning Section */}
              <div className="flex items-start gap-3 mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-400 text-[18px] font-bold mb-1">Important!</p>
                  <p className="text-slate-300 text-[16px]">
                    Your recovery key will be downloaded. This file is essential for recovering your encrypted files. Store it in a secure location and never share it with anyone.
                  </p>
                </div>
              </div>

              {/* Account Information Section */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 mb-4">
                <p className="text-slate-400 text-[17px] font-medium mb-1">Account Email</p>
                <p className="text-white font-bold text-[18px]">{userEmail}</p>
              </div>

              {/* Storage Tips Section */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-6 h-6 text-amber-400" />
                  <h3 className="text-amber-400 font-bold text-[18px]">Storage Tips:</h3>
                </div>
                <div className="space-y-1.5 text-slate-300 text-[16px]">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>Choose where to save the file</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>Keep it in a safe, accessible location</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>Make a backup copy if possible</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Success State - No Header, Just Card */}
        {/* {downloadSuccess && (
          <div className="px-6 py-8">
            <div className="flex flex-col items-center text-center justify-center gap-4 mb-4">
              <div className="bg-green-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                <CheckCircle className="text-green-400 h-20 w-20" />
              </div>
              <h2 className="text-3xl font-medium text-white">
                Recovery Key Downloaded!
              </h2>
            </div>
            <p className="text-[20px] text-slate-400 mb-4 text-center">
              Your recovery key has been downloaded successfully. Please save it in a secure location.
            </p>
          </div>
        )} */}
        {/* Success State block tweak */}
{downloadSuccess && (
  <div className="px-6 py-10 animate-fade-in"> {/* Added extra padding and fade-in */}
    <div className="flex flex-col items-center text-center justify-center gap-4 mb-4">
      <div className="bg-green-500/10 p-4 rounded-full w-24 h-24 flex items-center justify-center mb-2">
        <CheckCircle className="text-green-400 h-16 w-16" />
      </div>
      <h2 className="text-3xl font-bold text-white">
        Recovery Key Downloaded!
      </h2>
    </div>
    {/* ... rest of content */}
  </div>
)}

        {/* Footer with Download Button */}
        {!downloadSuccess && (
          <div className="px-6 pb-4">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-cyan-500/30 text-white rounded-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Recovery Key
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Indicator */}
        {!downloadSuccess && (
          <div className="flex items-center justify-center gap-2 pb-3">
            <Shield className="w-4 h-4 text-slate-500" />
            <p className="text-slate-500 text-xs">Encrypted & Secure</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryKeyDownloadModal;

