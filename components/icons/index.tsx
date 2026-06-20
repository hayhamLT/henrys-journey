// --- CHAT ICON ---
const ChatIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="4" fill="currentColor" fillOpacity="0.10" />
        <rect x="3" y="5" width="18" height="14" rx="4" />
        <path d="M8 13h8M8 9h8" stroke="white" strokeWidth="1.2" />
        <path d="M7 19c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H7z" stroke="white" strokeOpacity="0.18" />
    </svg>
);

import React, { useState, useEffect } from 'react';
import { EyeState, Theme, World, Move, HatId } from '../../types';

const sharedIconProps = {
    className: "ui-icon-3d",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as "round",
  strokeLinejoin: "round" as "round",
  xmlns: "http://www.w3.org/2000/svg"
};

// --- MODERN CLEAN ICONS ---

const HomeIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.14" />
        <path d="M5.8 10.2h12.4" stroke="white" strokeOpacity="0.28" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const GoogleIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const TrophyIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);

const FriendsIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <circle cx="9" cy="7" r="4" fill="currentColor" fillOpacity="0.12" />
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const BuilderIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        <path d="M12.2 5.5h4.6" stroke="white" strokeOpacity="0.28" />
    </svg>
);

const HelpIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
       <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
       <path d="M7.5 7.8h9" stroke="white" strokeOpacity="0.3" />
       <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
       <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const FlameIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3.9.5 1.8 1 2.8z" />
    </svg>
);

const PuzzleIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <path d="M10 3.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5v-6z" />
        <path d="M14 10.5a.5.5 0 0 0-.5-.5h-3v3h3a.5.5 0 0 0 .5-.5v-2z" />
        <path d="M10 21V16a2 2 0 0 1 2-2h5v5a2 2 0 0 1-2 2h-5z" />
    </svg>
);

const CalendarIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

// --- OTHER ICONS ---

const VisionIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="currentColor" fillOpacity="0.1" />
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.18" />
    </svg>
);

const CPUIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" fill="currentColor" fillOpacity="0.13" />
        <rect x="9" y="9" width="6" height="6" fill="currentColor" fillOpacity="0.2" />
        <path d="M6.2 6.5h11.6" stroke="white" strokeOpacity="0.28" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
);

