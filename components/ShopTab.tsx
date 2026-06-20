
import React, { useState, useMemo, Suspense, useEffect, useRef, createRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Hat, HatState, HatId, CharacterAppearance } from '../types';
import { ICONS } from './icons';
import { HATS } from './constants/shop';
import { HatPreview, VoxelHat } from './Models3D';
import AnimatedNumber from './AnimatedNumber';
import { OrbitControls, View, OrthographicCamera } from '@react-three/drei';
import { CoinIcon, CoinAmount } from './CoinIcon';

interface ShopTabProps {
  totalScore: number;
  hatState: HatState;
  onBuyHat: (hatId: HatId, price: number) => void;
  onEquipHat: (hatId: HatId) => void;
  appearance?: CharacterAppearance;
  onUpdateAppearance?: (newAppearance: CharacterAppearance) => void;
  autoSolvers?: number;
  onBuyConsumable?: (id: string, price: number) => void;
}

// Force Context Cleanup Helper
const ContextDisposer = () => {
  const { gl } = useThree();
  useEffect(() => {
    return () => {
        gl.dispose();
    };
  }, [gl]);
  return null;
}

// One <View> per hat — rendered into the per-card tracked div by the single
// shared Canvas at the bottom of the gear tab. Replaces the old one-Canvas-
// per-hat approach that exhausted WebGL contexts.
const HatThumbView: React.FC<{ id: HatId; track: React.MutableRefObject<HTMLElement> }> = React.memo(({ id, track }) => (
    <View track={track}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        <group rotation={[0.3, Math.PI / 4, 0]} position={[0, -0.35, 0]} scale={1.8}>
            <VoxelHat id={id} />
        </group>
        <OrthographicCamera makeDefault zoom={32} position={[0, 5, 5]} onUpdate={(c) => c.lookAt(0, 0, 0)} />
    </View>
));

// Color Presets
const COLORS = {
    skin: ['#FFE0BD', '#F2C48D', '#C68642', '#8D5524'],
    hair: ['#634236', '#0F0F0F', '#E6BE8A', '#A52A2A'],
    eyes: ['#333333', '#2C3E50', '#2980B9', '#27AE60'],
    clothes: ['#FF7675', '#74B9FF', '#55EFC4', '#FDCB6E']
};

