

import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from './icons';
import { UserProfile } from '../types';

interface ProfileModalProps {
  user: UserProfile;
  isGuest: boolean;
  totalScore: number;
  completedLevels: number;
  onClose: () => void;
  onUpdateName: (name: string) => void;
  onUpdatePhoto: (photo: string) => void;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isGuest, totalScore, completedLevels, onClose, onUpdateName, onUpdatePhoto, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state if the user prop updates (e.g. after a successful save)
  useEffect(() => {
      setNewName(user.name);
  }, [user.name]);

  const handleSave = () => {
    if (newName.trim()) {
      onUpdateName(newName.trim());
      setIsEditing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Basic validation
      if (file.size > 5 * 1024 * 1024) {
          alert("File is too large. Max 5MB.");
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_SIZE = 256; // Resize to keep data usage low for Firestore
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                  if (width > MAX_SIZE) {
                      height *= MAX_SIZE / width;
                      width = MAX_SIZE;
                  }
              } else {
                  if (height > MAX_SIZE) {
                      width *= MAX_SIZE / height;
                      height = MAX_SIZE;
                  }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // Compress slightly
                  onUpdatePhoto(dataUrl);
              }
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="relative w-full max-w-md perspective-1000" onClick={e => e.stopPropagation()}>
        
        {/* ID Card Container - Matching dark theme of LoginRequiredPanel */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="text-[var(--accent-blue)]"><ICONS.User /></div>
                    <span className="font-display font-black tracking-wide text-white text-sm">Explorer Card</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white p-1"><ICONS.Remove /></button>
            </div>

            {/* Body */}
            <div className="p-8 flex flex-col items-center">
                
                {/* Hidden Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                />

                {/* Avatar Section */}
                <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-green)]">
                        <img 
                            src={user.picture || 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png'} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover bg-black border-2 border-slate-900 transition-opacity group-hover:opacity-50"
                        />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black/70 rounded-full p-2 backdrop-blur-sm flex items-center justify-center gap-1 px-3 border border-white/20">
                            <ICONS.Upload />
                            <span className="text-[10px] font-bold text-white">Upload</span>
                        </div>
                    </div>
                    {isGuest && <div className="absolute bottom-0 right-0 bg-slate-700 text-[8px] font-bold px-2 py-0.5 rounded-full border border-slate-900 text-white">GUEST</div>}
                </div>

                {/* Name Editing */}
                {isEditing ? (
                    <div className="flex items-center gap-2 mb-6 w-full max-w-[200px]">
                        <input 
                            type="text" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-black/40 border border-slate-600 rounded px-3 py-2 text-center font-bold text-white w-full focus:border-[var(--accent-green)] outline-none"
                            autoFocus
                            maxLength={15}
                        />
                        <button onClick={handleSave} className="bg-[var(--accent-green)] text-black p-2 rounded hover:scale-105 transition-transform"><ICONS.Check /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-6 group cursor-pointer" onClick={() => setIsEditing(true)}>
                        <h2 className="text-2xl font-black text-white tracking-wide">{user.name}</h2>
                        {!isGuest && (
                            <div className="text-slate-500 group-hover:text-white transition-colors">
                                <div className="scale-75">✎</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center shadow-sm">
                        <div className="text-[var(--accent-yellow)] mb-1 flex justify-center scale-110"><ICONS.Score /></div>
                        <div className="text-xl font-black text-white">{totalScore.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 tracking-wide font-bold">Total Score</div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-center shadow-sm">
                        <div className="text-[var(--accent-green)] mb-1 flex justify-center scale-110"><ICONS.Check /></div>
                        <div className="text-xl font-black text-white">{completedLevels}</div>
                        <div className="text-[10px] text-slate-400 tracking-wide font-bold">Levels Done</div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="w-full border-t border-slate-700 pt-4 flex justify-between items-center">
                    <div className="text-[10px] text-slate-500 font-mono">
                        ID: {user.uid ? user.uid.slice(0, 8) + '...' : 'N/A'}
                    </div>
                    <button onClick={onLogout} className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-2 px-3 py-2 rounded hover:bg-red-500/10 transition-colors tracking-wide">
                        <ICONS.Exit /> Sign Out
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;