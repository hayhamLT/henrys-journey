
import React, { useRef } from 'react';
import { GameSettings } from '../types';
import { ICONS } from './icons';
import { APP_VERSION } from '../constants/game';

const SettingsGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-[10px] font-black text-slate-500 mb-3 px-1">{title}</h4>
        <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            {children}
        </div>
    </div>
);

const SettingRow: React.FC<{
    label: string;
    icon: React.ReactNode;
    control: React.ReactNode;
    last?: boolean;
}> = ({ label, icon, control, last }) => (
    <div className={`flex items-center justify-between p-4 ${!last ? 'border-b border-white/5' : ''}`}>
        <div className="flex items-center gap-3">
            <div className="text-slate-400">{icon}</div>
            <span className="text-sm font-bold text-slate-200">{label}</span>
        </div>
        <div>{control}</div>
    </div>
);

const VolumeRow: React.FC<{
    label: string;
    icon: React.ReactNode;
    value: number;
    onChange: (v: number) => void;
    last?: boolean;
}> = ({ label, icon, value, onChange, last }) => {
    const pct = Math.round(value * 100);
    return (
        <div className={`flex items-center gap-3 p-4 ${!last ? 'border-b border-white/5' : ''}`}>
            <div className="text-slate-400 shrink-0">{icon}</div>
            <span className="text-sm font-bold text-slate-200 shrink-0 w-14">{label}</span>
            <input
                type="range"
                min={0}
                max={100}
                value={pct}
                onChange={(e) => onChange(Number(e.target.value) / 100)}
                aria-label={`${label} volume`}
                className="flex-grow h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-emerald-400"
                style={{ background: `linear-gradient(to right, var(--accent-green) ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
            />
            <span className="font-display text-xs font-bold text-slate-400 w-9 text-right tabular-nums shrink-0">{pct}%</span>
        </div>
    );
};

interface SettingsTabProps {
    settings: GameSettings;
    onSettingsChange: (newSettings: Partial<GameSettings>) => void;
    onResetProgress: () => void;
    onUnlockAll: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ settings, onSettingsChange, onResetProgress, onUnlockAll }) => {
  const clickTimeoutRef = useRef<any>(null);

  const handleResetClick = () => {
      if (clickTimeoutRef.current) {
          // Double click detected -> Trigger Easter Egg
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
          onUnlockAll();
      } else {
          // Single click detected -> Schedule Reset
          clickTimeoutRef.current = setTimeout(() => {
              clickTimeoutRef.current = null;
              onResetProgress();
          }, 300);
      }
  };

  return (
    <div className="w-full pb-12 pt-2">
        <SettingsGroup title="Sound">
            <VolumeRow
                label="Music"
                icon={settings.musicVolume > 0 ? <ICONS.VolumeUp /> : <ICONS.VolumeMute />}
                value={settings.musicVolume}
                onChange={(v) => onSettingsChange({ musicVolume: v })}
            />
            <VolumeRow
                label="Effects"
                icon={settings.sfxVolume > 0 ? <ICONS.VolumeUp /> : <ICONS.VolumeMute />}
                value={settings.sfxVolume}
                onChange={(v) => onSettingsChange({ sfxVolume: v })}
                last
            />
        </SettingsGroup>

        <SettingsGroup title="Gameplay">
            <SettingRow 
                label="Attract Mode (Auto Demo)" 
                icon={<ICONS.Play />}
                control={
                    <button
                        onClick={() => onSettingsChange({ attractModeEnabled: !settings.attractModeEnabled })}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${settings.attractModeEnabled ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : 'border-white/15 bg-black/20 text-slate-300 hover:bg-white/5'}`}
                    >
                        {settings.attractModeEnabled ? 'On' : 'Off'}
                    </button>
                }
                last
            />
        </SettingsGroup>

        <SettingsGroup title="Data Management">
            <div className="space-y-3">
                {/* Reset Block */}
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-500/5">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-500 shrink-0 mt-1"><ICONS.Remove /></div>
                        <div>
                            <h4 className="text-sm font-bold text-red-100">Factory Reset</h4>
                            <p className="text-xs text-red-200/50 mt-1 max-w-xs">
                                Irreversibly clears all progress, collected items, and settings from this device and your cloud account.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleResetClick}
                        className="shrink-0 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black rounded-xl transition-all active:scale-95"
                    >
                        Reset Data
                    </button>
                </div>
            </div>
        </SettingsGroup>

        <div className="text-center mt-8">
            <p className="text-[10px] text-slate-700 font-mono">
                {APP_VERSION} &bull; {(import.meta as any).env?.MODE || 'Production'}
            </p>
        </div>
    </div>
  );
};

export default SettingsTab;