// --- Hats (3D-styled SVG icons) ---
const ConeHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M4 21h16L12 3z" fill="currentColor" fillOpacity="0.25" />
        <path d="M12 3l3.8 9H8.2L12 3z" fill="currentColor" fillOpacity="0.5" />
        <path d="M4 21h16" stroke="currentColor" />
        <path d="M9.2 14.5h5.6" stroke="white" strokeOpacity="0.35" />
    </svg>
);
const TopHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <ellipse cx="12" cy="18" rx="9" ry="2.2" fill="currentColor" fillOpacity="0.28" />
        <rect x="7" y="6" width="10" height="10" rx="2" fill="currentColor" fillOpacity="0.45" />
        <rect x="8" y="7" width="3.5" height="8" rx="1" fill="white" fillOpacity="0.22" />
        <path d="M3 18h18" stroke="currentColor" />
    </svg>
);
const Crown: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M3 19h18l-2-11-5 4-2-6-2 6-5-4z" fill="currentColor" fillOpacity="0.32" />
        <path d="M5 19l1.4-7.7L10 14l2-6 2 6 3.6-2.7L19 19" fill="currentColor" fillOpacity="0.52" />
        <circle cx="8.2" cy="10.6" r="1" fill="white" fillOpacity="0.35" />
        <circle cx="15.8" cy="10.6" r="1" fill="white" fillOpacity="0.35" />
        <path d="M3 19h18" stroke="currentColor" />
    </svg>
);
const BananaHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M5 18c2.5-7.3 7.2-11.4 13-13-1.2 4.2-2 9.2-6.2 14.5-2.4 1.4-4.6 1.2-6.8-1.5z" fill="currentColor" fillOpacity="0.35" />
        <path d="M7 17.3c3.1-6.4 7.2-9.4 10.3-10.8" stroke="white" strokeOpacity="0.35" />
    </svg>
);
const PropellerHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <ellipse cx="12" cy="15.5" rx="6" ry="2.2" fill="currentColor" fillOpacity="0.35" />
        <path d="M12 15.5V9" stroke="currentColor" />
        <path d="M12 9c2.5-3 5.2-2.8 6.8-1.4-2.2 1.8-4.4 2.4-6.8 1.4z" fill="currentColor" fillOpacity="0.48" />
        <path d="M12 9c-2.5-3-5.2-2.8-6.8-1.4 2.2 1.8 4.4 2.4 6.8 1.4z" fill="currentColor" fillOpacity="0.24" />
    </svg>
);
const VikingHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M5 16.5h14v-3.2A7 7 0 0 0 12 6a7 7 0 0 0-7 7.3z" fill="currentColor" fillOpacity="0.42" />
        <path d="M5 13.6c-1.5-.8-2-2.2-1.2-3.6 2.1.2 3.3 1.2 3.7 2.9" fill="currentColor" fillOpacity="0.2" />
        <path d="M19 13.6c1.5-.8 2-2.2 1.2-3.6-2.1.2-3.3 1.2-3.7 2.9" fill="currentColor" fillOpacity="0.2" />
        <path d="M8 9.2h8" stroke="white" strokeOpacity="0.28" />
    </svg>
);
const ChefHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M6 14h12v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="currentColor" fillOpacity="0.36" />
        <path d="M6 14c0-3.1 1.4-5 3.2-5.2.3-2 1.7-3.2 2.8-3.2 1.3 0 2.5.9 2.9 3.2 1.8.1 3.1 2 3.1 5.2z" fill="currentColor" fillOpacity="0.52" />
        <path d="M8 10.2h8" stroke="white" strokeOpacity="0.28" />
    </svg>
);
const CowboyHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M3 17c2 0 2-1.6 4-1.6h10c2 0 2 1.6 4 1.6" stroke="currentColor" />
        <path d="M8 15.2v-5.4A4.3 4.3 0 0 1 12.3 5h-.6A4.3 4.3 0 0 1 16 9.8v5.4" fill="currentColor" fillOpacity="0.44" />
        <path d="M9 9h6" stroke="white" strokeOpacity="0.3" />
    </svg>
);
const WizardHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M4 20h16" stroke="currentColor" />
        <path d="M12 20L5.5 10.5 12 3l6.5 7.5z" fill="currentColor" fillOpacity="0.44" />
        <path d="M9.4 10.2h5.2" stroke="white" strokeOpacity="0.32" />
        <circle cx="12" cy="8" r="1" fill="white" fillOpacity="0.5" />
    </svg>
);
const HeadphonesHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M7 14V9a5 5 0 0 1 10 0v5" stroke="currentColor" />
        <rect x="3" y="13.5" width="4" height="6.5" rx="1.4" fill="currentColor" fillOpacity="0.45" />
        <rect x="17" y="13.5" width="4" height="6.5" rx="1.4" fill="currentColor" fillOpacity="0.45" />
        <rect x="4" y="15" width="2" height="2" rx="0.6" fill="white" fillOpacity="0.28" />
        <rect x="18" y="15" width="2" height="2" rx="0.6" fill="white" fillOpacity="0.28" />
    </svg>
);
const BaseballCap: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M4 16h12a4.2 4.2 0 0 0 4-4.2V11a5.2 5.2 0 0 0-5.2-5.2H9.2A5.2 5.2 0 0 0 4 11z" fill="currentColor" fillOpacity="0.46" />
        <path d="M16 16h5" stroke="currentColor" />
        <path d="M9.2 8.1h5.6" stroke="white" strokeOpacity="0.28" />
    </svg>
);
const HardHat: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M2.5 16h19" stroke="currentColor" />
        <path d="M4 16c0-5.8 3-9.5 8-9.5s8 3.7 8 9.5" fill="currentColor" fillOpacity="0.42" />
        <path d="M12 7v4" stroke="white" strokeOpacity="0.38" />
    </svg>
);
const GlassesIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <circle cx="6.5" cy="12" r="3.8" fill="currentColor" fillOpacity="0.2" />
        <circle cx="17.5" cy="12" r="3.8" fill="currentColor" fillOpacity="0.2" />
        <circle cx="6.5" cy="12" r="3.8" />
        <circle cx="17.5" cy="12" r="3.8" />
        <line x1="10.3" y1="12" x2="13.7" y2="12" />
    </svg>
);
const BeanieIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M4 20h16v-4.2c0-4-2-7.8-8-7.8s-8 3.8-8 7.8z" fill="currentColor" fillOpacity="0.42" />
        <path d="M7 14.3h10" stroke="white" strokeOpacity="0.3" />
        <circle cx="12" cy="5.2" r="1.1" fill="currentColor" fillOpacity="0.7" />
    </svg>
);
const SombreroIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.5">
        <path d="M2.5 17c2 0 2-1.5 3.8-1.5h11.4c1.8 0 1.8 1.5 3.8 1.5" stroke="currentColor" />
        <path d="M8.2 15.2l1.6-7.2h4.4l1.6 7.2" fill="currentColor" fillOpacity="0.42" />
        <path d="M9.6 11.5h4.8" stroke="white" strokeOpacity="0.3" />
    </svg>
);