const ColorPicker: React.FC<{ 
    colors: string[], 
    selected: string, 
    onSelect: (c: string) => void, 
    label: string 
}> = ({ colors, selected, onSelect, label }) => (
    <div className="flex flex-col gap-3 mb-4">
        <h4 className="text-[10px] font-black text-white/40 tracking-wide px-1">{label}</h4>
        <div className="flex flex-wrap gap-3">
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onSelect(c)}
                    className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full shadow-sm transition-all relative flex items-center justify-center ${selected === c ? 'scale-110 ring-2 ring-white z-10' : 'hover:scale-105 ring-1 ring-white/10'}`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                >
                    {selected === c && (
                        <div className={`text-white drop-shadow-md scale-75 ${['#FFFFFF', '#F2C48D', '#E6BE8A', '#FFE0BD'].includes(c) ? 'text-black/50' : ''}`}>
                            <ICONS.Check />
                        </div>
                    )}
                </button>
            ))}
        </div>
    </div>
);

const ShopTab: React.FC<ShopTabProps> = ({ totalScore, hatState, onBuyHat, onEquipHat, appearance, onUpdateAppearance, autoSolvers = 0, onBuyConsumable }) => {
  const [selectedHatId, setSelectedHatId] = useState<HatId>(hatState.equipped);
  const [activeTab, setActiveTab] = useState<'hero' | 'gear' | 'tools'>('hero');
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024); // Use lg breakpoint
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle Scroll for Parallax Clouds
  useEffect(() => {
      document.body.style.setProperty('--scroll-y', '0px');
      return () => {
          document.body.style.setProperty('--scroll-y', '0px');
      };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      requestAnimationFrame(() => {
          document.body.style.setProperty('--scroll-y', `${scrollTop}px`);
      });
  };

  const allHatOptions: Hat[] = useMemo(() => [
    { id: 'none', name: 'None', price: 0, model: ICONS.NoHat },
    ...HATS,
  ], []);

  // All hat thumbnails share ONE WebGL context (drei <View>) instead of one
  // <Canvas> each — 15 contexts would blow past the browser's ~16-context cap
  // and leave thumbnails blank. rootRef is the shared canvas's event source.
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
  allHatOptions.forEach(h => {
    if (!thumbRefs.current[h.id]) thumbRefs.current[h.id] = createRef<HTMLDivElement>();
  });

  useEffect(() => {
      setSelectedHatId(hatState.equipped);
  }, [hatState.equipped]);

  const handleHatClick = (hat: Hat) => {
      setSelectedHatId(hat.id);
      
      const isOwned = hatState.unlocked.includes(hat.id);
      const canAfford = totalScore >= hat.price;

      if (isOwned) {
          onEquipHat(hat.id);
      } else if (canAfford) {
          onBuyHat(hat.id, hat.price);
          onEquipHat(hat.id);
      }
  };

  const updateStyle = (key: keyof CharacterAppearance, value: any) => {
      if (onUpdateAppearance && appearance) {
          onUpdateAppearance({ ...appearance, [key]: value });
      }
  };

  const selectedHatInfo = allHatOptions.find(h => h.id === selectedHatId);
  const isUnlocked = hatState.unlocked.includes(selectedHatId);
  
  const cameraZ = isMobile ? 5.5 : 6.5;
  const targetY = 0.0;
  const cameraProps = { position: [0, 0, cameraZ] as any, fov: 35 }; 

  return (
    <div ref={rootRef} className="w-full h-full flex flex-col bg-transparent overflow-hidden relative animate-in fade-in duration-300">

      {/* Integrated Container */}
      <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* LEFT: 3D Showcase */}
          <div className={`relative bg-black/20 border-b lg:border-b-0 lg:border-r border-white/10 shrink-0 flex flex-col items-center justify-center overflow-hidden
              ${isMobile ? 'h-[40%] w-full' : 'w-[400px] h-full'}
          `}>
             {/* 3D Canvas */}
             <div className="w-full h-full relative z-10">
                 <Canvas 
                    key={isMobile ? 'mobile' : 'desktop'} 
                    shadows
                    dpr={[1, 1.5]} 
                    gl={{ alpha: true, antialias: true, powerPreference: "default" }} 
                    camera={cameraProps}
                 >
                    <ContextDisposer />
                    <Suspense fallback={null}>
                        <ambientLight intensity={0.9} />
                        <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={1.2} castShadow />
                        <spotLight position={[-5, 5, 5]} angle={0.5} penumbra={1} intensity={0.5} color="#4ECDC4" />
                        
                        <group position={[0, 0, 0]}>
                            <HatPreview hatId={selectedHatId} appearance={appearance} />
                        </group>
                        
                        <OrbitControls 
                            enableZoom={false} 
                            enablePan={false} 
                            minPolarAngle={Math.PI/2.5} 
                            maxPolarAngle={Math.PI/1.9} 
                            target={[0, targetY, 0]} 
                            autoRotate={activeTab === 'hero'}
                            autoRotateSpeed={0.8}
                        />
                    </Suspense>
                 </Canvas>
             </div>

             {/* Info Overlay (Floating Price Tag for Locked Items) */}
             {activeTab === 'gear' && selectedHatInfo && selectedHatInfo.price > 0 && !isUnlocked && (
                 <div className="absolute bottom-6 w-full flex justify-center pointer-events-none z-20">
                     <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/80 rounded-full border border-white/20 shadow-lg backdrop-blur-sm animate-bounce">
                         <span className="text-[10px] font-bold text-[var(--accent-yellow)] flex gap-1 items-center tracking-wide">
                             <ICONS.Lock /> {totalScore >= selectedHatInfo.price ? 'Tap to Unlock' : 'Locked'}
                         </span>
                     </div>
                 </div>
             )}
          </div>

          {/* RIGHT: Controls - Dark Glass */}
          <div className="flex-1 flex flex-col min-h-0 bg-black/60 backdrop-blur-xl relative">
              
              {/* Header (Standard Height h-16 lg:h-20) */}
              <div className="h-16 lg:h-20 px-4 lg:px-6 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 shrink-0 flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                      <div className="text-[var(--accent-magenta)] scale-125"><ICONS.Shop /></div>
                      <div>
                          <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-wide">Savings Shop</h2>
                          <p className="text-xs text-white/50 font-medium">Spend your coins wisely</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20 shadow-sm">
                      <CoinIcon className="text-base" />
                      <span className="font-black text-sm"><AnimatedNumber value={totalScore} /></span>
                  </div>
              </div>
              
              {/* Tab Switcher (Below Header) */}
              <div className="px-4 pt-4 pb-2 shrink-0">
                  <div className="flex p-1 bg-black/30 rounded-lg border border-white/5">
                      <button
                          onClick={() => setActiveTab('hero')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'hero' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                      >
                          <ICONS.User /> <span className="hidden sm:inline">Hero</span>
                      </button>
                      <button
                          onClick={() => setActiveTab('gear')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'gear' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                      >
                          <ICONS.Crown /> <span className="hidden sm:inline">Headgear</span>
                      </button>
                      <button
                          onClick={() => setActiveTab('tools')}
                          className={`flex-1 py-2 text-[10px] font-bold rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'tools' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                      >
                          <ICONS.CPU /> <span className="hidden sm:inline">Tools</span>
                      </button>
                  </div>
              </div>

              {/* List (Scrollable) */}
              <div 
                className="flex-grow overflow-y-auto no-scrollbar p-4 lg:p-6"
                onScroll={handleScroll}
              >
                {activeTab === 'hero' ? (
                    <div className="space-y-6 max-w-xl mx-auto pb-8">
                        {/* Identity Section */}
                        <div>
                            <h4 className="text-[10px] font-black text-white/40 tracking-wide mb-3 px-1">Identity</h4>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => updateStyle('model', 'henry')}
                                    className={`flex-1 py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        (appearance?.model || 'henry') === 'henry'
                                        ? 'bg-[var(--accent-blue)]/20 border-[var(--accent-blue)] text-[var(--accent-blue)]'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-[11px] font-black">Henry</span>
                                </button>
                                <button
                                    onClick={() => updateStyle('model', 'mila')}
                                    className={`flex-1 py-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                        appearance?.model === 'mila'
                                        ? 'bg-[var(--accent-magenta)]/20 border-[var(--accent-magenta)] text-[var(--accent-magenta)]'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="text-[11px] font-black">Mila</span>
                                </button>
                            </div>
                        </div>

                        {/* Features Group */}
                        <div className="space-y-2">
                            <div className="text-[10px] font-black text-white/30 tracking-wide border-b border-white/10 pb-2 mb-2">Features</div>
                            <ColorPicker 
                                colors={COLORS.skin} 
                                selected={appearance?.skinColor || '#F2C48D'} 
                                onSelect={(c) => updateStyle('skinColor', c)} 
                                label="Skin Tone" 
                            />
                            <ColorPicker 
                                colors={COLORS.hair} 
                                selected={appearance?.hairColor || '#634236'} 
                                onSelect={(c) => updateStyle('hairColor', c)} 
                                label="Hair Style" 
                            />
                            <ColorPicker 
                                colors={COLORS.eyes} 
                                selected={appearance?.eyeColor || '#333333'} 
                                onSelect={(c) => updateStyle('eyeColor', c)} 
                                label="Eyes" 
                            />
                        </div>
                        
                        {/* Outfit Group */}
                        <div className="space-y-2">
                            <div className="text-[10px] font-black text-white/30 tracking-wide border-b border-white/10 pb-2 mb-2">Outfit</div>
                            <ColorPicker 
                                colors={COLORS.clothes} 
                                selected={appearance?.shirtColor || '#FF7675'} 
                                onSelect={(c) => updateStyle('shirtColor', c)} 
                                label="Top" 
                            />
                            <ColorPicker 
                                colors={COLORS.clothes} 
                                selected={appearance?.pantsColor || '#74B9FF'} 
                                onSelect={(c) => updateStyle('pantsColor', c)} 
                                label={appearance?.model === 'mila' ? "Bottom" : "Legs"} 
                            />
                        </div>
                    </div>
                ) : activeTab === 'gear' ? (
                  <div className="max-w-2xl mx-auto pb-8">
                    {/* Savings Goal — tap a locked item to save toward it */}
                    {selectedHatInfo && selectedHatInfo.price > 0 && !isUnlocked && (
                        <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg" role="img" aria-hidden="true">🐷</span>
                                    <div>
                                        <p className="font-display text-[10px] font-black uppercase tracking-widest text-amber-300/70">Saving For</p>
                                        <p className="font-display text-sm font-bold text-white">{selectedHatInfo.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-display text-sm font-bold text-amber-200">{Math.min(totalScore, selectedHatInfo.price).toLocaleString()} / {selectedHatInfo.price.toLocaleString()} <CoinIcon /></p>
                                    {totalScore < selectedHatInfo.price && (
                                        <p className="text-[10px] font-bold text-white/40">{(selectedHatInfo.price - totalScore).toLocaleString()} more to go</p>
                                    )}
                                </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-black/30 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, (totalScore / selectedHatInfo.price) * 100)}%`,
                                        background: 'linear-gradient(90deg, #fcd34d, #f59e0b)',
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-[10px] text-amber-200/60 text-center font-medium">
                                {totalScore >= selectedHatInfo.price ? 'You saved enough — tap it to buy! 🎉' : 'Keep earning coins to reach your goal!'}
                            </p>
                        </div>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {allHatOptions.map(hat => {
                        const unlocked = hatState.unlocked.includes(hat.id);
                        const equipped = hatState.equipped === hat.id;
                        const canAfford = totalScore >= hat.price;
                        
                        return (
                          <button
                            key={hat.id}
                            onClick={() => handleHatClick(hat)}
                            className={`aspect-square rounded-2xl border transition-all duration-200 flex flex-col items-center justify-between p-2 relative group overflow-hidden
                              ${equipped
                                ? 'bg-white/10 border-[var(--accent-blue)] shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                                : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                              }
                              ${!unlocked && !canAfford ? 'opacity-60' : ''}
                              `
                            }
                          >
                            {/* Status Badge */}
                            <div className="w-full flex justify-end h-4 shrink-0">
                                {equipped && <div className="w-2.5 h-2.5 bg-[var(--accent-blue)] rounded-full animate-pulse shadow-[0_0_8px_var(--accent-blue)]" />}
                                {!unlocked && !canAfford && <div className="text-white/30"><ICONS.Lock /></div>}
                            </div>

                            {/* 3D Icon — tracked target for the shared Canvas's <View> */}
                            <div className={`w-16 h-16 flex items-center justify-center transition-transform duration-300 ${equipped ? 'scale-110' : 'scale-100 group-hover:scale-110'}`}>
                                {hat.id === 'none'
                                    ? <div className="w-full h-full flex items-center justify-center text-white/20"><ICONS.Remove /></div>
                                    : <div ref={thumbRefs.current[hat.id]} className="w-full h-full" />}
                            </div>

                            {/* Footer Info — name on top, coin price for unowned */}
                            <div className="w-full text-center mt-1 min-h-[1.5rem] flex flex-col items-center justify-end shrink-0 leading-tight">
                                <div className={`text-[9px] font-black truncate w-full ${equipped ? 'text-white' : unlocked ? 'text-white/50' : 'text-white/70'}`}>
                                    {unlocked ? hat.name : hat.id === 'none' ? hat.name : null}
                                </div>
                                {!unlocked && hat.price > 0 && (
                                    <div className={`text-[9px] font-black flex items-center gap-0.5 ${canAfford ? 'text-amber-300' : 'text-white/35'}`}>
                                        <span aria-hidden="true"><CoinIcon /></span>{hat.price.toLocaleString()}
                                    </div>
                                )}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Single shared WebGL context driving every hat thumbnail */}
                    <Canvas
                        eventSource={rootRef as React.MutableRefObject<HTMLElement>}
                        className="!fixed inset-0"
                        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5 }}
                        gl={{ alpha: true, antialias: true }}
                    >
                        <Suspense fallback={null}>
                            {allHatOptions.filter(h => h.id !== 'none').map(hat => (
                                <HatThumbView
                                    key={hat.id}
                                    id={hat.id}
                                    track={thumbRefs.current[hat.id] as React.MutableRefObject<HTMLElement>}
                                />
                            ))}
                        </Suspense>
                    </Canvas>
                  </div>
                ) : (
                    <div className="space-y-4 max-w-xl mx-auto pb-8">
                        <div className="p-4 rounded-xl border border-white/10 bg-black/20 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl bg-blue-500/10 text-[var(--accent-blue)] flex items-center justify-center border border-blue-500/20">
                                    <div className="scale-150"><ICONS.CPU /></div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white tracking-wide">Auto-Solver</h4>
                                    <p className="text-xs text-white/50 font-medium">Instantly calculates the best path.</p>
                                    <div className="mt-1 text-[10px] font-bold text-white/40 tracking-wide">
                                        You have: <span className="text-[var(--accent-blue)] text-base">{autoSolvers}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => onBuyConsumable?.('autoSolver', 250)}
                                disabled={totalScore < 250}
                                className={`px-4 py-2 rounded-lg text-xs font-black tracking-wide transition-all shadow-sm flex flex-col items-center gap-0.5 ${
                                    totalScore >= 250 
                                    ? 'bg-[var(--accent-green)] text-black hover:bg-white hover:scale-105 active:scale-95' 
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                            >
                                <span>Buy</span>
                                <span className="text-[9px] opacity-80 font-bold"><CoinAmount n={250} /></span>
                            </button>
                        </div>
                        
                        {/* Placeholder for future items */}
                        <div className="p-4 rounded-xl border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-white/30">
                            <span className="text-xs font-bold tracking-wide opacity-60">More tools coming soon</span>
                        </div>
                    </div>
                )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default ShopTab;
