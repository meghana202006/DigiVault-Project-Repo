import { useState, useEffect } from 'react';
import { subscribeBackendStatus, setBackendUnavailable } from '../../utils/backendStatus';
import { WifiOff, X } from 'lucide-react';

/**
 * Shows a non-blocking banner when the backend is unreachable (ECONNREFUSED / 502).
 * App keeps working; banner hides automatically when the next request succeeds.
 */
export default function BackendUnavailableBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const unsub = subscribeBackendStatus((isDown) => setShow(isDown));
    return unsub;
  }, []);

  const handleDismiss = () => {
    setBackendUnavailable(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 bg-amber-600 text-white px-4 py-3 shadow-lg"
      role="alert"
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="flex-shrink-0 w-5 h-5" />
        <p className="text-sm font-medium truncate">
          Backend unavailable. From project root run: <code className="bg-amber-700 px-1.5 py-0.5 rounded">npm run dev</code>
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded hover:bg-amber-700 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