const PlayIcon: React.FC = () => (
    <svg {...sharedIconProps} stroke="none">
        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" fillOpacity="0.9" />
        <path d="M7.6 7.4l7.1 4.6-7.1 4.6z" fill="white" fillOpacity="0.22" />
    </svg>
);

const BackspaceIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" fill="currentColor" fillOpacity="0.16" />
        <path d="M7.6 8.4h11" stroke="white" strokeOpacity="0.3" />
        <line x1="18" y1="9" x2="12" y2="15" />
        <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
);

const ArrowUpIcon: React.FC = () => <svg {...sharedIconProps}><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>;
const ArrowDownIcon: React.FC = () => <svg {...sharedIconProps}><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>;
const ArrowLeftIcon: React.FC = () => <svg {...sharedIconProps}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const ArrowRightIcon: React.FC = () => <svg {...sharedIconProps}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;

const CheckIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const MenuIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

const SettingsIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.06" stroke="none" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        <path d="M8 7.2h8" stroke="white" strokeOpacity="0.24" />
    </svg>
);

const RemoveIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const LockIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="currentColor" fillOpacity="0.18" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <path d="M7.8 14h8.4" stroke="white" strokeOpacity="0.28" />
    </svg>
);

const MovesIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.09" stroke="none" />
        <polyline points="5 9 2 12 5 15" />
        <polyline points="9 5 12 2 15 5" />
        <polyline points="15 19 12 22 9 19" />
        <polyline points="19 9 22 12 19 15" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.2" stroke="none" />
    </svg>
);

// Builder Tool Icons - 3D-styled vectors
const WallToolIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="#d8ac83" stroke="#8a5b38"/>
        <rect x="4" y="4" width="16" height="7" rx="1.2" fill="#e4bc95" stroke="none"/>
        <line x1="2.5" y1="9" x2="21.5" y2="9" stroke="#8a5b38"/>
        <line x1="2.5" y1="15" x2="21.5" y2="15" stroke="#8a5b38"/>
        <line x1="9" y1="2.5" x2="9" y2="9" stroke="#8a5b38"/>
        <line x1="15" y1="9" x2="15" y2="15" stroke="#8a5b38"/>
        <line x1="9" y1="15" x2="9" y2="21.5" stroke="#8a5b38"/>
    </svg>
);

const BombToolIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <circle cx="12" cy="12" r="9" fill="#2f3640" stroke="#111827"/>
        <ellipse cx="9" cy="9" rx="2.8" ry="1.8" fill="#ffffff" fillOpacity="0.28" />
        <path d="M12 3V1" stroke="#111827" strokeWidth="2"/>
        <rect x="10.7" y="0" width="2.6" height="2.3" rx="0.4" fill="#ef4444"/>
    </svg>
);

const TrapToolIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" fill="#b91c1c" stroke="#7f1d1d" />
        <path d="M5 16l2.1-4 2.1 4 2.1-4 2.1 4 2.1-4 2.1 4" stroke="#fecaca" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8h14" stroke="#ef4444" strokeOpacity="0.85" />
    </svg>
);

const BoostToolIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <circle cx="12" cy="12" r="8.5" fill="#155e75" stroke="#0e7490" />
        <path d="M9 16l6-4-6-4v3H6v2h3z" fill="#67e8f9" stroke="#a5f3fc" />
        <circle cx="12" cy="12" r="3.2" fill="#06b6d4" fillOpacity="0.55" stroke="none" />
    </svg>
);

const GemToolIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <path d="M12 2l9 6-9 14-9-14 9-6z" fill="#4ECDC4" stroke="#2c3e50"/>
        <path d="M12 2v20" stroke="#d9fffb" strokeOpacity="0.55"/>
        <path d="M3 8h18" stroke="#d9fffb" strokeOpacity="0.45"/>
        <path d="M6.5 6l5.5 8L17.5 6" stroke="#93fff4" strokeOpacity="0.5"/>
    </svg>
);

const HoleTool2D: React.FC = () => (
    <svg {...sharedIconProps}>
        <rect x="2" y="2" width="20" height="20" rx="2.5" fill="#0b1020" stroke="#334155"/>
        <ellipse cx="12" cy="12" rx="6.2" ry="5.3" fill="#020617" />
        <ellipse cx="10.6" cy="10.8" rx="2.2" ry="1.4" fill="#1e293b" fillOpacity="0.85" />
    </svg>
);

const CrumblingFloorTool2D: React.FC = () => (
    <svg {...sharedIconProps}>
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#d6dde7" stroke="#7d8ca5"/>
        <path d="M5 8h14" stroke="#f8fafc" strokeOpacity="0.5" />
        <path d="M7 16l3-2 2 2 2-3 3 2" stroke="#64748b" strokeWidth="1.5" fill="none"/>
        <path d="M8 8l8 8" stroke="#94A3B8"/>
    </svg>
);

const KeyTool2D: React.FC<{ color?: string }> = ({ color }) => (
    <svg {...sharedIconProps} viewBox="0 0 24 24" stroke={color || "#F59E0B"}>
        <circle cx="7" cy="16" r="4.2" fill={color || "#F59E0B"} fillOpacity="0.2" />
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        <path d="M5.8 14.8l2.4 2.4" stroke="white" strokeOpacity="0.35" />
    </svg>
);

const LockTool2D: React.FC<{ color?: string }> = ({ color }) => (
    <svg {...sharedIconProps} viewBox="0 0 24 24" stroke={color || "#F97316"}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill={color || "#F97316"} fillOpacity="0.2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <path d="M8 14h8" stroke="white" strokeOpacity="0.35" />
    </svg>
);

const MapIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" fill="currentColor" fillOpacity="0.12" />
        <path d="M3 8.3l5-2.5 8 3.3 5-2.5" stroke="white" strokeOpacity="0.28" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
);

const ShopIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor" fillOpacity="0.12" />
        <path d="M5 6.8h14" stroke="white" strokeOpacity="0.3" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

const UserIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.12" />
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const CommunityIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <circle cx="9" cy="7" r="4" fill="currentColor" fillOpacity="0.12" />
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const MailIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="currentColor" fillOpacity="0.12" />
        <path d="M4.8 6.8h14.4" stroke="white" strokeOpacity="0.28" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const SearchIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" fill="currentColor" fillOpacity="0.08" />
        <path d="M6.5 7.8h5.4" stroke="white" strokeOpacity="0.3" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const InfoIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
        <path d="M7.5 7.8h9" stroke="white" strokeOpacity="0.3" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const FastForwardIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <polygon points="13 19 22 12 13 5 13 19" />
        <polygon points="2 19 11 12 2 5 2 19" />
    </svg>
);

const UploadIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const AddUserIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
);

const PhaseChargeIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.7">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" fillOpacity="0.22" />
        <path d="M11 6h4" stroke="white" strokeOpacity="0.3" />
    </svg>
);

const ExitIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const VolumeUpIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
);

const VolumeMuteIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);

const StarIcon: React.FC<{ filled?: boolean; width?: string; height?: string }> = ({ filled, width = "24", height = "24" }) => (
    <svg className="ui-icon-3d" width={width} height={height} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {filled && <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" fillOpacity="0.92" stroke="none" />}
        {filled && <path d="M8.6 8.5h6.8" stroke="white" strokeOpacity="0.28" />}
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const DiceIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="currentColor" fillOpacity="0.15" />
        <path d="M5.5 6.8h13" stroke="white" strokeOpacity="0.3" />
        <path d="M16 8h.01" />
        <path d="M8 8h.01" />
        <path d="M8 16h.01" />
        <path d="M16 16h.01" />
        <path d="M12 12h.01" />
    </svg>
);

const SaveIcon: React.FC = () => (
    <svg {...sharedIconProps} strokeWidth="1.8">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" fill="currentColor" fillOpacity="0.12" />
        <path d="M6.5 6.8h8.3" stroke="white" strokeOpacity="0.3" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const PlusIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const MinusIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ShareIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const WorldIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const RetryIcon: React.FC = () => (
    <svg {...sharedIconProps}>
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

// Henry Bot Logo - Voxel Style (Square Features) - Now Animated!
const BotIcon: React.FC = () => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [lookOffset, setLookOffset] = useState(0); // -0.5 (left), 0 (center), 0.5 (right)
  const [mouthState, setMouthState] = useState<'neutral' | 'happy'>('neutral');

  useEffect(() => {
        let blinkLoop: number | null = null;
        let blinkClose: number | null = null;
        let blinkDoubleStart: number | null = null;
        let blinkDoubleEnd: number | null = null;
        let lookLoop: number | null = null;
        let mouthLoop: number | null = null;

        const scheduleBlink = () => {
            const nextBlink = Math.random() * 2600 + 1200;
            blinkLoop = window.setTimeout(() => {
                setIsBlinking(true);
                blinkClose = window.setTimeout(() => {
                    setIsBlinking(false);
                    if (Math.random() < 0.2) {
                        blinkDoubleStart = window.setTimeout(() => {
                            setIsBlinking(true);
                            blinkDoubleEnd = window.setTimeout(() => setIsBlinking(false), 80);
                        }, 70);
                    }
                }, 95);
                scheduleBlink();
            }, nextBlink);
        };

        const scheduleLook = () => {
            const nextLook = Math.random() * 4200 + 1800;
            lookLoop = window.setTimeout(() => {
                const r = Math.random();
                if (r < 0.3) setLookOffset(-0.5);
                else if (r < 0.6) setLookOffset(0.5);
                else setLookOffset(0);
                scheduleLook();
            }, nextLook);
        };

        const scheduleMouth = () => {
            const nextMouth = Math.random() * 5200 + 2800;
            mouthLoop = window.setTimeout(() => {
                setMouthState(prev => prev === 'neutral' ? 'happy' : 'neutral');
                scheduleMouth();
            }, nextMouth);
        };

        scheduleBlink();
        scheduleLook();
        scheduleMouth();

        return () => {
            if (blinkLoop !== null) clearTimeout(blinkLoop);
            if (blinkClose !== null) clearTimeout(blinkClose);
            if (blinkDoubleStart !== null) clearTimeout(blinkDoubleStart);
            if (blinkDoubleEnd !== null) clearTimeout(blinkDoubleEnd);
            if (lookLoop !== null) clearTimeout(lookLoop);
            if (mouthLoop !== null) clearTimeout(mouthLoop);
        };
  }, []);

    const eyeHeight = isBlinking ? 0.75 : 2.8;
    const eyeY = isBlinking ? 13.15 : 12.1;
    const pupilY = 13.35;
    const pupilOffset = lookOffset * 0.65;

  return (
    <svg {...sharedIconProps} viewBox="0 0 24 24" fill="none" stroke="none">
        {/* Base Face (Rounded Cube) */}
        <rect width="24" height="24" rx="6" fill="#F2C48D"/>
        
        {/* Subtle Gradient/Shadow on Face Bottom for Volume */}
        <rect x="0" y="12" width="24" height="12" rx="6" fill="#E0AC69" fillOpacity="0.3" />
        
        {/* Hair Cap (Blocky) */}
        <path d="M0 6C0 2.68629 2.68629 0 6 0H18C21.3137 0 24 2.68629 24 6V9.5H0V6Z" fill="#634236"/>
        
        {/* Hair Highlight (Top) */}
        <path d="M2 3C2 2.5 6 1.5 12 1.5C18 1.5 22 2.5 22 3" stroke="#8D5E4D" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Drop Shadow from Hair */}
        <path d="M0 9.5H24V11H0V9.5Z" fill="#000" fillOpacity="0.1"/>

                {/* Lowpoly eyes with random blink/look behavior */}
                <g style={{ transition: 'all 120ms ease-out' }}>
                    <rect x="6.2" y={eyeY} width="3.6" height={eyeHeight} rx="0.6" fill="#FFFFFF" />
                    <rect x="14.2" y={eyeY} width="3.6" height={eyeHeight} rx="0.6" fill="#FFFFFF" />
                    {!isBlinking && (
                        <>
                            <rect x={7.45 + pupilOffset} y={pupilY} width="1.1" height="1.1" rx="0.15" fill="#1F2937" />
                            <rect x={15.45 + pupilOffset} y={pupilY} width="1.1" height="1.1" rx="0.15" fill="#1F2937" />
                        </>
                    )}
                    <rect x="6.2" y={eyeY} width="3.6" height={eyeHeight} rx="0.6" fill="none" stroke="#2C3E50" strokeWidth="0.25" strokeOpacity="0.55" />
                    <rect x="14.2" y={eyeY} width="3.6" height={eyeHeight} rx="0.6" fill="none" stroke="#2C3E50" strokeWidth="0.25" strokeOpacity="0.55" />
                </g>

                {/* Minimal mouth expression toggle */}
                {mouthState === 'happy' ? (
                    <path d="M9 17.25C10.1 18.2 11.1 18.65 12 18.65C12.9 18.65 13.9 18.2 15 17.25" stroke="#6B4C3B" strokeWidth="0.9" strokeLinecap="round" fill="none" />
                ) : (
                    <rect x="10" y="17.4" width="4" height="0.75" rx="0.3" fill="#6B4C3B" fillOpacity="0.9" />
                )}
    </svg>
  );
};

export const ICONS = {
  Up: ArrowUpIcon,
  Down: ArrowDownIcon,
  Left: ArrowLeftIcon,
  Right: ArrowRightIcon,
  Enter: () => <svg {...sharedIconProps}><polyline points="9 10 4 15 9 20" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></svg>,
  Remove: RemoveIcon,
  Play: PlayIcon,
  Backspace: BackspaceIcon,
  Menu: MenuIcon,
  Settings: SettingsIcon,
  Home: HomeIcon,
  Vision: VisionIcon,
  CPU: CPUIcon,
  Builder: BuilderIcon,
  Shop: ShopIcon,
  Friends: FriendsIcon,
  Trophy: TrophyIcon,
  User: UserIcon,
  Community: CommunityIcon,
  Mail: MailIcon,
  Search: SearchIcon,
  Info: InfoIcon,
  Check: CheckIcon,
  FastForward: FastForwardIcon,
  Upload: UploadIcon,
  AddUser: AddUserIcon,
  PhaseCharge: PhaseChargeIcon,
  Map: MapIcon,
  Help: HelpIcon,
  Exit: ExitIcon,
  Lock: LockIcon,
  Moves: MovesIcon,
  Dice: DiceIcon,
  Save: SaveIcon,
  Plus: PlusIcon,
  Minus: MinusIcon,
  Flame: FlameIcon,
  Puzzle: PuzzleIcon,
  Calendar: CalendarIcon,
  Share: ShareIcon,
  Trash: TrashIcon,
  World: WorldIcon,
  Retry: RetryIcon,
  
  // Custom Rendered Icons
  Planet: ({ world, isLocked, size = 48 }: { world?: any, isLocked?: boolean, size?: number }) => (
    <div style={{ 
        width: size, 
        height: size, 
        background: isLocked ? '#334155' : 'currentColor', 
        borderRadius: '12px',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: isLocked ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
        position: 'relative' 
    }}>
        {isLocked && <div className="text-white/50"><LockIcon /></div>}
    </div>
  ),
  
  // 2D Tool Icons for Builder
  WallTool: WallToolIcon,
  HoleTool2D: HoleTool2D,
  BombTool: BombToolIcon,
    TrapTool: TrapToolIcon,
    BoostTool: BoostToolIcon,
  GemTool: GemToolIcon,
  CrumblingFloorTool2D: CrumblingFloorTool2D,
  KeyTool2D: KeyTool2D,
  LockTool2D: LockTool2D,
  PortalTool: ({ color }: { color?: string }) => (
      <svg {...sharedIconProps} viewBox="0 0 24 24" stroke={color || "#4ECDC4"}>
          <circle cx="12" cy="12" r="10" fill={color || "#4ECDC4"} fillOpacity="0.12" />
          <circle cx="12" cy="12" r="8.3" fill="none" strokeWidth="2" />
          <circle cx="12" cy="12" r="5.5" fill="none" strokeOpacity="0.55" />
          <circle cx="12" cy="12" r="3.6" fill={color || "#4ECDC4"} stroke="none" />
          <circle cx="10.8" cy="10.8" r="1.1" fill="white" fillOpacity="0.4" stroke="none" />
      </svg>
  ),

  // Empty Placeholders for types
  Bot: BotIcon,
  Mila: () => null,
  Bomb: () => null,
  Gem: GemToolIcon,
  CircuitKey: () => null,
  PurpleKey: () => null,
  BlueKey: () => null,
  RedKey: () => null,
  OrangeKey: () => null,
  CyanKey: () => null,
  PhaseShifter: () => null,
  Target: () => null,
  ForceField: () => null,
  Portal: () => null,
  Wall: () => null,
  
  // Hats
  ConeHat,
  TopHat,
  Crown,
  BananaHat,
  PropellerHat,
  VikingHat,
  ChefHat,
  CowboyHat,
  WizardHat,
  HeadphonesHat,
  BaseballCap,
  HardHat,
  GlassesIcon,
  BeanieIcon,
  SombreroIcon,
  NoHat: () => <svg {...sharedIconProps} stroke="currentColor"><circle cx="12" cy="12" r="10" strokeDasharray="4 4"/></svg>,
  Google: GoogleIcon,
  Time: () => <svg {...sharedIconProps}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Score: () => <svg {...sharedIconProps}><circle cx="12" cy="12" r="8" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>, 
  Star: StarIcon,
    VolumeUp: VolumeUpIcon,
    VolumeMute: VolumeMuteIcon,
    Chat: ChatIcon,
};
