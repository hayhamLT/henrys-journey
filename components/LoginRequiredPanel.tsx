
import React, { useState } from 'react';
import { ICONS } from './icons';

interface LoginRequiredPanelProps {
  featureName: string;
  description: string;
  onLogin: () => Promise<void>;
  onAppleLogin?: () => Promise<void>;
  onResetData?: () => void;
  variant?: 'dark' | 'light';
  onClose?: () => void;
}

// Apple Human Interface Guidelines require Sign in with Apple to be given
// EQUAL PROMINENCE to any other social sign-in option, so we show it above
// or beside Google — never below or smaller.
const isAppleDevice = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);
};

const LoginRequiredPanel: React.FC<LoginRequiredPanelProps> = ({ featureName, description, onLogin, onAppleLogin, onResetData, variant = 'light', onClose }) => {
  const [isLoading, setIsLoading] = useState<'' | 'google' | 'apple'>('');
  const [error, setError] = useState<string | null>(null);
  const showApple = !!onAppleLogin && isAppleDevice();

  const runLogin = async (kind: 'google' | 'apple') => {
    if (isLoading) return;
    setIsLoading(kind);
    setError(null);
    try {
      if (kind === 'apple' && onAppleLogin) await onAppleLogin();
      else await onLogin();
    } catch (e: any) {
      console.error("Login failed:", e);
      let msg = e.message || "Login failed. Please try again.";
      if (e.code === 'auth/popup-closed-by-user' || e.code === '1001' /* Apple cancelled */) msg = "";
      else if (msg.includes('unauthorized-domain')) msg = "Domain not authorized. Please check Firebase Console.";
      if (msg) setError(msg);
    } finally {
      setIsLoading('');
    }
  };

  const isDark = variant === 'dark';

  return (
    <div className={`game-overlay-panel modern-panel p-8 max-w-sm w-full flex flex-col items-center text-center mx-auto rounded-3xl relative shadow-2xl ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-transparent text-slate-800 ring-1 ring-black/5'}`}>
      
      {onClose && (
        <button 
            onClick={onClose} 
            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}
            aria-label="Close"
        >
            <ICONS.Remove />
        </button>
      )}

      {/* Icon Circle */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 relative shadow-sm ${isDark ? 'bg-slate-800 border border-slate-600 text-slate-400' : 'bg-slate-50 border border-slate-100 text-[var(--accent-blue)]'}`}>
        <div className="scale-[2.0]">
            <ICONS.Lock />
        </div>
        <div className={`absolute -bottom-1 -right-1 bg-[var(--accent-blue)] text-white p-2 rounded-full border-4 shadow-md ${isDark ? 'border-slate-900' : 'border-white'}`}>
            <div className="scale-90"><ICONS.Google /></div>
        </div>
      </div>

      <div className="space-y-3 mb-8 w-full">
        <h3 className={`text-2xl font-black font-display ${isDark ? 'text-white' : 'text-slate-800'}`}>{featureName}</h3>
        <div className="w-12 h-1 bg-[var(--accent-blue)] mx-auto rounded-full opacity-50"></div>
        <p className={`text-sm font-medium leading-relaxed px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>

      <div className="w-full space-y-4">
          {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-red-500 text-xs font-bold text-left animate-shake flex items-center gap-2">
                  <ICONS.Remove /> {error}
              </div>
          )}

<button
            onClick={() => runLogin('google')}
            disabled={!!isLoading}
            className="modern-button w-full py-4 bg-[var(--accent-blue)] border-[var(--accent-blue-shade)] text-white font-black flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/30 hover:bg-blue-500 hover:scale-[1.02] active:scale-100 transition-all disabled:opacity-70 disabled:cursor-wait text-sm rounded-xl"
          >
            {isLoading === 'google' ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                </>
            ) : (
                <>
                    <span>Sign In with Google</span>
                </>
            )}
          </button>
      </div>

      {onResetData && (
          <div className={`mt-6 pt-6 border-t w-full ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
              <button 
                  onClick={onResetData}
                  className="text-[10px] text-red-400 hover:text-red-500 font-bold flex items-center justify-center gap-2 w-full transition-colors"
              >
                  <ICONS.Remove /> Reset Local Data
              </button>
          </div>
      )}
    </div>
  );
};

export default LoginRequiredPanel;
