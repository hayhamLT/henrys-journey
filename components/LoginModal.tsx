
import React from 'react';
import LoginRequiredPanel from './LoginRequiredPanel';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => Promise<void>;
  onAppleLogin?: () => Promise<void>;
  featureName: string;
  description: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, onAppleLogin, featureName, description }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="w-full flex justify-center max-w-sm" onClick={e => e.stopPropagation()}>
        <LoginRequiredPanel
            featureName={featureName}
            description={description}
            onLogin={onLogin}
            onAppleLogin={onAppleLogin}
            onClose={onClose}
            variant="light"
        />
      </div>
    </div>
  );
};

export default LoginModal;