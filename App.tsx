
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import Header from './components/Header';
import Grid from './components/Grid';
import Sequence from './components/Sequence';
const LevelBuilder = React.lazy(() => import('./components/LevelBuilder')); // code-split: loaded only when building
import WorldMapLanding from './components/WorldMapLanding';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import TournamentHub from './components/TournamentHub';
import { ChallengeComplete, ChallengeLobby } from './components/ChallengeUI';
import CoopLobby from './components/CoopLobby';
import CoopChat from './components/CoopChat';
import UserSearchModal from './components/UserSearchModal';
import TournamentLeaderboard from './components/TournamentLeaderboard';
import { GameClouds } from './components/Clouds'; 
import { SmoothBackground } from './components/SmoothBackground'; 
import TutorialGesture from './components/TutorialGesture';
import DailyChallengeHub from './components/DailyChallengeHub';
import SocialHub from './components/SocialHub';
import ShopTab from './components/ShopTab';
import MoreMenu from './components/MoreMenu';
const AdminPanel = React.lazy(() => import('./components/AdminPanel')); // code-split: admin-only, never loaded for normal players
import WorldCompleteOverlay from './components/WorldCompleteOverlay';
import LoginModal from './components/LoginModal';
import LevelInsightCard from './components/LevelInsightCard';
import ObjectiveChips from './components/ObjectiveChips';
import CoinTrip from './components/CoinTrip';
import WalletHud from './components/WalletHud';
import MissionRibbon from './components/MissionRibbon';
import WorldConceptRibbon from './components/WorldConceptRibbon';
import InterestOverlay from './components/InterestOverlay';
import LoadingIndicator from './components/LoadingIndicator';
import {
  CellType, Move, MoveWithId, GameStatus, Position, Level, LevelResult,
  FailureType, CollectedPackage, ParticleEffect, Theme,
  World, BotVisualState, TransientStatus,
  AppState, BotCelebrationState, UserProfile, CustomLevelEntry, LevelDataForShare, MilaState,
  ChallengeState, CoopGameState, ActiveTournamentSession, GameInvite, CharacterAppearance, HatId
} from './types';
import { WORLDS, POINTS, LEVELS_PER_WORLD, TOTAL_LEVELS, MERCY_FAILS, CLEAN_STREAK_BONUS, CLEAN_STREAK_CAP } from './constants/game';
import { isMoneyLevel, moneyLessonIndex, MONEY_LESSONS, MONEY_WORLD, MONEY_LESSON_BONUS, moneyLessonTakeaway, computeDailyInterest, todayStamp, InterestResult, currentSavingsGoal, formatCoinsWithGlyph } from './constants/finlit';
import { TUTORIAL_LEVELS } from './constants/levels';
import { THOUGHT_BUBBLE_TEXTS, MILA_DIALOGUES, TUTORIAL_HENRY_THOUGHTS, TUTORIAL_MILA_MESSAGES, ELEMENT_HINTS } from './constants/messages';
import { generateLevelByIndex, attemptGenerateLevel } from './utils/levelGenerator';
import { MEDAL_NAME, isPerfectRun } from './utils/medals';
import { evaluateBadges, makeBadge } from './utils/badges';
import { generateLevelName } from './utils/nameGenerator';
import { playSound, initAudio, startAmbientMusic, setMusicVolume, setSfxVolume } from './sound';
import { ICONS } from './components/icons';
import { signInWithGoogle, logoutUser, saveUserData, subscribeToUserData, subscribeAuth, updateUserName, updateUserPhoto, saveUserLevel, deleteUserLevel, subscribeToUserLevels, publishLevel, subscribeToInvites, createCoopSession, joinCoopGame, subscribeToCoopGame, addMoveToCoopSession, removeLastMoveFromCoopSession, updatePlayerStatus, reportCoopLevelComplete, toggleLevelLike, postTournamentScore, postDailyScore, sendInvite, leaveCoopGame, clearPlayerSequence, deleteUserProfile, sendHeartbeat, subscribeToCoopMessages, respondToInvite, resetUserProgress, trackAdminEvent, setAnalyticsSuppressed } from './firebase';
import { solve } from './utils/solver';
import { setSeed } from './utils/random';
import { triggerHaptic } from './utils/haptics';
import { countRequiredObjectiveGems, getObjectiveLabel, getObjectiveMoveLimit, getObjectiveScoreTarget, getRequiredObjectiveGemTarget, isRequiredObjectiveGemType } from './utils/objectives';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { simulateGame, VisualStep } from './utils/simulation';
import { usePersistence } from './hooks/usePersistence';
import { HATS } from './components/constants/shop';

// Stable constants to prevent re-renders
const EMPTY_ARRAY: any[] = [];

// Available themes for Daily Run rotations
const DAILY_THEMES: Theme[] = ['day', 'sunset', 'night', 'sunrise', 'alpine', 'desert', 'dusk', 'crystal', 'cyber', 'volcanic', 'galaxy'];
const ADMIN_EMAIL = 'hayhamlt@gmail.com';
const SESSION_TRACK_KEY = 'hj_admin_session_day';

type LevelInsightTone = 'success' | 'warning' | 'danger' | 'neutral';
type LevelInsight = {
    title: string;
    tip: string;
    tone: LevelInsightTone;
};

// Demo Randomization Colors
const DEMO_COLORS = {
    skin: ['#FFE0BD', '#F2C48D', '#C68642', '#8D5524'],
    hair: ['#634236', '#0F0F0F', '#E6BE8A', '#A52A2A'],
    eyes: ['#333333', '#2C3E50', '#2980B9', '#27AE60'],
    clothes: ['#FF7675', '#74B9FF', '#55EFC4', '#FDCB6E']
};

// Helper to determine theme from date string
const getDailyTheme = (dateStr: string): Theme => {
    let seedBase = 0;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        seedBase = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
    } else {
        seedBase = new Date(dateStr).getTime();
    }
    const dailyThemeIndex = Math.abs(seedBase) % DAILY_THEMES.length;
    return DAILY_THEMES[dailyThemeIndex];
};

const findPos = (grid: CellType[][], type: CellType): Position => {
    for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[0].length; c++) {
            if(grid[r][c] === type) return {row:r, col:c};
        }
    }
    return {row:0, col:0};
}

export const App: React.FC = () => {
    const SHOW_GAMEPLAY_NOTIFICATIONS = false;
    const SHOW_OBJECTIVE_UI = false;
    const initialPathIsAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // --- DEMO MODE STATE (Hoisted) ---
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoStarting, setIsDemoStarting] = useState(false);
  // Suppress analytics while the attract-mode bot auto-plays — it's not a real
  // user, so it would otherwise spam Firestore (2 writes/event, a level every few
  // seconds) and pollute the metrics dashboard.
  useEffect(() => { setAnalyticsSuppressed(isDemoMode); }, [isDemoMode]);
  const lastInteractionRef = useRef(Date.now());
    const inactivityTimeoutRef = useRef<any>(null);
  const demoTimerRef = useRef<any>(null);
  const [demoScoreAccumulator, setDemoScoreAccumulator] = useState(0);
  const [simulatedButtonHighlight, setSimulatedButtonHighlight] = useState<'run' | null>(null);
    const startDemoModeRef = useRef<() => void>(() => {});
  
  // Ref to hold the latest runSequence function to prevent stale closures in timeouts
  const runSequenceRef = useRef<((recordVideo?: boolean) => void) | null>(null);
  
  // Ref to store the user's actual data when demo starts
  const savedUserLevelRef = useRef<number>(0);
  const savedUserAppearanceRef = useRef<CharacterAppearance | null>(null);
  const savedUserHatRef = useRef<HatId | null>(null);

  // App State
    const [appState, setAppState] = useState<AppState>(initialPathIsAdmin ? 'admin' : 'main_menu');
  const [socialTab, setSocialTab] = useState<'profile' | 'crew' | 'inbox' | 'rank' | 'galaxy'>('profile');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  
  // --- PERSISTENCE HOOK (Handles local storage and cloud sync) ---
  // Pass isDemoMode as disablePersistence to prevent demo progress from overwriting user data
  const {
      levelIndex, setLevelIndex,
      resultsByLevel, setResultsByLevel,
      hatState, setHatState,
      appearance, setAppearance,
      dailyProgress, setDailyProgress,
      settings, setSettings,
      seenHints, setSeenHints,
      extraScore, setExtraScore,
      spentScore, setSpentScore,
      autoSolvers, setAutoSolvers,
      finlitQuizCorrect, setFinlitQuizCorrect,
      lastInterestDate, setLastInterestDate,
      savedGoalPeak, setSavedGoalPeak,
      cloudStatus, setCloudStatus,
      currency,
      lifetimeScore
  } = usePersistence(user, isDataLoaded, isDemoMode);

  const [isLoading, setIsLoading] = useState(false);
  const [transitionState, setTransitionState] = useState<'intro' | 'outro' | 'none'>('none');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Lives System
  const [lives, setLives] = useState(3);

  // Touch Detection & Mobile Layout
  const isTouchDevice = useMemo(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0, []);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [isLowPerfViewport, setIsLowPerfViewport] = useState(false);

  // Layout State
  const [showCoopLoginModal, setShowCoopLoginModal] = useState(false);
    const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [worldCompleteData, setWorldCompleteData] = useState<{ world: World, stats: { score: number, moves: number, time: number } } | null>(null);

  // Money Mountain (financial literacy): a non-blocking "mission" ribbon shown
  // at the start of a lesson level. The lesson is taught by playing — no modals.
  const [moneyMission, setMoneyMission] = useState<number | null>(null);
  // Campaign worlds teach a money concept too: a non-blocking ribbon introduces
  // each world's money skill the first time the player enters that world. The
  // ref tracks which worlds have already been introduced this session.
  const [worldConcept, setWorldConcept] = useState<number | null>(null);
  const conceptShownWorldsRef = useRef<Set<number>>(new Set());
  // Daily savings-interest payout shown once per calendar day.
  const [interestPayout, setInterestPayout] = useState<{ result: InterestResult; newBalance: number } | null>(null);
  const interestCheckedRef = useRef(false);
  
  // Scene Key to force character remount on level/scene reset
  const [sceneKey, setSceneKey] = useState(0);

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Element Hints
  const [activeElementHint, setActiveElementHint] = useState<{pos: Position, text: string, type: CellType} | null>(null);

  useEffect(() => {
      const checkLayout = () => setIsMobileLayout(window.innerWidth < 640);
      checkLayout();
      window.addEventListener('resize', checkLayout);
      return () => window.removeEventListener('resize', checkLayout);
  }, []);

  useEffect(() => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setPrefersReducedMotion(mq.matches);
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
      const update = () => setIsLowPerfViewport(window.innerWidth < 900 || window.innerHeight < 700);
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
  }, []);

  const isLowPerformanceMode = useMemo(() => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
      const lowMemory = (nav.deviceMemory || 8) <= 4;
      const touchConstrained = isTouchDevice && isLowPerfViewport;
      return prefersReducedMotion || lowCores || lowMemory || touchConstrained;
  }, [isTouchDevice, isLowPerfViewport, prefersReducedMotion]);

  // --- CAPACITOR INITIALIZATION ---
  useEffect(() => {
      const initNative = async () => {
          if (Capacitor.isNativePlatform()) {
              try {
                  await SplashScreen.hide();
                  await StatusBar.setOverlaysWebView({ overlay: true });
              } catch (e) {
                  console.warn("Native features not available", e);
              }
          }
      };
      initNative();
  }, []);

  // Loading Concurrency Guard
  const loadOperationIdRef = useRef(0);
  
  // Preloading Ref
  const preloadedLevelRef = useRef<{ key: string, level: Level } | null>(null);
  const hasRestoredProgress = useRef(false);
  
  // Animation Timer Refs
  const animationTimersRef = useRef<any[]>([]);
  const milaTimersRef = useRef<any[]>([]);
  
  // Autoplay Logic
  const autoplayTimeoutRef = useRef<any>(null);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);

  // Ref to track if the start-of-level thought has been shown
  const levelIntroMessageShownRef = useRef(false);
  
  // Visual Step Logic Ref
  const sequenceLogicRef = useRef<Map<number, VisualStep>>(new Map());
  
  // To track completion state for syncing
  const sequenceOutcomeRef = useRef<{ success: boolean, finalResult?: LevelResult, failure?: FailureType } | null>(null);

  const visualStepToMoveIndexRef = useRef<number[]>([]);

  // Game State
  const [grid, setGrid] = useState<CellType[][]>(TUTORIAL_LEVELS[0].grid);
  const [currentLevel, setCurrentLevel] = useState<Level>(TUTORIAL_LEVELS[0]);
  const [botPosition, setBotPosition] = useState<Position>(TUTORIAL_LEVELS[0].start);
  const [botDirection, setBotDirection] = useState<Move>(Move.Down);
  const [executionPath, setExecutionPath] = useState<(Position & { isTeleport?: boolean; isCollision?: boolean })[]>([]); 
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Planning);
  const [moveSequence, setMoveSequence] = useState<MoveWithId[]>([]);
  const [collectedPackages, setCollectedPackages] = useState<CollectedPackage[]>([]);
  // W3 "Spot the money trap": which disguised deals the player has inspected this
  // visit, and how many inspects remain. Reset when the level changes (see effect).
  const [inspectedTiles, setInspectedTiles] = useState<Set<string>>(new Set());
  const [inspectsLeft, setInspectsLeft] = useState(0);
  const [particleEffects, setParticleEffects] = useState<ParticleEffect[]>([]);
  const [failureType, setFailureType] = useState<FailureType>(null);
  const [failedMoveIndex, setFailedMoveIndex] = useState<number | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number | null>(null);
  const [levelTime, setLevelTime] = useState(0);
  const levelTimeRef = useRef(0);
  const [levelResult, setLevelResult] = useState<LevelResult | null>(null);
    const [levelInsight, setLevelInsight] = useState<LevelInsight | null>(null);
    const levelInsightTimerRef = useRef<any>(null);
  const [crumbledFloors, setCrumbledFloors] = useState<Position[]>([]);

  const [hasAutoSolved, setHasAutoSolved] = useState(false);

  // Visual State
  const [botVisualState, setBotVisualState] = useState<BotVisualState>('default');
  const [botCelebrationState, setBotCelebrationState] = useState<BotCelebrationState>(null);
  const [wallHitPosition, setWallHitPosition] = useState<Position | null>(null);
  const [isBotSleeping, setIsBotSleeping] = useState(false);
  const [botMessageData, setBotMessageData] = useState<{ text: string; isExiting: boolean } | null>(null);
  
  // Mila State (Distracter)
  const [mila, setMila] = useState<MilaState | null>(null);

  // Meta State
  const [isPhasingMode, setIsPhasingMode] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [transientStatusMessage, setTransientStatusMessage] = useState<TransientStatus | null>(null);

  const [customLevels, setCustomLevels] = useState<CustomLevelEntry[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [likedLevels, setLikedLevels] = useState<string[]>([]);
  
  // Challenge State (Offline/Link Challenge)
  const [challengeState, setChallengeState] = useState<ChallengeState>({
      active: false,
      mode: 'standard',
      seed: 0,
      currentLevelIndex: 0,
      totalLevels: 0,
      totalScore: 0
  });

  // Active Live Tournament State
  const [activeTournament, setActiveTournament] = useState<ActiveTournamentSession | null>(null);
  
  // Co-op State
  const [coopGameId, setCoopGameId] = useState<string | null>(null);
  const [coopState, setCoopState] = useState<CoopGameState | null>(null);
  const [coopRole, setCoopRole] = useState<'host' | 'guest' | null>(null);
  
  // Overlays
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Specific Data for Modals
  const [customLevelInviteData, setCustomLevelInviteData] = useState<{customLevelId: string, levelName: string} | null>(null);

  // Camera State
  const [viewAngle, setViewAngle] = useState({ azimuth: 30, elevation: 35 });
  
  const isLeavingCoopRef = useRef(false);

  const STEP_DURATION = 250;

  const isGameplayState = useMemo(() => ['play', 'challenge_play', 'tournament_play', 'coop_play'].includes(appState), [appState]);

  const activeTheme = useMemo(() => {
      if (appState === 'main_menu') return 'day';
      if (appState === 'build') return 'builder';
      if (appState === 'daily_hub') return getDailyTheme(dailyProgress.date);
      if (appState === 'shop') return 'day'; 
      if (appState === 'coop_lobby' || appState === 'coop_play') return 'cyber'; 
      if (appState === 'social') return 'galaxy'; 
      if (appState === 'challenge_setup' || appState === 'tournament_play') return 'arena'; 
      if (appState === 'settings' || appState === 'help' || appState === 'about') return 'day';
      return currentLevel.theme || 'day';
  }, [appState, currentLevel.theme, dailyProgress.date]);

    const showClouds = !isGameplayState;

  const stopAutoplay = useCallback(() => {
    setIsAutoplayActive(false);
    setSimulatedButtonHighlight(null);
    if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
    }
  }, []);

  const clearAnimationTimers = useCallback(() => { animationTimersRef.current.forEach(t => clearTimeout(t)); animationTimersRef.current = []; }, []);
  const clearMilaTimers = useCallback(() => { milaTimersRef.current.forEach(t => clearTimeout(t)); milaTimersRef.current = []; }, []);

  const setTimedBotMessage = (msg: string) => {
      setBotMessageData({ text: msg, isExiting: false });
      const duration = Math.max(3000, msg.length * 200 + 1500); 
      const tExit = window.setTimeout(() => { setBotMessageData(prev => prev ? { ...prev, isExiting: true } : null); const tRemove = window.setTimeout(() => { setBotMessageData(null); }, 300); animationTimersRef.current.push(tRemove); }, duration);
      animationTimersRef.current.push(tExit);
  };

  const spawnMila = useCallback((targetGrid: CellType[][], henryPos: Position, currentGhostPos: { row: number, col: number } | null | undefined) => {
      if (levelIndex < 5 && !isDemoMode) return; 
      let dialogData: { taunt: string; reactions: string[] };
      if (levelIndex < 5 && TUTORIAL_MILA_MESSAGES[levelIndex] && !isDemoMode) { dialogData = { taunt: TUTORIAL_MILA_MESSAGES[levelIndex], reactions: [] }; } else { dialogData = MILA_DIALOGUES[Math.floor(Math.random() * MILA_DIALOGUES.length)]; }
      const candidates: Position[] = [];
      targetGrid.forEach((row, r) => row.forEach((cell, c) => {
          if (r === henryPos.row && c === henryPos.col) return;
          if (currentGhostPos && r === currentGhostPos.row && c === currentGhostPos.col) return; 
          const isPortal = cell === CellType.Start || cell === CellType.End || (cell >= CellType.Teleporter_A && cell <= CellType.Teleporter_F);
          if (isPortal) { candidates.push({ row: r, col: c }); }
      }));
      if (candidates.length === 0) return; 
      const spawnPos = candidates[Math.floor(Math.random() * candidates.length)];
      setMila({ visible: true, position: spawnPos, message: '', messageId: Date.now(), duration: 0, direction: Move.Down, animationState: 'in' });
      const t2 = window.setTimeout(() => {
          setMila(prev => prev ? ({ ...prev, animationState: 'idle', message: dialogData.taunt }) : null);
          if (dialogData.reactions && dialogData.reactions.length > 0) { const reaction = dialogData.reactions[Math.floor(Math.random() * dialogData.reactions.length)]; const tResponse = window.setTimeout(() => { setTimedBotMessage(reaction.toUpperCase()); }, 3000); milaTimersRef.current.push(tResponse); }
          const t3 = window.setTimeout(() => { setMila(prev => prev ? ({ ...prev, animationState: 'out', message: '' }) : null); const t4 = window.setTimeout(() => { setMila(null); }, 500); milaTimersRef.current.push(t4); }, 5000); milaTimersRef.current.push(t3);
      }, 500); milaTimersRef.current.push(t2);
  }, [levelIndex, isDemoMode]);

  const loadLevel = useCallback(async (index: number, ignoreTutorial = false) => {
    stopAutoplay();
    setIsLoading(true); setTransitionState('outro'); await new Promise(resolve => setTimeout(resolve, 600)); 
    clearAnimationTimers(); clearMilaTimers();
    setLevelIndex(index); setGameStatus(GameStatus.Planning); setMoveSequence([]); setExecutionPath([]); setFailureType(null); setBotVisualState('spawn'); setBotCelebrationState(null);
    setLevelResult(null); setFailedMoveIndex(null); setCurrentMoveIndex(null); setTransientStatusMessage(null); setCrumbledFloors([]); setTutorialStep(0); 
    setBotMessageData(null); setMila(null); sequenceLogicRef.current.clear(); levelIntroMessageShownRef.current = false; setHasAutoSolved(false); setWorldCompleteData(null);
    // Money Mountain: surface the non-blocking mission ribbon (level plays
    // immediately — the lesson is taught by doing, not by a modal).
    setMoneyMission(isMoneyLevel(index) && !isDemoMode ? moneyLessonIndex(index) : null);
    // Campaign worlds also teach a money concept. Introduce the world's money
    // skill the first time the player reaches that world this session (skipping
    // the early tutorial levels, which have their own guided steps). Non-blocking.
    {
      const wIdx = Math.floor(index / LEVELS_PER_WORLD);
      const isCampaignLevel = index >= 0 && index < TOTAL_LEVELS && !isMoneyLevel(index);
      const isTutorialLevel = index < TUTORIAL_LEVELS.length;
      // Set unconditionally (mirrors moneyMission); the RENDER is gated on
      // appState === 'play'. We must NOT gate the set on appState here: both
      // landing entry points (onContinue / onSelectLevel) call loadLevel while
      // appState is still 'main_menu' in this callback's closure, so an
      // appState check would suppress the ribbon on the primary entry path.
      if (isCampaignLevel && !isTutorialLevel && !isDemoMode &&
          !conceptShownWorldsRef.current.has(wIdx) && WORLDS[wIdx]?.moneyConcept) {
        conceptShownWorldsRef.current.add(wIdx);
        setWorldConcept(wIdx);
      } else {
        setWorldConcept(null);
      }
    }
    const currentOpId = ++loadOperationIdRef.current;
    let levelData: Level | null = null;
    const preloadKey = `main-${index}`;
    if (preloadedLevelRef.current && preloadedLevelRef.current.key === preloadKey) { levelData = preloadedLevelRef.current.level; preloadedLevelRef.current = null; } 
    else {
        if (isMoneyLevel(index)) { levelData = await generateLevelByIndex(index); }
        else if (index >= 10000) { const customIdx = index - 10000; if (customLevels[customIdx]) { const entry = customLevels[customIdx]; levelData = { ...entry.data, start: findPos(entry.data.grid, CellType.Start), end: findPos(entry.data.grid, CellType.End) }; } }
        else if (index < TUTORIAL_LEVELS.length) { levelData = TUTORIAL_LEVELS[index]; levelData = { ...levelData, grid: levelData.grid.map(row => [...row]) }; } 
        else { levelData = await generateLevelByIndex(index); }
    }
    if (loadOperationIdRef.current !== currentOpId) return;
    if (levelData) {
        // Strip tutorial instructions in Demo Mode to prevent input blocking
        if (isDemoMode || ignoreTutorial) {
            levelData = { ...levelData, tutorial: undefined };
        }

        setSceneKey(prev => prev + 1); 
        setCurrentLevel(levelData); setGrid(levelData.grid); setBotPosition(levelData.start); setBotDirection(Move.Down); 
        if (Math.random() < 0.3 && appState === 'play' && index >= 5) { const t1 = window.setTimeout(() => { if (loadOperationIdRef.current !== currentOpId) return; spawnMila(levelData!.grid, levelData!.start, null); }, 3000); milaTimersRef.current.push(t1); }
        setCollectedPackages([]); setParticleEffects([]); setLevelTime(0); levelTimeRef.current = 0;
        
        // Reset lives visually in demo mode so it looks clean
        if (isDemoMode) setLives(3);

        setTimeout(() => { if (loadOperationIdRef.current === currentOpId) { setIsLoading(false); setTransitionState('intro'); setBotVisualState('default'); } }, 100);
        if (index < 10000) { setTimeout(async () => { const nextIndex = index + 1; const nextKey = `main-${nextIndex}`; if (preloadedLevelRef.current?.key === nextKey) return; if (nextIndex >= 10000) return; const nextData = await generateLevelByIndex(nextIndex); if (nextData) { preloadedLevelRef.current = { key: nextKey, level: nextData }; } }, 1000); }
    } else {
        // Generation returned null (near-impossible after the relaxed fallback,
        // but NEVER strand a kid on an eternal loading screen): load a canned
        // safe board and clear the loader.
        console.error(`[loadLevel] level ${index} failed to generate — loading fallback board`);
        const base = TUTORIAL_LEVELS[Math.min(2, TUTORIAL_LEVELS.length - 1)];
        const fallback: Level = { ...base, grid: base.grid.map(row => [...row]), tutorial: undefined, par: base.par || 10, timeLimit: base.timeLimit || 45 };
        setSceneKey(prev => prev + 1);
        setCurrentLevel(fallback); setGrid(fallback.grid); setBotPosition(fallback.start); setBotDirection(Move.Down);
        setCollectedPackages([]); setParticleEffects([]); setLevelTime(0); levelTimeRef.current = 0;
        setTransientStatusMessage({ text: 'THAT LEVEL GOT SCRAMBLED — BONUS ROUND!', color: 'yellow' });
        setTimeout(() => { if (loadOperationIdRef.current === currentOpId) { setIsLoading(false); setTransitionState('intro'); setBotVisualState('default'); } }, 100);
    }
    }, [appState, customLevels, spawnMila, clearAnimationTimers, clearMilaTimers, stopAutoplay, isDemoMode, setLevelIndex]);

  const resetDemoMode = useCallback(() => {
      if (isDemoMode) {
          setIsDemoMode(false);
          setIsDemoStarting(false);
          setDemoScoreAccumulator(0);
          setAppState('main_menu');
          stopAutoplay();
          
          // Restore the user's actual progress level and appearance
          setLevelIndex(savedUserLevelRef.current);
          if (savedUserAppearanceRef.current) setAppearance(savedUserAppearanceRef.current);
          if (savedUserHatRef.current) setHatState(prev => ({ ...prev, equipped: savedUserHatRef.current || 'none' }));

          // Invalidate any pending loads to prevent race conditions
          loadOperationIdRef.current++;
          // Reset game state cleanup
          setGameStatus(GameStatus.Planning);
          setMoveSequence([]);
          setExecutionPath([]);
          setBotVisualState('default');
          setBotCelebrationState(null);
      }
  }, [isDemoMode, stopAutoplay, setLevelIndex, setAppearance, setHatState]);

  const scheduleInactivityDemo = useCallback(() => {
      if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
          inactivityTimeoutRef.current = null;
      }

      const canStartDemo = settings.attractModeEnabled
          && !prefersReducedMotion   // a11y: don't auto-burst 3D motion at idle, motion-sensitive players
          && appState === 'main_menu'
          && !isDemoMode
          && !isDemoStarting
          && !showSearchModal
          && !showCoopLoginModal;

      if (!canStartDemo) return;

      inactivityTimeoutRef.current = setTimeout(() => {
          if (Date.now() - lastInteractionRef.current >= 10000) {
              startDemoModeRef.current();
          }
      }, 10000);
  }, [settings.attractModeEnabled, prefersReducedMotion, appState, isDemoMode, isDemoStarting, showSearchModal, showCoopLoginModal]);

  // Global Interaction Handler for Inactivity & Demo Cancellation
  useEffect(() => {
      const handleUserInteraction = (event: Event) => {
          lastInteractionRef.current = Date.now();
          
          if (isDemoMode) {
              resetDemoMode();
          } else {
              // Only gesture-like events should initialize audio; passive movement should only reset idle time.
              const shouldInitAudio = ['click', 'touchstart', 'keydown', 'pointerdown'].includes(event.type);
              if (shouldInitAudio) {
                  initAudio();
                  startAmbientMusic(activeTheme);
              }
              if (isAutoplayActive) stopAutoplay();
          }

          scheduleInactivityDemo();
      };

      window.addEventListener('click', handleUserInteraction);
      window.addEventListener('touchstart', handleUserInteraction);
      window.addEventListener('keydown', handleUserInteraction);
      window.addEventListener('pointerdown', handleUserInteraction);
      window.addEventListener('mousemove', handleUserInteraction, { passive: true });
      window.addEventListener('wheel', handleUserInteraction, { passive: true });
      window.addEventListener('scroll', handleUserInteraction, { passive: true });

      return () => {
          window.removeEventListener('click', handleUserInteraction);
          window.removeEventListener('touchstart', handleUserInteraction);
          window.removeEventListener('keydown', handleUserInteraction);
          window.removeEventListener('pointerdown', handleUserInteraction);
          window.removeEventListener('mousemove', handleUserInteraction);
          window.removeEventListener('wheel', handleUserInteraction);
          window.removeEventListener('scroll', handleUserInteraction);
      };
    }, [isAutoplayActive, stopAutoplay, activeTheme, isDemoMode, resetDemoMode, scheduleInactivityDemo]); 

    const randomizeDemoAppearance = useCallback(() => {
      // Randomly pick a character model
      const models: ('henry'|'mila')[] = ['henry', 'mila'];
      const randomModel = models[Math.floor(Math.random() * models.length)];
      
      // Randomly pick colors
      const skin = DEMO_COLORS.skin[Math.floor(Math.random() * DEMO_COLORS.skin.length)];
      const hair = DEMO_COLORS.hair[Math.floor(Math.random() * DEMO_COLORS.hair.length)];
      const eyes = DEMO_COLORS.eyes[Math.floor(Math.random() * DEMO_COLORS.eyes.length)];
      const shirt = DEMO_COLORS.clothes[Math.floor(Math.random() * DEMO_COLORS.clothes.length)];
      const pants = DEMO_COLORS.clothes[Math.floor(Math.random() * DEMO_COLORS.clothes.length)];
      
      // Randomly pick a hat
      const hatOptions = ['none', ...HATS.map(h => h.id)];
      const randomHat = hatOptions[Math.floor(Math.random() * hatOptions.length)] as HatId;
      
      // Apply
      setAppearance({
          model: randomModel,
          skinColor: skin,
          hairColor: hair,
          eyeColor: eyes,
          shirtColor: shirt,
          pantsColor: pants
      });
      setHatState(prev => ({ ...prev, equipped: randomHat }));
    }, [setAppearance, setHatState]);

    const startDemoMode = useCallback(() => {
      setIsDemoStarting(true);
      // Initialize simulated score with current user score so it doesn't look weird starting at 0
      setDemoScoreAccumulator(currency);
      
      // Capture the user's current data so we can restore it later
      savedUserLevelRef.current = levelIndex;
      savedUserAppearanceRef.current = appearance;
      savedUserHatRef.current = hatState.equipped;
      
      // Randomly pick a world from all available worlds (1-10)
      const validWorlds = WORLDS;
      const randomWorld = validWorlds[Math.floor(Math.random() * validWorlds.length)];
      
      // Pick random level from chosen world, skipping tutorials (0-4) for better demo visuals
      const validLevels = randomWorld.levels.filter(l => l >= 5);
      const randomLevel = validLevels[Math.floor(Math.random() * validLevels.length)];

      // Simulate "Select Play" delay
      setTimeout(() => {
          setIsDemoStarting(false);
          
          // IMPORTANT: Set Demo Mode true BEFORE randomization to disable persistence syncing
          setIsDemoMode(true);
          
          // Randomize character for the demo
          randomizeDemoAppearance();
          
          setAppState('play');
          // Pass ignoreTutorial=true to force tutorial off during demo loading
          loadLevel(randomLevel, true); 
      }, 1000);
    }, [currency, levelIndex, appearance, hatState.equipped, randomizeDemoAppearance, loadLevel]);

    useEffect(() => {
            startDemoModeRef.current = startDemoMode;
    }, [startDemoMode]);

  // Inactivity Start Timer (10s true inactivity required)
  useEffect(() => {
      scheduleInactivityDemo();
      return () => {
          if (inactivityTimeoutRef.current) {
              clearTimeout(inactivityTimeoutRef.current);
              inactivityTimeoutRef.current = null;
          }
      };
    }, [scheduleInactivityDemo]);

  useEffect(() => {
      if (activeTheme) {
          startAmbientMusic(activeTheme);
          if (Capacitor.isNativePlatform()) {
              const lightThemes = ['day', 'sunrise', 'alpine', 'desert', 'builder', 'my-world', 'sunset', 'arena'];
              const isLightTheme = lightThemes.includes(activeTheme);
              StatusBar.setStyle({ style: isLightTheme ? Style.Light : Style.Dark }).catch(() => {});
          }
      }
  }, [activeTheme]);

  useEffect(() => {
      setMusicVolume(settings.musicVolume);
      setSfxVolume(settings.sfxVolume);
  }, [settings]);

  // Portal Active Calculation
  const isPortalActive = useMemo(() => {
      const requiredTotal = countRequiredObjectiveGems(grid);
      const requiredTarget = getRequiredObjectiveGemTarget(currentLevel, requiredTotal);
      let requiredCollected = 0;
      collectedPackages.forEach(p => {
          if (isRequiredObjectiveGemType(p.type)) requiredCollected++;
      });
      return requiredCollected >= requiredTarget;
  }, [grid, collectedPackages, currentLevel]);

  const objectiveSummary = useMemo(() => {
      const requiredTotal = countRequiredObjectiveGems(grid);
      const requiredTarget = getRequiredObjectiveGemTarget(currentLevel, requiredTotal);
      return getObjectiveLabel(currentLevel, requiredTotal, requiredTarget);
  }, [grid, currentLevel]);

    const [objectiveCelebrationTick, setObjectiveCelebrationTick] = useState(0);
    const prevObjectiveCompleteRef = useRef(false);

  const objectiveProgress = useMemo(() => {
      const requiredTotal = countRequiredObjectiveGems(grid);
      const requiredTarget = getRequiredObjectiveGemTarget(currentLevel, requiredTotal);
      const collectedRequired = collectedPackages.reduce((acc, item) => {
          return acc + (isRequiredObjectiveGemType(item.type) ? 1 : 0);
      }, 0);
      const moveLimit = getObjectiveMoveLimit(currentLevel);
      const scoreTarget = getObjectiveScoreTarget(currentLevel);
      const currentScore = levelResult?.scoreBreakdown.total || 0;

      return {
          requiredTotal,
          requiredTarget,
          collectedRequired,
          moveLimit,
          scoreTarget,
          currentScore,
          hasAnyObjective: requiredTarget > 0 || moveLimit !== null || scoreTarget !== null,
          isCollectMet: collectedRequired >= requiredTarget,
          isMoveLimitMet: moveLimit === null ? true : moveSequence.length <= moveLimit,
          isScoreMet: scoreTarget === null ? true : currentScore >= scoreTarget,
      };
  }, [grid, currentLevel, collectedPackages, moveSequence.length, levelResult]);

  // W1 run-wallet projection: walk the currently-planned route and tally the
  // coins drained by any impulse-buy WANT tiles, so the wallet HUD updates LIVE
  // during planning (the sim only runs on Run). null = no wallet mechanic.
  const runWalletProjection = useMemo(() => {
      const sw = currentLevel.startWallet;
      if (typeof sw !== 'number') return null;
      const wantCost = currentLevel.wantCost ?? 0;
      const drainPerStep = !!currentLevel.drainPerStep;
      const tollPrices = currentLevel.tollPrices ?? {};
      const hasToll = Object.keys(tollPrices).length > 0;
      const hasShock = grid.some(row => row.includes(CellType.Shock));
      const cols = grid[0]?.length ?? 0;
      let r = currentLevel.start.row, c = currentLevel.start.col, wallet = sw;
      const seen = new Set<string>(); // tolls pay once; liquid refills once
      for (const m of moveSequence) {
          if (m.move === Move.Up) r--; else if (m.move === Move.Down) r++;
          else if (m.move === Move.Left) c--; else if (m.move === Move.Right) c++;
          if (r < 0 || r >= grid.length || c < 0 || c >= cols) break;
          const key = `${r},${c}`;
          if (drainPerStep) wallet = Math.max(0, wallet - 1);  // W4: each step costs a coin
          if (grid[r][c] === CellType.WantTile) wallet = Math.max(0, wallet - wantCost);
          if (grid[r][c] === CellType.Toll_Gate && !seen.has(key)) { seen.add(key); wallet = Math.max(0, wallet - (tollPrices[key] ?? 0)); } // W7
          if (grid[r][c] === CellType.Shock) wallet = Math.max(0, wallet - 3);  // W8: shock drains the reserve
          if (grid[r][c] === CellType.Liquid_Cash && !seen.has(key)) { seen.add(key); wallet = Math.min(5, wallet + 3); } // W8: refill
      }
      const kind: 'wallet' | 'budget' | 'reserve' = hasToll ? 'budget' : hasShock ? 'reserve' : 'wallet';
      return { wallet, exitPrice: currentLevel.exitPrice ?? 0, kind };
  }, [currentLevel.startWallet, currentLevel.wantCost, currentLevel.exitPrice, currentLevel.drainPerStep, currentLevel.tollPrices, currentLevel.start, moveSequence, grid]);

  // W5 savings-gem projection: for the current planned route, what the savings gem
  // would be worth (it ripens with the step it's grabbed) and whether that grab is
  // "ripe" (Gold). Lets the planning HUD show the value climbing the longer you wait.
  const savingsProjection = useMemo(() => {
      if (typeof currentLevel.growPerStep !== 'number') return null;
      let gem: { r: number, c: number } | null = null;
      for (let r = 0; r < grid.length && !gem; r++) {
          const row = grid[r];
          for (let c = 0; c < row.length; c++) { if (row[c] === CellType.Package_Savings) { gem = { r, c }; break; } }
      }
      if (!gem) return null;
      const cols = grid[0]?.length ?? 0;
      let r = currentLevel.start.row, c = currentLevel.start.col, step = -1;
      for (let idx = 0; idx < moveSequence.length; idx++) {
          const m = moveSequence[idx].move;
          if (m === Move.Up) r--; else if (m === Move.Down) r++; else if (m === Move.Left) c--; else if (m === Move.Right) c++;
          if (r < 0 || r >= grid.length || c < 0 || c >= cols) break;
          if (r === gem.r && c === gem.c) { step = idx; break; } // matches sim's collect step `i`
      }
      const gpp = currentLevel.growPerStep;
      const value = step >= 0 ? 20 + Math.min(gpp * step, gpp * 12) : null; // base gem_value(20) + capped growth
      const ripe = step >= 0 && step >= (currentLevel.ripeStep ?? 0);
      return { value, ripe };
  }, [currentLevel.growPerStep, currentLevel.ripeStep, currentLevel.start, moveSequence, grid]);

  // W3 disguised-deal wiring. The set of disguised posKeys for the current level,
  // and a reset of inspect-state whenever the level changes (so inspects persist
  // across retries of the same level, but a fresh level starts uninspected).
  const disguisedSet = useMemo(() => new Set(currentLevel.disguised ?? []), [currentLevel.disguised]);
  useEffect(() => {
      setInspectedTiles(new Set());
      setInspectsLeft(currentLevel.inspectBudget ?? 0);
  }, [currentLevel]);

  // Tap a disguised gold tile during planning to INSPECT it (spends one inspect):
  // a real deal stays a coin, a scam is revealed. The plan-commit guard (in
  // runSequence) blocks running a route over an uninspected deal.
  const handleInspectTile = useCallback((row: number, col: number) => {
      if (gameStatus !== GameStatus.Planning) return;
      const key = `${row},${col}`;
      if (!currentLevel.disguised?.includes(key) || inspectedTiles.has(key)) return;
      if (inspectsLeft <= 0) { triggerHaptic('warning'); playSound('fail_wall'); return; }
      setInspectedTiles(prev => { const n = new Set(prev); n.add(key); return n; });
      setInspectsLeft(n => n - 1);
      playSound('unlock');
      triggerHaptic('light');
  }, [gameStatus, currentLevel.disguised, inspectedTiles, inspectsLeft]);

  const objectiveStatusLine = useMemo(() => {
      if (!objectiveProgress.hasAnyObjective) return null;

      const parts: string[] = [];
      if (objectiveProgress.requiredTarget > 0) {
          const remainingPackages = Math.max(0, objectiveProgress.requiredTarget - objectiveProgress.collectedRequired);
          parts.push(
              remainingPackages === 0
                  ? 'packages complete'
                  : `${remainingPackages} package${remainingPackages === 1 ? '' : 's'} left`
          );
      }

      if (objectiveProgress.moveLimit !== null) {
          const remainingMoves = objectiveProgress.moveLimit - moveSequence.length;
          parts.push(
              remainingMoves >= 0
                  ? `${remainingMoves} move${remainingMoves === 1 ? '' : 's'} left`
                  : `${Math.abs(remainingMoves)} over limit`
          );
      }

      if (objectiveProgress.scoreTarget !== null) {
          const remainingScore = objectiveProgress.scoreTarget - objectiveProgress.currentScore;
          parts.push(
              remainingScore <= 0
                  ? 'score target met'
                  : `${remainingScore} score needed`
          );
      }

      return parts.join(' • ');
  }, [objectiveProgress.hasAnyObjective, objectiveProgress.requiredTarget, objectiveProgress.collectedRequired, objectiveProgress.moveLimit, objectiveProgress.scoreTarget, objectiveProgress.currentScore, moveSequence.length]);

  const prevCollectObjectiveMetRef = useRef(false);
  const prevMoveObjectiveMetRef = useRef(false);
    const prevScoreObjectiveMetRef = useRef(false);

  useEffect(() => {
      if (!isGameplayState) {
          prevCollectObjectiveMetRef.current = objectiveProgress.isCollectMet;
          prevMoveObjectiveMetRef.current = objectiveProgress.isMoveLimitMet;
          prevScoreObjectiveMetRef.current = objectiveProgress.isScoreMet;
          return;
      }

      if (!prevCollectObjectiveMetRef.current && objectiveProgress.isCollectMet && objectiveProgress.requiredTarget > 0) {
          playSound('collect');
          triggerHaptic('light');
      }

      if (!prevMoveObjectiveMetRef.current && objectiveProgress.isMoveLimitMet && objectiveProgress.moveLimit !== null && moveSequence.length > 0) {
          playSound('addMove');
          triggerHaptic('light');
      }

      if (!prevScoreObjectiveMetRef.current && objectiveProgress.isScoreMet && objectiveProgress.scoreTarget !== null) {
          playSound('unlock');
          triggerHaptic('light');
      }

      prevCollectObjectiveMetRef.current = objectiveProgress.isCollectMet;
      prevMoveObjectiveMetRef.current = objectiveProgress.isMoveLimitMet;
      prevScoreObjectiveMetRef.current = objectiveProgress.isScoreMet;
  }, [isGameplayState, objectiveProgress.isCollectMet, objectiveProgress.requiredTarget, objectiveProgress.isMoveLimitMet, objectiveProgress.moveLimit, objectiveProgress.isScoreMet, objectiveProgress.scoreTarget, moveSequence.length]);

  useEffect(() => {
      const isObjectiveComplete = objectiveProgress.hasAnyObjective && objectiveProgress.isCollectMet && objectiveProgress.isMoveLimitMet && objectiveProgress.isScoreMet;
      if (isObjectiveComplete && !prevObjectiveCompleteRef.current) {
          setObjectiveCelebrationTick(prev => prev + 1);
      }
      prevObjectiveCompleteRef.current = isObjectiveComplete;
  }, [objectiveProgress.hasAnyObjective, objectiveProgress.isCollectMet, objectiveProgress.isMoveLimitMet, objectiveProgress.isScoreMet]);

  const prevPortalActiveRef = useRef(isPortalActive);
  useEffect(() => {
      if (isPortalActive && !prevPortalActiveRef.current && collectedPackages.length > 0) {
          playSound('unlock');
          triggerHaptic('success');
          setTransientStatusMessage({ text: currentLevel.objective ? "OBJECTIVE COMPLETE - PORTAL ONLINE" : "PORTAL ONLINE", color: 'blue' });
          setTimeout(() => setTransientStatusMessage(null), 2500);
      }
      prevPortalActiveRef.current = isPortalActive;
  }, [isPortalActive, collectedPackages.length, currentLevel.objective]);

  // Auth Subscription
  useEffect(() => {
      const unsubscribe = subscribeAuth((firebaseUser: any) => {
          if (firebaseUser) {
              setUser({
                  name: firebaseUser.displayName || 'Explorer',
                  email: firebaseUser.email || '',
                  picture: firebaseUser.photoURL || '',
                  uid: firebaseUser.uid,
                  badges: [] // Will be populated by userData subscription
              });
          } else {
              setUser(null);
              setIsDataLoaded(false); 
              hasRestoredProgress.current = false;
          }
      });
      return () => unsubscribe(); 
  }, []);

  // User Data Sync
  useEffect(() => {
      if (!user?.uid) {
          setCustomLevels([]);
          setInvites([]);
          return;
      }
      const unsubUserData = subscribeToUserData(user.uid, (data) => {
          if (data) {
              if (data.resultsByLevel) {
                  setResultsByLevel(prev => {
                      const merged = { ...prev };
                      const cloudResults = data.resultsByLevel as Record<string, LevelResult>;
                      Object.keys(cloudResults).forEach(key => {
                          const lvlKey = Number(key);
                          const cloudRes = cloudResults[key];
                          const localRes = prev[lvlKey];
                          if (!localRes || (cloudRes.scoreBreakdown?.total || 0) > (localRes.scoreBreakdown?.total || 0)) {
                              merged[lvlKey] = cloudRes;
                          }
                      });
                      return merged;
                  });
                  if (!hasRestoredProgress.current) {
                      const completedKeys = Object.keys(data.resultsByLevel).map(Number).filter(k => k < 10000);
                      if (completedKeys.length > 0) {
                          const maxCompleted = Math.max(...completedKeys);
                          setLevelIndex(prev => Math.max(prev, maxCompleted + 1));
                      }
                      hasRestoredProgress.current = true;
                  }
              }
              if (data.hatState) {
                  setHatState(prev => ({
                      unlocked: Array.from(new Set([...prev.unlocked, ...(data.hatState.unlocked || [])])),
                      equipped: data.hatState.equipped || prev.equipped
                  }));
              }
              if (data.appearance) setAppearance(data.appearance);
              if (data.badges) setUser(prev => prev ? ({ ...prev, badges: data.badges }) : null);
              if (data.extraScore !== undefined) setExtraScore(data.extraScore);
              if (data.spentScore !== undefined) setSpentScore(data.spentScore);
              if (data.savedGoalPeak !== undefined) setSavedGoalPeak(prev => Math.max(prev, data.savedGoalPeak!));
              if (data.autoSolvers !== undefined) setAutoSolvers(data.autoSolvers);
              if (data.seenHints !== undefined) setSeenHints(data.seenHints);
              // Quiz history is cumulative — union local and cloud.
              if (data.finlitQuizCorrect) setFinlitQuizCorrect(prev => Array.from(new Set([...prev, ...data.finlitQuizCorrect])));
              // Interest is paid once per day across devices — trust the latest stamp so
              // a second device on the same day can't pay it again.
              if (data.lastInterestDate) setLastInterestDate(prev => (data.lastInterestDate! > prev ? data.lastInterestDate! : prev));
              if (data.dailyProgress) {
                  setDailyProgress(prev => {
                      const cloud = data.dailyProgress!;
                      const sameDay = !!cloud.date && cloud.date === prev.date;
                      return {
                          ...prev,
                          // Streak history is cumulative — always trust the cloud copy.
                          streak: cloud.streak ?? prev.streak,
                          lastCompletedDate: cloud.lastCompletedDate ?? prev.lastCompletedDate,
                          // For today's in-progress run, keep whichever device got further.
                          ...(sameDay ? {
                              currentLevel: Math.max(prev.currentLevel, cloud.currentLevel || 0),
                              lives: Math.min(prev.lives, cloud.lives ?? prev.lives),
                              isCompleted: prev.isCompleted || cloud.isCompleted,
                          } : {}),
                      };
                  });
              }
          }
          setIsDataLoaded(true);
      });
      const unsubLevels = subscribeToUserLevels(user.uid, (levels) => { setCustomLevels(levels); });
      const unsubInvites = subscribeToInvites(user.uid, (newInvites) => { setInvites(newInvites); });
      return () => { unsubUserData(); unsubLevels(); unsubInvites(); };
    }, [user?.uid, setResultsByLevel, setLevelIndex, setHatState, setAppearance, setUser, setExtraScore, setSpentScore, setAutoSolvers, setSeenHints, setDailyProgress, setFinlitQuizCorrect, setLastInterestDate]);

  // --- Daily savings interest -------------------------------------------------
  // Once per calendar day, coins the player KEPT earn interest (the "money can
  // grow" lesson). Runs after cloud data has loaded for signed-in users, or
  // immediately from local storage for guests. Guarded to fire only once per
  // session. First-ever open just stamps the date silently (no surprise payout).
  useEffect(() => {
      if (isDemoMode || interestCheckedRef.current) return;
      if (user?.uid && !isDataLoaded) return; // wait for the cloud balance
      interestCheckedRef.current = true;
      const today = todayStamp();
      if (!lastInterestDate) { setLastInterestDate(today); return; }
      if (lastInterestDate === today) return;
      const result = computeDailyInterest(currency, dailyProgress.streak || 0);
      setLastInterestDate(today);
      if (result.total > 0) {
          setExtraScore(prev => prev + result.total);
          setInterestPayout({ result, newBalance: currency + result.total });
          trackAdminEvent('coins_earned', 'daily_interest', { amount: result.total, streak: dailyProgress.streak || 0 }).catch(() => {});
      }
  }, [isDataLoaded, user?.uid, isDemoMode, lastInterestDate, currency, dailyProgress.streak, setExtraScore, setLastInterestDate]);

  // Award money-literacy badges. Idempotent: evaluateBadges returns every badge
  // currently earned; we award only the ids the user doesn't already have. This
  // also retroactively grants badges for progress made before the system was
  // activated. badges round-trip via saveUserData (no schema change).
  useEffect(() => {
      if (isDemoMode || !user) return;
      if (user.uid && !isDataLoaded) return; // wait for cloud badges before diffing
      const earned = evaluateBadges({ resultsByLevel, lifetimeScore, streak: dailyProgress.streak || 0 });
      const have = new Set((user.badges || []).map(b => b.id));
      const fresh = earned.filter(id => !have.has(id));
      if (fresh.length === 0) return;
      const now = Date.now();
      const newBadges = fresh.map(id => makeBadge(id, now)).filter(Boolean) as NonNullable<ReturnType<typeof makeBadge>>[];
      if (newBadges.length === 0) return;
      setUser(prev => prev ? ({ ...prev, badges: [...(prev.badges || []), ...newBadges] }) : prev);
      playSound('world_complete');
      triggerHaptic('success');
      setTransientStatusMessage({ text: `🏅 Badge earned: ${newBadges[0].name}!`, color: 'yellow' });
      setTimeout(() => setTransientStatusMessage(null), 2800);
      newBadges.forEach(() => trackAdminEvent('badge_earned', 'progression', {}).catch(() => {}));
  }, [isDataLoaded, isDemoMode, user, resultsByLevel, lifetimeScore, dailyProgress.streak]);

  // Savings goal: ratchet the peak up as the balance grows, and celebrate the
  // first time a new goal tier is reached. The world-map piggy meter shows
  // currency / currentSavingsGoal(peak).
  const savingsGoalRef = useRef<number | null>(null);
  useEffect(() => {
      if (isDemoMode) return;
      if (currency > savedGoalPeak) setSavedGoalPeak(currency);
      const goal = currentSavingsGoal(Math.max(savedGoalPeak, currency));
      if (savingsGoalRef.current === null) { savingsGoalRef.current = goal; return; }
      if (goal > savingsGoalRef.current) {
          savingsGoalRef.current = goal;
          playSound('world_complete');
          triggerHaptic('success');
          trackAdminEvent('savings_goal_reached', 'progression', { goal }).catch(() => {});
          setTransientStatusMessage({ text: `🐷 Savings goal reached! Next: ${formatCoinsWithGlyph(goal)}`, color: 'yellow' });
          setTimeout(() => setTransientStatusMessage(null), 3000);
      } else {
          savingsGoalRef.current = goal;
      }
  }, [currency, savedGoalPeak, isDemoMode, setSavedGoalPeak]);

  useEffect(() => {
      if (user?.uid) {
          sendHeartbeat();
          const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);
          return () => clearInterval(interval);
      }
  }, [user?.uid]);

  const handleUpdatePhoto = useCallback((photo: string) => {
      if (user?.uid) {
          setUser(prev => prev ? ({ ...prev, picture: photo }) : null);
          updateUserPhoto(user.uid, photo);
      }
  }, [user?.uid]);

  // Hint Logic
  useEffect(() => {
      if (gameStatus === GameStatus.Planning && appState === 'play' && !isDemoMode) { // Block guiding bubbles in demo
          let firstNewElement: {pos: Position, text: string, type: CellType} | null = null;
          for(let r=0; r<grid.length; r++) {
              for(let c=0; c<grid[0].length; c++) {
                  const type = grid[r][c];
                  if (ELEMENT_HINTS[type] && !seenHints.includes(type)) {
                      firstNewElement = { pos: {row: r, col: c}, text: ELEMENT_HINTS[type] || "New Object", type: type };
                      break; 
                  }
              }
              if (firstNewElement) break; 
          }
          setActiveElementHint(firstNewElement);
      } else {
          setActiveElementHint(null);
      }
  }, [grid, seenHints, gameStatus, appState, isDemoMode]);

  const markHintSeen = useCallback(() => {
      if (activeElementHint) {
          const type = activeElementHint.type;
          setSeenHints(prev => {
              if (prev.includes(type)) return prev;
              const next = [...prev, type];
              if (user?.uid) saveUserData(user.uid, { seenHints: next });
              return next;
          });
          setActiveElementHint(null);
      }
    }, [activeElementHint, user?.uid, setSeenHints]);

    const showHintButton = !!activeElementHint;

    const handleShowHint = () => {
            const hintText = activeElementHint?.text;
            if (!hintText) return;
            setTimedBotMessage(hintText.toUpperCase());
            triggerHaptic('light');
            markHintSeen();
    };

  // Ghost Calculation
  const ghostPosition = useMemo(() => {
      if (appState !== 'play' || levelIndex >= TUTORIAL_LEVELS.length || gameStatus !== GameStatus.Planning || moveSequence.length === 0) return null;
      let r = botPosition.row; let c = botPosition.col; let facing = botDirection;
      const teleporters: Record<string, Position> = {};
      grid.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
          if (cell >= CellType.Teleporter_A && cell <= CellType.Teleporter_F) {
               const pairs: Record<number, number> = {
                    [CellType.Teleporter_A]: CellType.Teleporter_B, [CellType.Teleporter_B]: CellType.Teleporter_A,
                    [CellType.Teleporter_C]: CellType.Teleporter_D, [CellType.Teleporter_D]: CellType.Teleporter_C,
                    [CellType.Teleporter_E]: CellType.Teleporter_F, [CellType.Teleporter_F]: CellType.Teleporter_E,
                };
                const partnerType = pairs[cell];
                grid.forEach((pr, tr) => pr.forEach((pc, tc) => {
                    if (pc === partnerType) teleporters[`${r},${c}`] = { row: tr, col: tc };
                }));
          }
      }));
      for (const m of moveSequence) {
          let nr = r; let nc = c;
          if (m.move === Move.Up) nr--; else if (m.move === Move.Down) nr++; else if (m.move === Move.Left) nc--; else if (m.move === Move.Right) nc++;
          facing = m.move;
          if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) return { row: nr, col: nc, direction: facing };
          const cell = grid[nr][nc];
          if (cell === CellType.Wall || cell === CellType.Bomb || (cell >= CellType.Wall_H_Left && cell <= CellType.Wall_V_Bottom)) {} else { r = nr; c = nc; }
          const tDest = teleporters[`${r},${c}`];
          if (tDest) { r = tDest.row; c = tDest.col; }
      }
      return { row: r, col: c, direction: facing };
  }, [moveSequence, botPosition, botDirection, grid, levelIndex, gameStatus, appState]);

  const isGhostAtEnd = useMemo(() => {
      if (!ghostPosition || !currentLevel) return false;
      return ghostPosition.row === currentLevel.start.row && ghostPosition.col === currentLevel.start.col;
  }, [ghostPosition, currentLevel]);

  useEffect(() => { document.fonts.ready.then(() => { setFontsLoaded(true); }); }, []);
  const isGuest = useMemo(() => !user, [user]);
    const isAdminUser = useMemo(() => (user?.email || '').toLowerCase() === ADMIN_EMAIL, [user?.email]);

  useEffect(() => {
      if (typeof window === 'undefined') return;
      const onAdminPath = window.location.pathname.startsWith('/admin');
      if (appState === 'admin' && !onAdminPath) {
          window.history.replaceState({}, '', '/admin');
      }
      if (appState !== 'admin' && onAdminPath) {
          window.history.replaceState({}, '', '/');
      }
  }, [appState]);

  // --- INCOMING CHALLENGE LINK ---
  // A shared link (built by ChallengeComplete) carries the course + challenger's
  // score in the query string. Parse it once on boot, validate/clamp, drop the
  // player into the challenge lobby, then strip the params so a refresh is clean.
  const challengeLinkHandledRef = useRef(false);
  useEffect(() => {
      if (typeof window === 'undefined') return;
      if (challengeLinkHandledRef.current) return;
      challengeLinkHandledRef.current = true;

      const params = new URLSearchParams(window.location.search);
      const rawSeed = params.get('challenge_seed');
      if (rawSeed === null) return;

      const seed = Number(rawSeed);
      const lenParsed = Number(params.get('challenge_len'));
      const totalLevels = [3, 5, 10].includes(lenParsed) ? lenParsed : 5;
      const scoreParsed = Number(params.get('challenger_score'));
      const challengerScore = Number.isFinite(scoreParsed) && scoreParsed > 0 ? Math.floor(scoreParsed) : 0;
      const challengerName = (params.get('challenger_name') || 'A Friend').slice(0, 40);

      // Strip the challenge params from the URL regardless, so refresh/back is clean.
      window.history.replaceState({}, '', window.location.pathname);

      if (!Number.isFinite(seed)) return;

      setChallengeState({
          active: true,
          mode: 'standard',
          seed,
          currentLevelIndex: 0,
          totalLevels,
          totalScore: 0,
          challenger: { name: challengerName, score: challengerScore }
      });
      setAppState('challenge_lobby');
  }, []);

  const lastTrackedScreenRef = useRef<string | null>(null);
  const lastTrackedGameplayKeyRef = useRef<string | null>(null);

  useEffect(() => {
      const now = new Date();
      const dayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      const existing = window.localStorage.getItem(SESSION_TRACK_KEY);
      if (existing !== dayKey) {
          window.localStorage.setItem(SESSION_TRACK_KEY, dayKey);
          trackAdminEvent('session_start').catch(() => {});
      }
      trackAdminEvent('app_open').catch(() => {});
  }, []);

  useEffect(() => {
      if (lastTrackedScreenRef.current === appState) return;
      lastTrackedScreenRef.current = appState;
      trackAdminEvent(`screen_view_${appState}`).catch(() => {});
  }, [appState]);

  useEffect(() => {
      if (!isGameplayState || gameStatus !== GameStatus.Planning) return;
      const mode = appState === 'play' ? 'play' : appState === 'challenge_play' ? 'challenge' : appState === 'tournament_play' ? 'tournament' : appState === 'coop_play' ? 'coop' : 'other';
      const gameplayKey = `${mode}-${levelIndex}-${challengeState.currentLevelIndex}-${activeTournament?.currentLevel || 0}-${coopState?.levelIndex || 0}`;
      if (lastTrackedGameplayKeyRef.current === gameplayKey) return;
      lastTrackedGameplayKeyRef.current = gameplayKey;
      trackAdminEvent('gameplay_start', mode).catch(() => {});
  }, [
      appState,
      gameStatus,
      isGameplayState,
      levelIndex,
      challengeState.currentLevelIndex,
      activeTournament?.currentLevel,
      coopState?.levelIndex
  ]);

  const getTutorialText = (text: string | undefined) => {
      if (!text) return null;
      let display = text.replace(/ ARROW/gi, '');
      if (isTouchDevice || isMobileLayout) {
          display = display.replace(/\b(PRESS|TAP|GO) (UP|DOWN|LEFT|RIGHT)\b/gi, 'SWIPE $2');
          display = display.replace(/PRESS PLAY/gi, 'TAP PLAY');
          display = display.replace(/PRESS ENTER/gi, 'TAP EXECUTE');
      } else {
          display = display.replace(/\b(TAP|SWIPE)\b/gi, 'PRESS');
      }
      return display;
  };

  const currentTutorialStep = useMemo(() => {
      if (!currentLevel.tutorial || tutorialStep >= currentLevel.tutorial.length) return null;
      return currentLevel.tutorial[tutorialStep];
  }, [currentLevel, tutorialStep]);
  const isTutorialActive = !!currentTutorialStep;

  const startCoopGame = useCallback(async (isHost: boolean, gameId: string) => {
      isLeavingCoopRef.current = false;
      setCoopRole(isHost ? 'host' : 'guest');
      setCoopGameId(gameId);
      setAppState('coop_lobby');
  }, []);

  const handleAcceptCoopInvite = useCallback(async (invite: GameInvite) => {
      if (!user) return;
      try {
          await respondToInvite(invite.id, true);
          if (invite.customLevelId && user.uid) { 
              await joinCoopGame(invite.customLevelId, user.uid, user.name);
              startCoopGame(false, invite.customLevelId);
          }
      } catch (e) { console.error("Failed to join co-op", e); }
  }, [user, startCoopGame]);

  const prevInvitesLengthRef = useRef(0);
  const appLaunchTime = useRef(Date.now()); 

  useEffect(() => {
      if (invites.length > prevInvitesLengthRef.current) {
          const newestInvite = invites[0]; 
          if (newestInvite && newestInvite.timestamp > appLaunchTime.current) {
              playSound('success');
              if (newestInvite.type === 'coop') {
                  setTransientStatusMessage({ text: `CO-OP REQUEST FROM ${newestInvite.fromName.toUpperCase()}!`, color: 'blue', action: () => { handleAcceptCoopInvite(newestInvite); setTransientStatusMessage(null); } });
                  setTimeout(() => setTransientStatusMessage(prev => prev && prev.text.includes("CO-OP") ? null : prev), 8000);
              } else {
                  setTransientStatusMessage({ text: "New message! Tap to view", color: 'blue', action: () => { setTransientStatusMessage(null); setAppState('social'); setSocialTab('inbox'); } });
                  setTimeout(() => setTransientStatusMessage(prev => prev && prev.text.includes("NEW MESSAGE") ? null : prev), 6000);
              }
          }
      }
      prevInvitesLengthRef.current = invites.length;
    }, [invites, user, handleAcceptCoopInvite]);

  const handleDeleteAccount = async () => {
      if (isGuest) { if (confirm("Reset all local progress? This cannot be undone.")) { localStorage.clear(); window.location.reload(); } } 
      else { if (confirm("PERMANENTLY DELETE ACCOUNT? This will erase all your progress, levels, and scores from the cloud. This cannot be undone.")) { try { localStorage.clear(); await deleteUserProfile(); await logoutUser(); window.location.reload(); } catch (e: any) { alert("Error deleting account: " + e.message); } } }
  };

  const handleExitGame = useCallback(async () => {
      stopAutoplay();
      // If demo, exit it
      if (isDemoMode) {
          resetDemoMode();
          return;
      }
      if (appState === 'coop_play' || appState === 'coop_lobby') {
          if (coopGameId) {
              isLeavingCoopRef.current = true;
              trackAdminEvent('coop_leave', 'coop', { fromState: appState === 'coop_play' ? 1 : 0 }).catch(() => {});
              await leaveCoopGame(coopGameId).catch(console.error);
          }
          setCoopGameId(null); setCoopState(null);
      }
      preloadedLevelRef.current = null;
      setAppState('main_menu');
  }, [appState, coopGameId, stopAutoplay, isDemoMode, resetDemoMode]);

  useEffect(() => {
      const handleBeforeUnload = () => { if (coopGameId) leaveCoopGame(coopGameId); };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [coopGameId]);

  useEffect(() => {
      let unsubscribe = () => {};
      if (coopGameId) {
          unsubscribe = subscribeToCoopGame(coopGameId, (state) => {
              if (state) {
                  if (state.status === 'aborted') {
                      if (!isLeavingCoopRef.current) { setTransientStatusMessage({ text: "Your friend left - game over", color: 'red' }); setTimeout(() => setTransientStatusMessage(null), 4000); }
                      setTimeout(() => { setAppState('main_menu'); setCoopGameId(null); setCoopState(null); isLeavingCoopRef.current = false; }, 1500);
                      return;
                  }
                  setCoopState(state);
                  if (!coopRole && user) {
                      if (state.hostUid === user.uid) setCoopRole('host');
                      else if (state.guestUid === user.uid) setCoopRole('guest');
                  }
                  // NOTE: We intentionally do NOT mirror our own sequence back
                  // from the cloud here. Local edits are optimistic and
                  // authoritative; mirroring caused a race where an unrelated
                  // snapshot (e.g. the partner's status change) arriving before
                  // our own write echoed would wipe a just-added move. Level
                  // changes reset the local sequence via loadCoopLevel().
                  
                  if (appState === 'coop_lobby' && state.status !== 'waiting') {
                      setAppState('coop_play'); setShowSearchModal(false); playSound('success');
                      trackAdminEvent('coop_match_started', 'coop', { role: coopRole === 'host' ? 1 : 0 }).catch(() => {});
                      setTransientStatusMessage({ text: "Friend connected!", color: 'blue' }); setTimeout(() => setTransientStatusMessage(null), 3000);
                  }
              } else {
                  if (appState === 'coop_play') { setTransientStatusMessage({ text: "Connection lost", color: 'red' }); setAppState('main_menu'); setCoopGameId(null); setCoopState(null); }
              }
          });
      }
      return () => unsubscribe();
  }, [coopGameId, appState, coopRole, user]);

  const lastProcessedMessageId = useRef<string | null>(null);
  useEffect(() => {
      if (appState === 'coop_play' && coopGameId && user) {
          const unsubscribe = subscribeToCoopMessages(coopGameId, (msgs) => {
              if (msgs.length > 0) {
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg.id !== lastProcessedMessageId.current) {
                      lastProcessedMessageId.current = lastMsg.id;
                      if (lastMsg.senderUid !== user.uid) { setTimedBotMessage(lastMsg.text); playSound('collect'); } 
                      else { setTimedBotMessage(lastMsg.text); }
                  }
              }
          });
          return () => unsubscribe();
      }
  }, [appState, coopGameId, user]);

    const generateCoopLevel = useCallback((index: number, seedBase: number): Level | null => {
      const levelSeed = seedBase + index * 997; setSeed(levelSeed); 
      const difficulty = 30 + index * 5; 
      let level: Level | null = null;
      for (let i = 0; i < 100; i++) { try { level = attemptGenerateLevel(difficulty); } catch(e) {} if (level) break; }
      return level;
    }, []);

    const loadCoopLevel = useCallback(async (index: number, seedBase: number, retries = 0) => {
      const preloadKey = `coop-${seedBase}-${index}`;
      let level: Level | null = null;
      if (preloadedLevelRef.current && preloadedLevelRef.current.key === preloadKey) { level = preloadedLevelRef.current.level; preloadedLevelRef.current = null; } 
      else { setIsLoading(true); setTransitionState('outro'); await new Promise(resolve => setTimeout(resolve, 50)); level = generateCoopLevel(index, seedBase); }

      if (level) {
          setSceneKey(prev => prev + 1); 
          clearAnimationTimers(); setTransientStatusMessage(null); setGameStatus(GameStatus.Planning); setCurrentLevel(level); setGrid(level.grid);
          setBotPosition(level.start); setBotDirection(Move.Down); setMoveSequence([]); setExecutionPath([]); setCollectedPackages([]); setParticleEffects([]);
          setFailureType(null); setLevelResult(null); setLevelTime(0); levelTimeRef.current = 0; levelIntroMessageShownRef.current = false; setHasAutoSolved(false); 
          sequenceLogicRef.current.clear();
          setBotVisualState('spawn'); setTimeout(() => setBotVisualState('default'), 800); 
          if (coopGameId && coopRole) updatePlayerStatus(coopGameId, coopRole, 'planning');
          setIsLoading(false); setTransitionState('intro');
          setTimeout(() => {
              const nextIndex = index + 1; const nextKey = `coop-${seedBase}-${nextIndex}`;
              if (preloadedLevelRef.current?.key === nextKey) return;
              const nextLevel = generateCoopLevel(nextIndex, seedBase);
              if (nextLevel) preloadedLevelRef.current = { key: nextKey, level: nextLevel };
          }, 500);
      } else {
          if (retries < 5) {
              setTransientStatusMessage({ text: "Hmm, retrying...", color: 'red' }); 
              setTimeout(() => loadCoopLevel(index, seedBase, retries + 1), 1000);
          } else {
              setTransientStatusMessage({ text: "Loading a backup level...", color: 'yellow' });
              const safeLevel = await generateLevelByIndex(0);
              if (safeLevel) {
                  setCurrentLevel(safeLevel); setGrid(safeLevel.grid); setBotPosition(safeLevel.start);
                  setIsLoading(false); setTransitionState('intro');
              } else {
                  setAppState('main_menu'); 
              }
          }
      }
    }, [generateCoopLevel, clearAnimationTimers, coopGameId, coopRole]);

  const lastLoadedCoopSeed = useRef<string>("");
  useEffect(() => {
      if (appState === 'coop_play' && coopState) {
          const uniqueLevelId = `${coopState.seed}-${coopState.levelIndex}`;
          if (lastLoadedCoopSeed.current !== uniqueLevelId) { loadCoopLevel(coopState.levelIndex, coopState.seed); lastLoadedCoopSeed.current = uniqueLevelId; }
      }
    }, [coopState, appState, loadCoopLevel]);

  const handleCoopInvite = async (targetUid: string, targetName: string) => {
      if (!user?.uid || !coopGameId) return;
      await sendInvite(user.uid, user.name, targetUid, undefined, undefined, undefined, coopGameId, undefined, 'coop');
  };

  const handleStartCoopFromSocial = (gameId: string) => { setCoopRole('host'); setCoopGameId(gameId); setAppState('coop_lobby'); };
  const handleJoinCoopFromSocial = (gameId: string) => { setCoopRole('guest'); setCoopGameId(gameId); setAppState('coop_lobby'); };
  
  const handleChallengeWithLevel = (level: CustomLevelEntry) => { 
      setCustomLevelInviteData({ customLevelId: level.id, levelName: level.name }); 
      setShowSearchModal(true); 
  };

  const handleTournamentJoin = (id: string, name: string, endTime: number, seed: number, difficulty: 'easy' | 'mixed' | 'hard') => {
      if (!user) return;
      setActiveTournament({ id, name, endTime, seed, currentLevel: 0, currentScore: 0, difficulty });
      postTournamentScore(id, user, 0).catch(e => console.error("Tournament join post failed", e));
      setAppState('tournament_play');
      loadTournamentLevel(0, seed, difficulty);
  };

    const generateTournamentLevel = useCallback((index: number, seedBase: number, difficulty: 'easy' | 'mixed' | 'hard'): Level | null => {
      const levelSeed = seedBase + index * 997; setSeed(levelSeed);
      let difficultyIndex = 20 + index * 5;
      if (difficulty === 'easy') difficultyIndex = Math.min(19, index + 5); 
      else if (difficulty === 'hard') difficultyIndex = 60 + index * 2; 
      let level: Level | null = null;
      for (let i = 0; i < 100; i++) { try { level = attemptGenerateLevel(difficultyIndex); } catch(e) {} if (level) break; }
      return level;
    }, []);

    const loadTournamentLevel = useCallback(async (index: number, seedBase: number, difficulty: 'easy' | 'mixed' | 'hard', retries = 0) => {
      const preloadKey = `tourn-${seedBase}-${index}`;
      let level: Level | null = null;
      if (preloadedLevelRef.current && preloadedLevelRef.current.key === preloadKey) { level = preloadedLevelRef.current.level; preloadedLevelRef.current = null; } 
      else { setIsLoading(true); setTransitionState('outro'); await new Promise(resolve => setTimeout(resolve, 50)); level = generateTournamentLevel(index, seedBase, difficulty); }

      if (level) {
          setSceneKey(prev => prev + 1); 
          clearAnimationTimers(); setGameStatus(GameStatus.Planning); setCurrentLevel(level); setGrid(level.grid);
          setBotPosition(level.start); setBotDirection(Move.Down); setMoveSequence([]); setExecutionPath([]); setCollectedPackages([]); setParticleEffects([]);
          setFailureType(null); setLevelResult(null); setLevelTime(0); levelTimeRef.current = 0; levelIntroMessageShownRef.current = false; setHasAutoSolved(false); 
          sequenceLogicRef.current.clear();
          setBotVisualState('spawn'); setTimeout(() => setBotVisualState('default'), 800); 
          setIsLoading(false); setTransitionState('intro');
          setTimeout(() => {
              const nextIndex = index + 1; const nextKey = `tourn-${seedBase}-${nextIndex}`;
              if (preloadedLevelRef.current?.key === nextKey) return;
              const nextLevel = generateTournamentLevel(nextIndex, seedBase, difficulty);
              if (nextLevel) preloadedLevelRef.current = { key: nextKey, level: nextLevel };
          }, 500); 
      } else {
          if (retries < 5) {
              setTransientStatusMessage({ text: "Building your level...", color: 'yellow' }); 
              setTimeout(() => loadTournamentLevel(index, seedBase, difficulty, retries + 1), 1000);
          } else {
              setTransientStatusMessage({ text: "Loading a backup level...", color: 'red' });
              const safeLevel = await generateLevelByIndex(0);
              if (safeLevel) {
                  setCurrentLevel(safeLevel); setGrid(safeLevel.grid); setBotPosition(safeLevel.start);
                  setIsLoading(false); setTransitionState('intro');
              } else {
                  setAppState('main_menu');
              }
          }
      }
    }, [generateTournamentLevel, clearAnimationTimers]);

  const handleTournamentNext = useCallback((score: number) => {
      setExtraScore(prev => prev + score);
      if (!activeTournament) return;
      const now = Date.now();
      if (now >= activeTournament.endTime) { trackAdminEvent('tournament_complete', 'tournament', { score: activeTournament.currentScore, endReason: 0 }).catch(() => {}); setAppState('tournament_summary'); return; }
      const nextIdx = activeTournament.currentLevel + 1;
      const newTotal = activeTournament.currentScore + score;
      setActiveTournament(prev => prev ? ({ ...prev, currentLevel: nextIdx, currentScore: newTotal }) : null);
      if (user) postTournamentScore(activeTournament.id, user, score).catch(e => {
          console.error("Tournament score post failed", e);
          setTransientStatusMessage({ text: "Couldn't save score - check connection", color: 'yellow' });
          setTimeout(() => setTransientStatusMessage(null), 2500);
      });
      loadTournamentLevel(nextIdx, activeTournament.seed, activeTournament.difficulty);
    }, [activeTournament, user, setExtraScore, loadTournamentLevel]);

  // Live tournament timer — end the run as soon as the clock expires, even if
  // the player is mid-level or idle (previously only checked on level submit).
  useEffect(() => {
      if (appState !== 'tournament_play' || !activeTournament) return;
      const check = () => {
          if (Date.now() >= activeTournament.endTime) {
              setTransientStatusMessage({ text: "Time's up!", color: 'yellow' });
              setTimeout(() => setTransientStatusMessage(null), 2500);
              trackAdminEvent('tournament_complete', 'tournament', { score: activeTournament.currentScore, endReason: 1 }).catch(() => {});
              setAppState('tournament_summary');
          }
      };
      const interval = setInterval(check, 1000);
      return () => clearInterval(interval);
  }, [appState, activeTournament]);

  const startChallenge = (seed: number, length: number) => {
      setChallengeState({ active: true, mode: 'standard', seed: seed, currentLevelIndex: 0, totalLevels: length, totalScore: 0 });
      setAppState('challenge_play');
      loadChallengeLevel(0, seed, length, 'standard');
  };

    const loadChallengeLevel = useCallback((index: number, seedBase: number, totalLevelsOverride?: number, modeOverride?: 'standard' | 'daily', retryAttempt = 0) => {
      const preloadKey = `chal-${seedBase}-${index}`;
      const totalLevels = totalLevelsOverride || challengeState.totalLevels;
      const mode = modeOverride || challengeState.mode;
      let level: Level | null = null;
      if (preloadedLevelRef.current && preloadedLevelRef.current.key === preloadKey) { level = preloadedLevelRef.current.level; preloadedLevelRef.current = null; }
      else {
          const levelSeed = seedBase + index * 997; setSeed(levelSeed);
          // Clamp to the designed space: past TOTAL_LEVELS-1 the world gates all
          // read out-of-range and silently strip every money mechanic.
          let difficulty;
          if (mode === 'daily') difficulty = Math.min(TOTAL_LEVELS - 1, 40 + Math.floor((index / totalLevels) * 100));
          else difficulty = Math.min(TOTAL_LEVELS - 1, 40 + Math.floor((index / totalLevels) * 60));
          let attempts = 0; while (!level && attempts < 10) { try { level = attemptGenerateLevel(difficulty); } catch(e) {} attempts++; }
      }
      
      if (level) {
          setSceneKey(prev => prev + 1); 
          clearAnimationTimers(); setGameStatus(GameStatus.Planning); setCurrentLevel(level); setGrid(level.grid);
          setBotPosition(level.start); setBotDirection(Move.Down); setMoveSequence([]); setExecutionPath([]); setCollectedPackages([]); setParticleEffects([]);
          setFailureType(null); setLevelResult(null); setLevelTime(0); levelTimeRef.current = 0; levelIntroMessageShownRef.current = false; setHasAutoSolved(false); 
          sequenceLogicRef.current.clear();
          
          if (mode === 'daily') {
              const dailyThemeIndex = Math.abs(seedBase) % DAILY_THEMES.length;
              level.theme = DAILY_THEMES[dailyThemeIndex];
              level.tutorial = undefined;
          }
          
          setBotVisualState('spawn'); setTimeout(() => setBotVisualState('default'), 1000); 
          setTimeout(() => {
              const nextIndex = index + 1; const nextKey = `chal-${seedBase}-${nextIndex}`;
              if (preloadedLevelRef.current?.key === nextKey) return;
              const nextLevelSeed = seedBase + nextIndex * 997; setSeed(nextLevelSeed);
              let nextDifficulty;
              if (mode === 'daily') nextDifficulty = Math.min(TOTAL_LEVELS - 1, 40 + Math.floor((nextIndex / totalLevels) * 100));
              else nextDifficulty = Math.min(TOTAL_LEVELS - 1, 40 + Math.floor((nextIndex / totalLevels) * 60));
              let nextLevel: Level | null = null; let retry = 0;
              while (!nextLevel && retry < 5) { try { nextLevel = attemptGenerateLevel(nextDifficulty); } catch(e) {} retry++; }
              if (nextLevel) { 
                  if (mode === 'daily') {
                    const dailyThemeIndex = Math.abs(seedBase) % DAILY_THEMES.length;
                    nextLevel.theme = DAILY_THEMES[dailyThemeIndex];
                    nextLevel.tutorial = undefined;
                  }
                  preloadedLevelRef.current = { key: nextKey, level: nextLevel }; 
              }
          }, 1000);
      } else if (retryAttempt < 4) {
          // Perturb the seed each retry: retrying the IDENTICAL seed fails
          // deterministically forever — a livelock that bricked the daily for
          // everyone. The perturbation is derived from the same seedBase, so
          // every player still lands on the same rescue board (fair).
          setTransientStatusMessage({ text: "Retrying...", color: 'red' });
          setTimeout(() => loadChallengeLevel(index, seedBase + (retryAttempt + 1) * 7919, totalLevels, mode, retryAttempt + 1), 600);
      } else {
          setTransientStatusMessage({ text: "Couldn't build that level — try again soon!", color: 'red' });
          setTimeout(() => { setTransientStatusMessage(null); setAppState(mode === 'daily' ? 'daily_hub' : 'main_menu'); }, 1500);
      }
    }, [challengeState.totalLevels, challengeState.mode, clearAnimationTimers]);

  const handleOpenDailyHub = useCallback(() => {
      const now = new Date();
      const today = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
      
      if (dailyProgress.date !== today) {
          setDailyProgress({ date: today, lives: 3, currentLevel: 0, isCompleted: false });
      }
      trackAdminEvent('daily_open', 'daily', {}).catch(() => {});
      setAppState('daily_hub');
    }, [dailyProgress.date, setDailyProgress]);

  const startDailyLevel = useCallback(() => {
      let seedBase = 0;
      if (dailyProgress.date.includes('-')) {
          const parts = dailyProgress.date.split('-');
          seedBase = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
      } else {
          seedBase = new Date(dailyProgress.date).getTime();
      }
      
      setChallengeState({ active: true, mode: 'daily', seed: seedBase, currentLevelIndex: dailyProgress.currentLevel, totalLevels: 20, totalScore: 0 });
      trackAdminEvent('daily_start', 'daily', { resumeLevel: dailyProgress.currentLevel, streak: dailyProgress.streak || 0 }).catch(() => {});
      setAppState('challenge_play');
      loadChallengeLevel(dailyProgress.currentLevel, seedBase, 20, 'daily');
  }, [dailyProgress, loadChallengeLevel]);

  const handleChallengeNext = useCallback((score: number) => {
      const newTotal = challengeState.totalScore + score;
      const nextIdx = challengeState.currentLevelIndex + 1;
      setExtraScore(prev => prev + score);
      if (challengeState.mode === 'daily') {
          setDailyProgress(prev => ({ ...prev, currentLevel: nextIdx }));
          if (nextIdx >= 20) {
              // Compute today's / yesterday's date keys (UTC) in the same format
              // handleOpenDailyHub uses, then update the consecutive-day streak.
              const d = new Date();
              const today = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
              const yd = new Date(d.getTime() - 86400000);
              const yesterday = `${yd.getUTCFullYear()}-${yd.getUTCMonth() + 1}-${yd.getUTCDate()}`;
              const prevDaily = dailyProgress;
              let newStreak: number;
              if (prevDaily.lastCompletedDate === today) newStreak = prevDaily.streak || 1; // already counted today
              else if (prevDaily.lastCompletedDate === yesterday) newStreak = (prevDaily.streak || 0) + 1;
              else newStreak = 1;
              if (newStreak === 1 && (prevDaily.streak || 0) > 1 && prevDaily.lastCompletedDate !== today && prevDaily.lastCompletedDate !== yesterday) {
                  trackAdminEvent('daily_streak_broken', 'daily', { previousStreak: prevDaily.streak || 0 }).catch(() => {});
              }
              trackAdminEvent('daily_complete', 'daily', { streak: newStreak, score: newTotal }).catch(() => {});
              setDailyProgress(prev => ({ ...prev, isCompleted: true, streak: newStreak, lastCompletedDate: today }));
              if (user) postDailyScore(today, user, newTotal, newStreak).catch(e => console.error("Daily score post failed", e));
              setAppState('daily_hub');
              return;
          }
      }
      if (challengeState.mode !== 'daily' && nextIdx >= challengeState.totalLevels) {
          setChallengeState(prev => ({ ...prev, totalScore: newTotal }));
          setAppState('challenge_complete');
      } else {
          setChallengeState(prev => ({ ...prev, totalScore: newTotal, currentLevelIndex: nextIdx }));
          loadChallengeLevel(nextIdx, challengeState.seed, challengeState.totalLevels, challengeState.mode);
      }
    }, [challengeState, user, setExtraScore, loadChallengeLevel, setDailyProgress, dailyProgress]);

  useEffect(() => {
      if (gameStatus !== GameStatus.Planning) return;
      
      // Filter tutorial thoughts in demo mode
      if (levelIndex < 5 && isGhostAtEnd && gameStatus === GameStatus.Planning && !botMessageData) { 
          if (isDemoMode) return; // Skip "I can also press Enter" in Demo
          const msg = isTouchDevice ? "I can also tap screen to execute..." : "I can also press Enter to execute..."; 
          const t = window.setTimeout(() => setTimedBotMessage(msg.toUpperCase()), 500); 
          animationTimersRef.current.push(t); 
          return; 
      }
      
      if (!levelIntroMessageShownRef.current && !botMessageData) {
          const delayTimer = window.setTimeout(() => {
              if (gameStatus === GameStatus.Planning && !levelIntroMessageShownRef.current) {
                  levelIntroMessageShownRef.current = true;
                  if (levelIndex < 5) { 
                      if (isDemoMode) {
                          // Show random thought instead of tutorial guide
                          const selected = THOUGHT_BUBBLE_TEXTS[Math.floor(Math.random() * THOUGHT_BUBBLE_TEXTS.length)];
                          if(selected) setTimedBotMessage(selected.toUpperCase());
                      } else {
                          const specificMsg = TUTORIAL_HENRY_THOUGHTS[levelIndex]; 
                          if (specificMsg) setTimedBotMessage(specificMsg.toUpperCase()); 
                      }
                  } 
                  else { 
                      if (Math.random() < 0.6) { const selected = THOUGHT_BUBBLE_TEXTS[Math.floor(Math.random() * THOUGHT_BUBBLE_TEXTS.length)]; if(selected) setTimedBotMessage(selected.toUpperCase()); } 
                  }
              }
          }, 1500); animationTimersRef.current.push(delayTimer); return; 
      }
      
      // Demo Mode allows regular thoughts for all levels
      if (levelIndex < 5 && !isDemoMode) return;
      
      const interval = setInterval(() => { if (!botMessageData && Math.random() < 0.8 && levelIntroMessageShownRef.current) { const selected = THOUGHT_BUBBLE_TEXTS[Math.floor(Math.random() * THOUGHT_BUBBLE_TEXTS.length)]; if(selected) setTimedBotMessage(selected.toUpperCase()); } }, 8000); 
      return () => clearInterval(interval);
  }, [gameStatus, botMessageData, levelIndex, isGhostAtEnd, isTouchDevice, isDemoMode]);

  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      const shouldRun = (gameStatus === GameStatus.Planning) && isGameplayState && !worldCompleteData;
      if (shouldRun) { interval = setInterval(() => { setLevelTime(prev => { const newVal = prev + 1; levelTimeRef.current = newVal; return newVal; }); }, 1000); }
      return () => clearInterval(interval);
  }, [gameStatus, isGameplayState, worldCompleteData]);

  const isGhostAtOverlap = useMemo(() => !!(ghostPosition && mila && mila.visible && ghostPosition.row === mila.position.row && ghostPosition.col === mila.position.col), [ghostPosition, mila]);
  const effectiveMila = isGhostAtOverlap ? null : mila;
  useEffect(() => { if (isGhostAtOverlap) { setMila(null); } }, [isGhostAtOverlap]);
  useEffect(() => {
      if (appState === 'coop_play') return;
      if (gameStatus !== GameStatus.Planning || appState !== 'play') return;
      // Allow Mila in demo mode even for low levels
      if (levelIndex < 5 && !isDemoMode) return; 
      const interval = setInterval(() => { if (!mila && Math.random() < 0.2) { spawnMila(grid, botPosition, ghostPosition); } }, 12000);
      return () => clearInterval(interval);
    }, [gameStatus, mila, appState, grid, botPosition, ghostPosition, levelIndex, isDemoMode, spawnMila]);

  const startAutoplaySequence = useCallback((path: Move[], record: boolean = false) => {
      stopAutoplay();
      setIsAutoplayActive(true);
      setMoveSequence([]); 
      
      let step = 0;
      const inputNextMove = () => {
          if (step < path.length) {
              const move = path[step];
              setMoveSequence(prev => [...prev, { move, id: Date.now() + step }]);
              playSound('addMove');
              triggerHaptic('light');
              step++;
              autoplayTimeoutRef.current = setTimeout(inputNextMove, 400); // 400ms delay between simulated inputs
          } else {
              // Finished adding moves. Now simulate clicking Play.
              autoplayTimeoutRef.current = setTimeout(() => {
                  setSimulatedButtonHighlight('run'); // Highlight Play
                  setTimeout(() => {
                      setSimulatedButtonHighlight(null); // Unhighlight
                      // Call the latest function reference to avoid stale closure state
                      if (runSequenceRef.current) {
                          runSequenceRef.current(record);
                      }
                      
                      // Do NOT unset isAutoplayActive here for Demo Mode, keep it true until loadLevel
                      // Actually for regular autoplay (consumable), we might want to unset it.
                      if (!isDemoMode) setIsAutoplayActive(false); 
                  }, 300); // Hold button press for 300ms
              }, 500); // Wait 500ms after last move before clicking
          }
      };

      autoplayTimeoutRef.current = setTimeout(inputNextMove, 1000);
  }, [stopAutoplay, isDemoMode]);

  const triggerAutoplay = useCallback((record: boolean = false) => {
      // Allow Autoplay in Demo Mode (where isGameplayState is true but interactions disabled)
      // FIX: Bypass tutorial check for Demo Mode
      if ((!isGameplayState && !isDemoMode) || (isTutorialActive && !isDemoMode) || appState === 'coop_play') return;
      const result = solve(currentLevel, { requireAllGems: true });
      if (result.isSolvable && result.path) {
          startAutoplaySequence(result.path, record);
      } else {
          setTransientStatusMessage({ text: "No path to show", color: 'red' });
          setTimeout(() => setTransientStatusMessage(null), 2000);
      }
  }, [isGameplayState, isTutorialActive, appState, currentLevel, startAutoplaySequence, isDemoMode]);

  // Demo Mode Effect: Once in demo mode and level loaded, trigger solution
  useEffect(() => {
      if (isDemoMode && gameStatus === GameStatus.Planning && !isAutoplayActive && !isLoading && currentLevel) {
          const timer = setTimeout(() => {
              triggerAutoplay(false);
          }, 1500); // Wait 1.5s after load
          return () => clearTimeout(timer);
      }
  }, [isDemoMode, gameStatus, isAutoplayActive, isLoading, currentLevel, triggerAutoplay]);

  const handleUnlockAll = useCallback(() => {
      if (!confirm("UNLOCK ALL: This will mark all levels as completed. Continue?")) return;
      
      setResultsByLevel(prev => {
          const next = { ...prev };
          WORLDS.forEach(world => {
              world.levels.forEach(lvlIdx => {
                  if (!next[lvlIdx]) {
                      next[lvlIdx] = {
                          time: 1, 
                          moves: 0,
                          gems: "Skipped",
                          scoreBreakdown: {
                              gemScore: 0,
                              moveBonus: 0,
                              timeBonus: 0,
                              completionBonus: 0,
                              total: 0
                          }
                      };
                  }
              });
          });
          return next;
      });
      playSound('success');
      setTransientStatusMessage({ text: "All levels unlocked!", color: 'blue' });
      setTimeout(() => setTransientStatusMessage(null), 2000);
    }, [setResultsByLevel]);

  const handleNextLevel = useCallback(() => {
      if (isMoneyLevel(levelIndex)) {
          const lessonIdx = moneyLessonIndex(levelIndex);
          if (lessonIdx < MONEY_LESSONS.length - 1) { loadLevel(levelIndex + 1); }
          else { setAppState('main_menu'); }
          return;
      }
      if (levelIndex >= 10000 || levelIndex === -1) {
          setAppState('main_menu');
          return;
      }
      loadLevel(levelIndex + 1);
  }, [levelIndex, loadLevel]);

  const handlePlayCommunityLevel = useCallback((levelData: LevelDataForShare) => {
      stopAutoplay();
      const start = findPos(levelData.grid, CellType.Start);
      const end = findPos(levelData.grid, CellType.End);
      const fullLevel: Level = { ...levelData, start, end };

      setIsLoading(true);
      setTransitionState('outro');
      
      setTimeout(() => {
          setSceneKey(prev => prev + 1); 
          setLevelIndex(-1);
          setAppState('play');
          
          clearAnimationTimers();
          setGameStatus(GameStatus.Planning);
          setCurrentLevel(fullLevel);
          setGrid(fullLevel.grid);
          setBotPosition(fullLevel.start);
          setBotDirection(Move.Down);
          setMoveSequence([]);
          setExecutionPath([]);
          setCollectedPackages([]);
          setParticleEffects([]);
          setFailureType(null);
          setLevelResult(null);
          setLevelTime(0);
          levelTimeRef.current = 0;
          levelIntroMessageShownRef.current = false;
          setHasAutoSolved(false);
          setBotVisualState('spawn');
          setBotCelebrationState(null);
          setWallHitPosition(null);
          setCrumbledFloors([]);
          setTutorialStep(0);
          setBotMessageData(null);
          setWorldCompleteData(null);
          sequenceLogicRef.current.clear();

          setIsLoading(false);
          setTransitionState('intro');
          setTimeout(() => setBotVisualState('default'), 800);
      }, 600);
    }, [clearAnimationTimers, stopAutoplay, setLevelIndex]);

  const handleAutoSolve = async () => {
      if (gameStatus !== GameStatus.Planning || isLoading || autoSolvers <= 0 || isTutorialActive || hasAutoSolved || worldCompleteData) return;
      stopAutoplay();
      const result = solve(currentLevel, { requireAllGems: true });
      if (result.isSolvable && result.path) {
          const sequence: MoveWithId[] = result.path.map(move => ({ move, id: Date.now() + Math.random() }));
          setMoveSequence(sequence); setAutoSolvers(prev => Math.max(0, prev - 1)); setHasAutoSolved(true); playSound('success');
      } else {
          setTransientStatusMessage({ text: "No path found - try again", color: 'red' }); setTimeout(() => setTransientStatusMessage(null), 2000); playSound('fail_incomplete');
      }
  };

  const handleBuyConsumable = (id: string, price: number) => {
      if (currency >= price) { setSpentScore(prev => prev + price); if (id === 'autoSolver') { setAutoSolvers(prev => prev + 1); } playSound('unlock'); }
  };

  const showLevelInsight = useCallback((insight: LevelInsight) => {
      if (levelInsightTimerRef.current) {
          clearTimeout(levelInsightTimerRef.current);
      }
      setLevelInsight(insight);
      levelInsightTimerRef.current = window.setTimeout(() => {
          setLevelInsight(null);
      }, 2800);
  }, []);

  const hasTeleporterInLevel = useCallback((level: Level) => {
      return level.grid.some(row => row.some(cell => cell >= CellType.Teleporter_A && cell <= CellType.Teleporter_F));
  }, []);

  const getFailureInsight = useCallback((reason: FailureType, level: Level): LevelInsight => {
      const hasTeleporter = hasTeleporterInLevel(level);
      switch (reason) {
          case 'wall':
              return { title: 'Collision', tip: 'Turn one step earlier.', tone: 'warning' };
          case 'hole':
              return { title: 'Void', tip: 'Reroute around unstable tiles.', tone: 'danger' };
          case 'bomb':
              return { title: 'Blast', tip: 'Approach bombs from a safer lane.', tone: 'danger' };
          case 'missed_gem':
              return { title: 'Missed Package', tip: hasTeleporter ? 'Use teleporter shortcuts for side pickups.' : 'Collect first, then exit.', tone: 'warning' };
          case 'incomplete':
              return { title: 'Incomplete', tip: 'Finish objective before portal.', tone: 'warning' };
          case 'out_of_moves':
              return { title: 'Move Limit', tip: 'Same route, one detour less.', tone: 'warning' };
          case 'low_score':
              return { title: 'Score Low', tip: 'Collect more or finish faster.', tone: 'warning' };
          case 'broke':
              return { title: 'Out of Coins', tip: 'You ran short — keep enough coins in reserve for what you need.', tone: 'warning' };
          default:
              return { title: 'Retry', tip: 'Change one move and re-test.', tone: 'neutral' };
      }
  }, [hasTeleporterInLevel]);

  const getSuccessInsight = useCallback((result: LevelResult, level: Level, prevBest?: LevelResult | null): LevelInsight => {
      const par = level.par || 0;
      const medal = result.medal || 0;
      const medalEmoji = medal >= 3 ? '🥇' : medal === 2 ? '🥈' : '🥉';
      const medalName = MEDAL_NAME[medal] || 'Cleared';
      const beat = !!prevBest && (prevBest.scoreBreakdown?.total || 0) > 0 && result.scoreBreakdown.total > prevBest.scoreBreakdown.total;
      // Campaign (non-tutorial, non-money) levels get a tip that ties THIS run's
      // numbers to the world's money concept — the lesson fires in the same beat
      // as the reward. Other modes/custom levels get a generic efficiency tip.
      const isCampaign = appState === 'play' && levelIndex >= 0 && levelIndex < TOTAL_LEVELS && !isMoneyLevel(levelIndex);
      const concept = isCampaign ? WORLDS[Math.floor(levelIndex / LEVELS_PER_WORLD)]?.moneyConcept : null;

      let tip: string;
      if (concept) {
          if (medal >= 3) tip = `${concept.title}: flawless — every coin saved, no moves wasted!`;
          else if (par > 0 && result.moves > par) tip = `${concept.title}: ${result.moves - par} extra move${result.moves - par > 1 ? 's' : ''} — a tighter route keeps more coins.`;
          else if (!result.allGems) tip = `${concept.title}: you left coins behind — collect them all next time.`;
          else if (result.allBoosts === false) tip = `${concept.title}: grab every boost pad too for Gold!`;
          else tip = `${concept.title}: nice work — replay for Gold to master it.`;
      } else if (par > 0 && result.moves <= par) {
          tip = `${par - result.moves} under par. Clean route.`;
      } else if (par > 0) {
          tip = `${result.moves - par} over par. Trim a detour.`;
      } else {
          tip = 'Clean clear. Keep this rhythm.';
      }
      // Beat-your-best: shout a new record, otherwise show the bar to beat.
      if (beat) tip = `New best! ${tip}`;
      else if (prevBest && (prevBest.scoreBreakdown?.total || 0) > 0) tip = `${tip} (Best: ${prevBest.moves} moves)`;
      return { title: `${medalEmoji} ${medalName}`, tip, tone: 'success' };
  }, [appState, levelIndex]);

  const resetToPlanning = useCallback(() => {
      stopAutoplay();
      setSceneKey(prev => prev + 1); 
      clearAnimationTimers(); setGameStatus(GameStatus.Planning); setBotPosition(currentLevel.start); setBotDirection(Move.Down); setExecutionPath([]);
      setMoveSequence([]); setFailureType(null); setBotCelebrationState(null); setWallHitPosition(null); setCollectedPackages([]);
      setParticleEffects([]); setFailedMoveIndex(null); setCurrentMoveIndex(null); setCrumbledFloors([]); setTutorialStep(0); setBotMessageData(null); 
      sequenceLogicRef.current.clear(); setLevelTime(0); levelTimeRef.current = 0; setTransientStatusMessage(null); levelIntroMessageShownRef.current = false; setHasAutoSolved(false); 
      setBotVisualState('spawn'); setTimeout(() => setBotVisualState('default'), 1000); setWorldCompleteData(null);
      if (appState === 'coop_play' && coopGameId && coopRole) { updatePlayerStatus(coopGameId, coopRole, 'planning'); clearPlayerSequence(coopGameId, coopRole); }
  }, [currentLevel, appState, coopGameId, coopRole, clearAnimationTimers, stopAutoplay]);

  // Guards against a single failure being processed twice (which would
  // double-decrement lives). Reset whenever a fresh Planning phase begins.
  const lifeLossGuardRef = useRef(false);
  // True if the player lost a life on the CURRENT attempt — used to gate the
  // "perfect" celebration (a perfect run = Gold medal AND no life lost).
  const lifeLostThisAttemptRef = useRef(false);
  // Adaptive mercy + clean-streak tracking (campaign only). failsPerLevel counts
  // fails on each level this session; cleanStreak counts consecutive first-try
  // clean clears for an escalating coin bonus.
  const failsPerLevelRef = useRef<Record<number, number>>({});
  const cleanStreakRef = useRef(0);
  useEffect(() => { if (gameStatus === GameStatus.Planning) { lifeLossGuardRef.current = false; lifeLostThisAttemptRef.current = false; } }, [gameStatus]);

  const handleLifeLoss = useCallback((reason?: FailureType) => {
      if (lifeLossGuardRef.current) return;
      lifeLossGuardRef.current = true;
      lifeLostThisAttemptRef.current = true;
      triggerHaptic('error');
      stopAutoplay();

      const getFailureText = (r?: FailureType) => {
          if (!r) return "Try again!";
          switch(r) {
              case 'wall': return "Path blocked!";
              case 'hole': return "Fell in a hole!";
              case 'bomb': return "Boom! Hit a bomb";
              case 'incomplete': return "Get back to the portal";
              case 'missed_gem': return "Collect all the gems";
              case 'out_of_moves': return "Too many moves";
              case 'low_score': return "Score too low";
              case 'broke': return "You spent it on a want!";
              default: return "Try again!";
          }
      };

      const failureText = getFailureText(reason);

      if (appState === 'play' && levelIndex >= 5 && levelIndex < 10000 && !isDemoMode) {
          cleanStreakRef.current = 0; // any fail breaks the clean-clear streak
          const fails = (failsPerLevelRef.current[levelIndex] || 0) + 1;
          failsPerLevelRef.current[levelIndex] = fails;
          if (fails >= MERCY_FAILS) {
              // Adaptive mercy: a clearly-stuck kid stops losing lives (no send-back
              // to the world start) so they don't ragequit. Encourage + nudge hints.
              setTransientStatusMessage({ text: `${failureText} — keep trying, you've got this! 💪`, color: 'yellow' });
              return;
          }
          const nextLives = Math.max(0, lives - 1); setLives(nextLives);
          if (nextLives <= 0) {
              setTransientStatusMessage({ text: "Oh no! Back to the start of the world", color: 'red' }); 
              const worldStart = Math.floor(levelIndex / LEVELS_PER_WORLD) * LEVELS_PER_WORLD;
              setTimeout(() => { loadLevel(worldStart); setLives(3); }, 3000); 
          } 
          else { 
              const lifeWord = nextLives === 1 ? 'LIFE' : 'LIVES'; 
              setTransientStatusMessage({ text: `${failureText} - ${nextLives} ${lifeWord} LEFT`, color: 'red' }); 
          }
      } else if (appState === 'challenge_play' && challengeState.mode === 'daily') {
          const nextDailyLives = Math.max(0, dailyProgress.lives - 1); setDailyProgress(prev => ({ ...prev, lives: nextDailyLives }));
          if (nextDailyLives <= 0) { 
              setTransientStatusMessage({ text: "Out of lives!", color: 'red' }); 
              setTimeout(() => { setAppState('daily_hub'); }, 3000); 
          } 
          else { 
              setTransientStatusMessage({ text: `${failureText} - ${nextDailyLives} ATTEMPTS LEFT`, color: 'red' }); 
          }
      } else { 
          setTransientStatusMessage({ text: failureText, color: 'red' }); 
      }
    }, [appState, levelIndex, lives, challengeState.mode, dailyProgress.lives, loadLevel, stopAutoplay, isDemoMode, setDailyProgress]);

  const stopAndSaveRecording = useCallback(() => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === 'recording') {
          recorder.stop();
      }
      mediaRecorderRef.current = null;
  }, []);

  const handleVisualStep = useCallback((stepIndex: number) => {
      const logic = sequenceLogicRef.current.get(stepIndex);
      if (logic) {
          if (stepIndex > 0) playSound('move');
          setBotPosition(logic.pos);
          if (logic.collect) {
              const { type, score } = logic.collect;
              flushSync(() => {
                  setCollectedPackages(prev => {
                      if (prev.some(p => p.position.row === logic.pos.row && p.position.col === logic.pos.col)) return prev;
                      return [...prev, { position: logic.pos, type, score: POINTS.gem_value, timestamp: Date.now(), comboIndex: logic.comboIndex }];
                  });
              });
              if (logic.sound) playSound(logic.sound as any, logic.comboIndex || 0);
          }
          if (logic.isCrumble && logic.crumblePos) {
              const cPos = logic.crumblePos;
              flushSync(() => {
                  setCrumbledFloors(prev => { 
                      if (prev.some(p => p.row === cPos.row && p.col === cPos.col)) return prev; 
                      return [...prev, cPos]; 
                  });
              });
              playSound('crumble');
          }
          if (logic.isFailure && logic.failType) {
              setGameStatus(GameStatus.Failure);
              setFailureType(logic.failType);
              trackAdminEvent('level_failure', appState, {
                  reason: logic.failType,
                  levelIndex,
                  mode: appState === 'play' ? 'play' : appState === 'challenge_play' ? 'challenge' : appState === 'tournament_play' ? 'tournament' : appState === 'coop_play' ? 'coop' : 'other',
                  isMoneyLevel: appState === 'play' && isMoneyLevel(levelIndex),
                  worldIndex: levelIndex >= 0 && levelIndex < TOTAL_LEVELS && !isMoneyLevel(levelIndex) ? Math.floor(levelIndex / LEVELS_PER_WORLD) : -1
              }).catch(() => {});
              showLevelInsight(getFailureInsight(logic.failType, currentLevel));
              if (logic.hitPos) setWallHitPosition(logic.hitPos);
              setFailedMoveIndex(stepIndex); 
              playSound(logic.failType === 'wall' ? 'fail_wall' : logic.failType === 'bomb' ? 'fail_bomb' : logic.failType === 'trap' ? 'fail_trap' : 'fail_hole');
              handleLifeLoss(logic.failType);
              stopAndSaveRecording();
          }
      }
      const mappedIndex = visualStepToMoveIndexRef.current[stepIndex];
      if (mappedIndex !== undefined) setCurrentMoveIndex(mappedIndex);
    }, [handleLifeLoss, stopAndSaveRecording, showLevelInsight, getFailureInsight, currentLevel, appState, levelIndex]); 

  const handleSequenceFinish = useCallback(() => {
      const outcome = sequenceOutcomeRef.current;
      if (outcome && outcome.success && outcome.finalResult) {
          const result = outcome.finalResult;
          // Capture the prior best BEFORE we overwrite it (drives beat-your-best
          // coaching + auto-advance pacing). A perfect run = Gold medal earned
          // with no life lost this attempt.
          const prevBest = resultsByLevel[levelIndex];
          const isPerfect = isPerfectRun(result.medal || 0, lifeLostThisAttemptRef.current);
          flushSync(() => {
              setGameStatus(GameStatus.Success);
              setBotCelebrationState('level');
          });
          playSound(isPerfect ? 'perfect' : 'success');
          triggerHaptic('success');
          // Coin count-up "cha-ching" tally after the win chord (cleaned up on replay).
          [0, 1, 2, 3].forEach(i => {
              const tTick = window.setTimeout(() => playSound('coin_tick', i), 520 + i * 130);
              animationTimersRef.current.push(tTick);
          });
          if (isPerfect) {
              triggerHaptic('success');
              setTransientStatusMessage({ text: 'PERFECT! Every coin, zero waste 🥇', color: 'yellow' });
              setTimeout(() => setTransientStatusMessage(null), 2600);
          }
          if (appState === 'play' && !isDemoMode) setLives(3);
          setLevelResult(result);
          trackAdminEvent('level_complete', appState, {
              levelIndex,
              score: result.scoreBreakdown.total,
              moves: result.moves,
              time: result.time,
              mode: appState === 'play' ? 'play' : appState === 'challenge_play' ? 'challenge' : appState === 'tournament_play' ? 'tournament' : appState === 'coop_play' ? 'coop' : 'other',
              isMoneyLevel: appState === 'play' && isMoneyLevel(levelIndex),
              worldIndex: levelIndex >= 0 && levelIndex < TOTAL_LEVELS && !isMoneyLevel(levelIndex) ? Math.floor(levelIndex / LEVELS_PER_WORLD) : -1
          }).catch(() => {});
          // Money Mountain: reinforce the lesson's takeaway via the existing
          // non-blocking insight card (no modal). Otherwise the usual coaching tip.
          if (appState === 'play' && isMoneyLevel(levelIndex)) {
              showLevelInsight({ title: '💡 Money Lesson', tip: moneyLessonTakeaway(moneyLessonIndex(levelIndex)), tone: 'success' });
          } else {
              showLevelInsight(getSuccessInsight(result, currentLevel, prevBest));
          }
          stopAndSaveRecording();

          if (isDemoMode) {
              // Demo Mode: Accumulate score but DO NOT SAVE
              setDemoScoreAccumulator(prev => prev + result.scoreBreakdown.total);
              
              // Proceed to next level after delay
              const tNext = window.setTimeout(() => {
                  handleNextLevel();
              }, 2000); 
              animationTimersRef.current.push(tNext);
              return;
          }

          if (appState === 'play' && levelIndex < 10000) {
              const currentWorldIndex = Math.floor(levelIndex / LEVELS_PER_WORLD);
              const currentWorld = WORLDS[currentWorldIndex];
              const isLastLevel = currentWorld && currentWorld.levels[currentWorld.levels.length - 1] === levelIndex;
              const isFirstTime = !resultsByLevel[levelIndex] || resultsByLevel[levelIndex].time === 0;
              if (isFirstTime && isLastLevel && currentWorld) {
                  let worldScore = result.scoreBreakdown.total;
                  let worldMoves = result.moves;
                  let worldTime = result.time;
                  currentWorld.levels.forEach(lvlIdx => {
                      if (lvlIdx !== levelIndex && resultsByLevel[lvlIdx]) {
                          worldScore += resultsByLevel[lvlIdx].scoreBreakdown.total;
                          worldMoves += resultsByLevel[lvlIdx].moves;
                          worldTime += resultsByLevel[lvlIdx].time;
                      }
                  });
                  setResultsByLevel(prev => ({ ...prev, [levelIndex]: result })); 
                  setWorldCompleteData({
                      world: currentWorld,
                      stats: { score: worldScore, moves: worldMoves, time: worldTime }
                  });
                  trackAdminEvent('world_complete', 'play', { worldIndex: currentWorldIndex, score: worldScore }).catch(() => {});
                  playSound('world_complete');
                  return; 
              }
              setResultsByLevel(prev => {
                  const old = prev[levelIndex];
                  // Overwrite when the player did BETTER — higher score OR a better
                  // medal — so replaying a cleared level to chase Gold actually sticks.
                  const better = !old
                      || result.scoreBreakdown.total > (old.scoreBreakdown?.total || 0)
                      || (result.medal || 0) > (old.medal || 0);
                  return better ? { ...prev, [levelIndex]: result } : prev;
              });
          } else if (appState === 'play') {
              setResultsByLevel(prev => { 
                  const oldScore = prev[levelIndex]?.scoreBreakdown?.total || 0; 
                  if (result.scoreBreakdown.total > oldScore) { 
                      return { ...prev, [levelIndex]: result }; 
                  } 
                  return prev; 
              });
          }
          // Money Mountain: pay a one-time "lesson learned" bonus for clearing a
          // lesson by playing it (replaces the old quiz bonus). finlitQuizCorrect
          // now tracks which lessons have already paid out.
          if (appState === 'play' && !isDemoMode && isMoneyLevel(levelIndex)) {
              const lIdx = moneyLessonIndex(levelIndex);
              if (!finlitQuizCorrect.includes(lIdx)) {
                  setExtraScore(prev => prev + MONEY_LESSON_BONUS);
                  setFinlitQuizCorrect(prev => prev.includes(lIdx) ? prev : [...prev, lIdx]);
                  trackAdminEvent('lesson_complete', 'finlit', { lessonIndex: lIdx }).catch(() => {});
                  trackAdminEvent('coins_earned', 'lesson_bonus', { lessonIndex: lIdx, amount: MONEY_LESSON_BONUS }).catch(() => {});
                  setTransientStatusMessage({ text: `Lesson learned! +${MONEY_LESSON_BONUS} 🪙`, color: 'yellow' });
                  setTimeout(() => setTransientStatusMessage(null), 2500);
              }
          }
          // Clean-streak bonus: consecutive first-try, no-life-lost campaign
          // clears pay an escalating coin reward (rewards careful planning).
          if (appState === 'play' && !isDemoMode && levelIndex >= 5 && levelIndex < TOTAL_LEVELS && !isMoneyLevel(levelIndex)) {
              const cleanClear = !failsPerLevelRef.current[levelIndex] && !lifeLostThisAttemptRef.current;
              failsPerLevelRef.current[levelIndex] = 0; // reset for any future visit
              if (cleanClear) {
                  cleanStreakRef.current += 1;
                  if (cleanStreakRef.current >= 2) {
                      const bonus = Math.min(cleanStreakRef.current, CLEAN_STREAK_CAP) * CLEAN_STREAK_BONUS;
                      setExtraScore(prev => prev + bonus);
                      trackAdminEvent('coins_earned', 'clean_streak', { amount: bonus, streak: cleanStreakRef.current }).catch(() => {});
                      if (!isPerfect) {
                          setTransientStatusMessage({ text: `🔥 ${cleanStreakRef.current} clean clears! +${bonus} 🪙`, color: 'yellow' });
                          setTimeout(() => setTransientStatusMessage(null), 2500);
                      }
                  }
              } else {
                  cleanStreakRef.current = 0;
              }
          }
          // Let a medal-up or perfect run breathe before auto-advancing so the
          // celebration lands; ordinary clears keep the snappy 1.2s flow.
          const improvedMedal = (result.medal || 0) > (prevBest?.medal || 0);
          const advanceDelay = (appState === 'play' && (isPerfect || improvedMedal)) ? 3000 : 1200;
          const tNext = window.setTimeout(() => {
                if (appState === 'challenge_play') { handleChallengeNext(result.scoreBreakdown.total); }
                else if (appState === 'tournament_play') { handleTournamentNext(result.scoreBreakdown.total); }
                else if (appState === 'coop_play' && coopGameId && user?.uid) { reportCoopLevelComplete(coopGameId, user.uid); setTransientStatusMessage({ text: "Waiting for your friend...", color: 'yellow' }); }
                else { handleNextLevel(); }
          }, advanceDelay);
          animationTimersRef.current.push(tNext);
      } else if (outcome && !outcome.success && outcome.failure) {
          setGameStatus(GameStatus.Failure);
          setFailureType(outcome.failure);
          trackAdminEvent('level_failure', appState, {
              reason: outcome.failure,
              levelIndex,
              mode: appState === 'play' ? 'play' : appState === 'challenge_play' ? 'challenge' : appState === 'tournament_play' ? 'tournament' : appState === 'coop_play' ? 'coop' : 'other',
              isMoneyLevel: appState === 'play' && isMoneyLevel(levelIndex),
              worldIndex: levelIndex >= 0 && levelIndex < TOTAL_LEVELS && !isMoneyLevel(levelIndex) ? Math.floor(levelIndex / LEVELS_PER_WORLD) : -1
          }).catch(() => {});
          if (outcome.failure === 'incomplete' || outcome.failure === 'missed_gem' || outcome.failure === 'out_of_moves' || outcome.failure === 'low_score' || outcome.failure === 'broke') {
              showLevelInsight(getFailureInsight(outcome.failure, currentLevel));
          }
          playSound('fail_incomplete');
          handleLifeLoss(outcome.failure);
          stopAndSaveRecording();
      }
  }, [appState, levelIndex, coopGameId, user, resultsByLevel, handleChallengeNext, handleTournamentNext, handleNextLevel, handleLifeLoss, isDemoMode, setResultsByLevel, stopAndSaveRecording, showLevelInsight, getSuccessInsight, currentLevel, getFailureInsight, finlitQuizCorrect]);

  useEffect(() => {
      if (!isGameplayState && levelInsight) {
          setLevelInsight(null);
      }
  }, [isGameplayState, levelInsight]);

  useEffect(() => {
      return () => {
          if (levelInsightTimerRef.current) {
              clearTimeout(levelInsightTimerRef.current);
          }
      };
  }, []);

  const runSequence = useCallback(async (recordVideo: boolean = false) => {
      // Dismiss hint on run if still visible
      if (activeElementHint) {
          markHintSeen();
      }

      if (gameStatus !== GameStatus.Planning || moveSequence.length === 0) return;

      // W3 plan-commit guard: refuse to run a route that steps on an UNinspected
      // disguised deal — you must do your due diligence (inspect) before you commit.
      if (currentLevel.disguised?.length) {
          const uninspected = currentLevel.disguised.filter(k => !inspectedTiles.has(k));
          if (uninspected.length > 0) {
              const preview = simulateGame(grid, botPosition, moveSequence, currentLevel, levelTimeRef.current);
              const onRoute = new Set(preview.path.map(p => `${p.row},${p.col}`));
              if (uninspected.some(k => onRoute.has(k))) {
                  playSound('fail_wall');
                  triggerHaptic('warning');
                  setTransientStatusMessage({ text: "🔍 Inspect that deal before you commit!", color: 'red' });
                  setTimeout(() => setTransientStatusMessage(prev => prev && prev.text.includes('Inspect') ? null : prev), 2600);
                  return;
              }
          }
      }

      if (recordVideo && moveSequence.length === 0 && !isAutoplayActive) {
          triggerAutoplay(true);
          return;
      }

      // Bypass tutorial checks if in Demo Mode
      if (isTutorialActive && !isDemoMode) { 
          if (currentTutorialStep?.highlightedButton === 'run') { 
              setTutorialStep(prev => prev + 1); 
          } else { 
              playSound('fail_wall'); return; 
          } 
      }
      
      if (appState === 'coop_play' && coopGameId && coopRole) { updatePlayerStatus(coopGameId, coopRole, 'executing'); }
      
      triggerHaptic('medium'); 
      clearAnimationTimers(); clearMilaTimers(); 
      sequenceLogicRef.current.clear(); 
      setBotMessageData(null); 
      visualStepToMoveIndexRef.current = [];
      
      if (mila && mila.visible && appState !== 'coop_play') { setMila(prev => prev ? ({ ...prev, animationState: 'out', message: '' }) : null); const tMilaGone = window.setTimeout(() => setMila(null), 500); animationTimersRef.current.push(tMilaGone); }

      if (recordVideo) {
          const canvas = document.querySelector('canvas');
          if (canvas) {
              try {
                  const stream = canvas.captureStream(60);
                  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
                  recordedChunksRef.current = [];
                  recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
                  recorder.onstop = () => {
                      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `henrys_journey_level_${levelIndex}_${Date.now()}.webm`;
                      a.click();
                      URL.revokeObjectURL(url);
                  };
                  recorder.start();
                  mediaRecorderRef.current = recorder;
                  setTransientStatusMessage({ text: "REC ●", color: 'red' });
              } catch (e) { console.error("Failed to start recording", e); }
          }
      }
      
      // Calculate simulation result using pure function
      const result = simulateGame(
          grid, 
          botPosition, 
          moveSequence, 
          currentLevel, 
          levelTimeRef.current
      );

      // Update State with Results
      sequenceLogicRef.current = result.visualSteps;
      visualStepToMoveIndexRef.current = result.visualStepToMoveIndex;
      sequenceOutcomeRef.current = result.outcome;
      
      setMoveSequence(result.newSequence);
      setExecutionPath(result.path);
      setGameStatus(GameStatus.Executing);
    }, [activeElementHint, markHintSeen, gameStatus, moveSequence, isAutoplayActive, triggerAutoplay, isTutorialActive, isDemoMode, currentTutorialStep, appState, coopGameId, coopRole, clearAnimationTimers, clearMilaTimers, mila, grid, botPosition, currentLevel, levelIndex]);
  
  // Sync latest runSequence to Ref
  useEffect(() => {
      runSequenceRef.current = runSequence;
  }); // Runs every render to capture fresh closure

    const handleAddMove = useCallback(async (move: Move) => {
      // Dismiss hint on interaction
      if (activeElementHint) {
          markHintSeen();
      }

      if (gameStatus !== GameStatus.Planning) return;
      if (isTutorialActive) { if (currentTutorialStep?.highlightedMove === move) { setMoveSequence(prev => [...prev, { move, id: Date.now() }]); playSound('addMove'); triggerHaptic('light'); setTutorialStep(prev => prev + 1); } else { playSound('fail_wall'); triggerHaptic('error'); } return; }
      if (appState === 'coop_play' && coopGameId && coopRole) { const moveObj: MoveWithId = { move, id: Date.now() + Math.random(), owner: coopRole }; playSound('addMove'); triggerHaptic('light'); setMoveSequence(prev => [...prev, moveObj]); addMoveToCoopSession(coopGameId, moveObj, coopRole).catch(e => { console.error("Co-op move sync failed", e); setTransientStatusMessage({ text: "Connection issue - move may not sync", color: 'yellow' }); setTimeout(() => setTransientStatusMessage(null), 2000); }); return; }
      setMoveSequence(prev => [...prev, { move, id: Date.now() }]); 
      playSound('addMove');
      triggerHaptic('light');
    }, [activeElementHint, markHintSeen, gameStatus, isTutorialActive, currentTutorialStep, appState, coopGameId, coopRole]);
  
    const handleRemoveLastMove = useCallback(() => {
      // Dismiss hint on interaction
      if (activeElementHint) {
          markHintSeen();
      }

      if (isTutorialActive) return; 
      stopAutoplay();
      if (appState === 'coop_play' && coopGameId && coopRole) { setMoveSequence(prev => prev.slice(0, -1)); removeLastMoveFromCoopSession(coopGameId, coopRole).catch(e => console.error("Co-op undo sync failed", e)); playSound('removeMove'); triggerHaptic('light'); return; }
      setMoveSequence(prev => prev.slice(0, -1)); 
      playSound('removeMove');
      triggerHaptic('light');
    }, [activeElementHint, markHintSeen, isTutorialActive, stopAutoplay, appState, coopGameId, coopRole]);

  useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
          if (showSearchModal) return;
          if (gameStatus !== GameStatus.Planning) return;
          if (isDemoMode) return;
          if (e.key === 'ArrowUp') handleAddMove(Move.Up);
          if (e.key === 'ArrowDown') handleAddMove(Move.Down);
          if (e.key === 'ArrowLeft') handleAddMove(Move.Left);
          if (e.key === 'ArrowRight') handleAddMove(Move.Right);
          if (e.key === 'Backspace') { handleRemoveLastMove(); }
          if (e.key === 'Enter') runSequence(e.shiftKey);
          if (isAutoplayActive) stopAutoplay();
      };

      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSearchModal, gameStatus, isDemoMode, handleAddMove, handleRemoveLastMove, runSequence, isAutoplayActive, stopAutoplay]);

  const allWorlds = WORLDS;

  const handleSaveLevel = async (data: LevelDataForShare) => { 
      if (!user?.uid) return; 
      const name = generateLevelName(); 
      await saveUserLevel(user.uid, data, name); 
      setTransientStatusMessage({ text: `SAVED AS "${name.toUpperCase()}"`, color: 'blue' }); 
      setTimeout(() => setTransientStatusMessage(null), 2500); 
  };
  
  const handlePublishLevel = async (index: number) => { if (index < 10000) return; const customIdx = index - 10000; const levelEntry = customLevels[customIdx]; if (levelEntry && user?.uid) { try { await publishLevel(levelEntry.data, user.uid, user.name, levelEntry.name); trackAdminEvent('level_published', 'builder', {}).catch(() => {}); setTransientStatusMessage({ text: "Shared with everyone!", color: 'blue' }); setTimeout(() => setTransientStatusMessage(null), 2000); } catch(e) { console.error(e); setTransientStatusMessage({ text: "Could not share - try again", color: 'red' }); setTimeout(() => setTransientStatusMessage(null), 2000); } } };
  const handleDeleteLevel = async (index: number) => { if (index >= 10000) { const customIdx = index - 10000; const level = customLevels[customIdx]; if (level && user?.uid) { if (confirm("Delete this level?")) { await deleteUserLevel(user.uid, level.id); } } } };
  const handleLikeLevel = async (levelId: string, isLiking: boolean) => { if (!user?.uid) return; setLikedLevels(prev => isLiking ? [...prev, levelId] : prev.filter(id => id !== levelId)); await toggleLevelLike(user.uid, levelId, isLiking); };
  
  const handleCreateCoop = async () => {
      if (!user?.uid) return;
      try {
          const session = await createCoopSession(user.uid, user.name);
          trackAdminEvent('coop_create', 'coop', {}).catch(() => {});
          startCoopGame(true, session.id);
      } catch (e) { console.error("Coop Create Failed", e); }
  };
  
  const handleJoinCoop = async (code: string) => {
      if (!user?.uid) return;
      try {
          await joinCoopGame(code, user.uid, user.name);
          trackAdminEvent('coop_join', 'coop', {}).catch(() => {});
          startCoopGame(false, code);
      } catch (e) { console.error("Coop Join Failed", e); }
  };

  const partnerStatus = useMemo(() => {
      if (appState !== 'coop_play' || !coopState || !coopRole) return null;
      const partnerRole = coopRole === 'host' ? 'guest' : 'host';
      const status = partnerRole === 'host' ? coopState.hostStatus : coopState.guestStatus;
      if (status === 'finished') return { status: 'Finished', color: 'text-[var(--accent-green)]' };
      if (status === 'executing') return { status: 'Executing...', color: 'text-[var(--accent-yellow)] animate-pulse' };
      return { status: 'Planning...', color: 'text-white/50' };
  }, [appState, coopState, coopRole]);

  const partnerName = useMemo(() => {
      if (!coopState || !coopRole) return null;
      return coopRole === 'host' ? coopState.guestName : coopState.hostName;
  }, [coopState, coopRole]);

  const headerTitle = useMemo(() => {
      if (isDemoMode) return "Demo Mode";
      if (appState === 'tournament_play') return activeTournament?.name || "Arena";
      if (appState === 'challenge_play') {
          return challengeState.mode === 'daily' ? "Daily Run" : "Challenge Cup";
      }
      if (appState === 'coop_play') return "Co-op";
      if (appState === 'play' && isMoneyLevel(levelIndex)) return MONEY_LESSONS[moneyLessonIndex(levelIndex)].title;
      return undefined;
  }, [appState, activeTournament, challengeState.mode, isDemoMode, levelIndex]);

  const displayedTotalScore = useMemo(() => {
      if (isDemoMode) return demoScoreAccumulator;
      
      let baseScore = currency;
      if (appState === 'challenge_play') baseScore = challengeState.totalScore;
      else if (appState === 'tournament_play') baseScore = activeTournament?.currentScore || 0;
      if ((appState === 'challenge_play' || appState === 'tournament_play') && levelResult && gameStatus === GameStatus.Success) {
          return baseScore + levelResult.scoreBreakdown.total;
      }
      return baseScore;
  }, [appState, currency, challengeState.totalScore, activeTournament, levelResult, gameStatus, isDemoMode, demoScoreAccumulator]);

  const handleLogin = async () => {
      try {
          trackAdminEvent('sign_in_attempt').catch(() => {});
          await signInWithGoogle();
          trackAdminEvent('sign_in_success').catch(() => {});
          setShowAdminLoginModal(false);
          setShowCoopLoginModal(false);
          const stayOnAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
          setAppState(stayOnAdmin ? 'admin' : 'main_menu'); 
      } catch (e: any) {
          trackAdminEvent('sign_in_error').catch(() => {});
          if (e.message) alert(e.message);
      }
  };

  const openAdminPanel = useCallback(() => {
      if (!user) {
          setShowAdminLoginModal(true);
          return;
      }
      if (!isAdminUser) {
          alert(`Admin access is currently restricted to ${ADMIN_EMAIL}.`);
          return;
      }
      setAppState('admin');
  }, [user, isAdminUser]);

  const onNavigate = (state: AppState, subTab?: string) => {
      stopAutoplay();
      if (state === 'social' && subTab) { setSocialTab(subTab as any); }
      if (state === 'daily_hub') { handleOpenDailyHub(); return; }
      if (state === 'admin') {
          openAdminPanel();
          return;
      }
      if (coopGameId && (state !== 'coop_lobby' && state !== 'coop_play')) {
          leaveCoopGame(coopGameId).catch(console.error);
          setCoopGameId(null);
          setCoopState(null);
      }
      setAppState(state);
  };

  if (!fontsLoaded) {
      return (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-900 text-white">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
      <div 
        className={`fixed inset-0 z-[20] flex flex-col md:flex-row bg-[#1e293b] theme-${activeTheme} ${gameStatus === GameStatus.Failure ? 'shake-screen' : ''}`}
      >
          {/* Global Top Loading Bar */}
          {isLoading && (
              <div className="fixed top-0 left-0 w-full h-1 z-[1000] pointer-events-none overflow-hidden">
                  <div className="h-full bg-[var(--accent-cyan)] animate-loader-bar shadow-[0_0_10px_var(--accent-cyan)]"></div>
              </div>
          )}

          {/* Branded loader — only surfaces for slow level generation */}
          {isLoading && !isDemoMode && <LoadingIndicator index={levelIndex} />}

          {/* Hazard-typed failure vignette — a colored edge glow distinct per
              danger so kids learn each one. Static tint (no extra motion);
              skipped under reduced motion. */}
          {gameStatus === GameStatus.Failure && failureType && !prefersReducedMotion && (
              <div
                  className="fixed inset-0 z-[60] pointer-events-none"
                  style={{ boxShadow: `inset 0 0 120px 34px ${
                      failureType === 'bomb' ? 'rgba(239,68,68,0.5)' :
                      failureType === 'trap' ? 'rgba(249,115,22,0.5)' :
                      failureType === 'wall' ? 'rgba(251,191,36,0.42)' :
                      'rgba(59,130,246,0.42)'
                  }` }}
              />
          )}

          <div className="fixed inset-0 z-0">
              <SmoothBackground theme={activeTheme} />
              {showClouds && <GameClouds density={isLowPerformanceMode ? 'low' : 'normal'} />}
          </div>

          <Sidebar 
              activeState={appState}
              onNavigate={onNavigate}
              user={user}
              onLogin={handleLogin}
              inboxCount={invites.length}
          />

          <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent z-10">
              {transientStatusMessage && !isGameplayState && (
                  <div className="absolute top-8 left-0 w-full z-[1000] flex justify-center px-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                      <button 
                          onClick={transientStatusMessage.action}
                          disabled={!transientStatusMessage.action}
                          className={`font-display pointer-events-auto w-full max-w-md px-6 py-4 rounded-2xl font-bold tracking-wide text-base shadow-2xl border bg-slate-900/90 backdrop-blur-md flex items-center justify-center gap-2
                            ${transientStatusMessage.color === 'red' ? 'text-red-400 border-red-500/50' : 
                              transientStatusMessage.color === 'yellow' ? 'text-yellow-400 border-yellow-500/50' : 
                              'text-[var(--accent-blue)] border-[var(--accent-blue)]/50'} 
                            ${transientStatusMessage.action ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform hover:bg-black/90' : 'pointer-events-none'}`}
                      >
                          {transientStatusMessage.action && <span className="animate-pulse">▶</span>}
                          {transientStatusMessage.text}
                      </button>
                  </div>
              )}

              <div className="relative z-10 w-full h-full flex flex-col">
                  {appState === 'main_menu' && (
                      <WorldMapLanding
                          resultsByLevel={resultsByLevel}
                          currentLevelIndex={levelIndex}
                          quizCorrect={finlitQuizCorrect}
                          balance={currency}
                          earned={lifetimeScore}
                          spent={spentScore}
                          streak={dailyProgress.streak || 0}
                          savedGoalPeak={savedGoalPeak}
                          onOpenShop={() => setAppState('shop')}
                          onContinue={() => { setAppState('play'); loadLevel(levelIndex); }}
                          onSelectLevel={async (idx) => {
                              await loadLevel(idx);
                              setAppState('play');
                          }}
                          userName={user?.name}
                      />
                  )}

                  {appState === 'admin' && (
                      <React.Suspense fallback={<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)'}}>Loading…</div>}>
                          <AdminPanel
                              user={user}
                              onBack={() => setAppState('main_menu')}
                              onLogin={handleLogin}
                          />
                      </React.Suspense>
                  )}

                  {isGameplayState && (
                      <div className="w-full h-full relative">
                          <div className="absolute inset-0 z-0">
                              <Grid 
                                  gridData={grid}
                                  botPosition={botPosition}
                                  ghostPosition={ghostPosition} 
                                  gameStatus={gameStatus}
                                  botDirection={botDirection}
                                  botCelebrationState={botCelebrationState}
                                  botVisualState={botVisualState}
                                  collectedPackages={collectedPackages}
                                  particleEffects={particleEffects}
                                  failureType={failureType}
                                  gridScale={1}
                                  transitionState={transitionState}
                                  isEndGoalActive={isPortalActive} 
                                  isBotSleeping={isBotSleeping}
                                  isTutorialActive={isTutorialActive}
                                  highlightedTutorialArrow={currentTutorialStep?.highlightedMove || null}
                                  incorrectTutorialArrow={null}
                                  highlightedPosition={null}
                                  wallHitPosition={wallHitPosition}
                                  theme={currentLevel.theme || 'day'}
                                  levelResult={levelResult}
                                  hatId={hatState.equipped}
                                  missedGems={EMPTY_ARRAY}
                                  isCurrentMovePhased={false}
                                  plannedPathPositions={EMPTY_ARRAY}
                                  executionPath={executionPath}
                                  viewAngle={viewAngle}
                                  stepDuration={STEP_DURATION}
                                  mila={effectiveMila}
                                  circuitLinks={currentLevel.circuitLinks} 
                                  crumbledFloors={crumbledFloors} 
                                  onHoleHover={undefined}
                                  onVisualStep={handleVisualStep} 
                                  onSequenceFinish={handleSequenceFinish}
                                  henryBubble={null} 
                                  botMessage={botMessageData}
                                  isGhostAtEnd={isGhostAtEnd}
                                  appearance={appearance}
                                  sceneKey={sceneKey}
                                  onAddMove={handleAddMove}
                                  onRun={runSequence}
                                  disguisedSet={disguisedSet}
                                  inspectedSet={inspectedTiles}
                                  onCellClick={appState === 'play' ? handleInspectTile : undefined}
                                  activeHint={(!SHOW_GAMEPLAY_NOTIFICATIONS || isDemoMode) ? null : activeElementHint} // Hide hint bubbles in demo mode
                                  performanceMode={isLowPerformanceMode ? 'low' : 'normal'}
                              />
                              {isTutorialActive && (isTouchDevice || isMobileLayout) && (
                                  <TutorialGesture 
                                      gesture={currentTutorialStep?.highlightedMove || (currentTutorialStep?.highlightedButton === 'run' ? 'tap' : null)} 
                                  />
                              )}
                          </div>

                                                    <div className="absolute top-0 left-0 w-full z-[20] pointer-events-none">
                                                            {/* Adaptive Hint Button */}
                                                            {SHOW_GAMEPLAY_NOTIFICATIONS && showHintButton && gameStatus === GameStatus.Planning && appState === 'play' && levelIndex < 5 && !isDemoMode && (
                                                                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto">
                                                                    <button
                                                                        onClick={handleShowHint}
                                                                        className="px-5 py-2 rounded-2xl bg-yellow-200 text-slate-800 font-bold shadow-lg border border-yellow-400 hover:bg-yellow-300 transition-all animate-bounce"
                                                                        style={{ fontSize: 16 }}
                                                                    >
                                                                        Need a Hint?
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="pointer-events-auto">
                                                                    <Header 
                                                                            levelIndex={appState === 'challenge_play' ? challengeState.currentLevelIndex : (appState === 'tournament_play' ? activeTournament?.currentLevel || 0 : (appState === 'coop_play' ? (coopState?.levelIndex || 0) : (isMoneyLevel(levelIndex) ? moneyLessonIndex(levelIndex) : levelIndex)))}
                                                                            world={appState === 'challenge_play' || appState === 'tournament_play' || appState === 'coop_play' ? null : (isMoneyLevel(levelIndex) ? MONEY_WORLD : WORLDS[Math.floor(levelIndex / LEVELS_PER_WORLD)])}
                                                                            allWorlds={allWorlds}
                                                                            status={gameStatus}
                                                                            totalScore={displayedTotalScore} 
                                                                            failureType={failureType}
                                                                            tutorialMessage={getTutorialText(currentTutorialStep?.text)} 
                                                                            tutorialStep={tutorialStep}
                                                                            time={appState === 'tournament_play' && activeTournament ? Math.max(0, Math.floor((activeTournament.endTime - Date.now()) / 1000)) : levelTime}
                                                                            timeLabel={appState === 'tournament_play' ? "Time Left" : "Time"}
                                                                            levelResult={levelResult}
                                                                            currentLevel={currentLevel}
                                                                            onOpenGlobalMenu={() => setAppState('main_menu')} 
                                                                            isTutorialActive={isTutorialActive}
                                                                            onSkipTutorial={() => {}}
                                                                            transientStatusMessage={SHOW_GAMEPLAY_NOTIFICATIONS ? transientStatusMessage : null}
                                                                            onExit={handleExitGame}
                                                                            isCustomLevel={(levelIndex >= 10000 && !isMoneyLevel(levelIndex)) || levelIndex === -1}
                                                                            coopPlayers={appState === 'coop_play' && coopState ? { 
                                                                                    name: partnerName || 'Waiting...', 
                                                                                    isConnected: !!partnerName, 
                                                                                    partnerStatus: partnerStatus
                                                                            } : null}
                                                                            titleOverride={headerTitle}
                                                                            challengeMode={appState === 'challenge_play' ? challengeState.mode : undefined}
                                                                            movesCount={moveSequence.length}
                                                                                objectiveSummary={SHOW_OBJECTIVE_UI ? objectiveSummary : undefined}
                                                                                objectiveStatusLine={SHOW_OBJECTIVE_UI ? objectiveStatusLine : null}
                                                                            onOpenDailyHub={handleOpenDailyHub}
                                                                    />
                                                            </div>
                                                    </div>

                                                      {SHOW_GAMEPLAY_NOTIFICATIONS && levelInsight && (
                              <div className="absolute top-20 sm:top-24 left-0 w-full z-[25] px-3 sm:px-6 pointer-events-none flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="pointer-events-auto w-full max-w-xl">
                                      <LevelInsightCard
                                          title={levelInsight.title}
                                          tip={levelInsight.tip}
                                          tone={levelInsight.tone}
                                          onDismiss={() => setLevelInsight(null)}
                                      />
                                  </div>
                              </div>
                          )}

                          <div className="absolute left-0 w-full z-[20] flex flex-col pointer-events-none md:bottom-0 bottom-[calc(4rem+env(safe-area-inset-bottom))]">
                              <div className="pointer-events-auto w-full mx-auto">
                                  {appState === 'tournament_play' && activeTournament && (
                                      <TournamentLeaderboard 
                                          tournamentId={activeTournament.id} 
                                          currentUid={user?.uid}
                                          variant="ticker"
                                          theme="light"
                                      />
                                  )}
                                  {(SHOW_OBJECTIVE_UI && isGameplayState && objectiveProgress.hasAnyObjective) && (
                                      <ObjectiveChips
                                          celebrationKey={objectiveCelebrationTick}
                                          requiredTarget={objectiveProgress.requiredTarget}
                                          collectedRequired={objectiveProgress.collectedRequired}
                                          moveLimit={objectiveProgress.moveLimit}
                                          scoreTarget={objectiveProgress.scoreTarget}
                                          currentScore={objectiveProgress.currentScore}
                                          currentMoves={moveSequence.length}
                                          isCollectMet={objectiveProgress.isCollectMet}
                                          isMoveLimitMet={objectiveProgress.isMoveLimitMet}
                                          isScoreMet={objectiveProgress.isScoreMet}
                                          hasAnyObjective={objectiveProgress.hasAnyObjective}
                                      />
                                  )}
                                  {appState === 'play' && !isMoneyLevel(levelIndex) && (
                                      runWalletProjection
                                          ? <WalletHud
                                                wallet={runWalletProjection.wallet}
                                                exitPrice={runWalletProjection.exitPrice}
                                                kind={runWalletProjection.kind}
                                            />
                                          : <CoinTrip
                                                collected={objectiveProgress.collectedRequired}
                                                total={objectiveProgress.requiredTotal}
                                            />
                                  )}
                                  {appState === 'play' && (currentLevel.disguised?.length ?? 0) > 0 && gameStatus === GameStatus.Planning && (
                                      <div className="flex justify-center w-full px-4 pb-2 pointer-events-none">
                                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-cyan-400/40 shadow-lg">
                                              <span className="text-cyan-300 text-sm leading-none">🔍</span>
                                              <span className="font-display font-black text-cyan-200 text-sm leading-none tabular-nums">×{inspectsLeft}</span>
                                              <span className="w-px h-3 bg-white/15" />
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 leading-none">tap a gold deal to inspect</span>
                                          </div>
                                      </div>
                                  )}
                                  {appState === 'play' && currentLevel.inflateAt != null && gameStatus === GameStatus.Planning && (
                                      <div className="flex justify-center w-full px-4 pb-2 pointer-events-none">
                                          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-amber-300/40 shadow-lg">
                                              <span className="text-amber-300 text-sm leading-none">🎯</span>
                                              <span className="font-display font-black text-amber-200 text-sm leading-none tabular-nums">{objectiveProgress.scoreTarget ?? ''}</span>
                                              <span className="w-px h-3 bg-white/15" />
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 leading-none">savings goal — grab the bright coins fast, they fade!</span>
                                          </div>
                                      </div>
                                  )}
                                  {appState === 'play' && savingsProjection && gameStatus === GameStatus.Planning && (
                                      <div className="flex justify-center w-full px-4 pb-2 pointer-events-none">
                                          <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border shadow-lg transition-colors duration-300 ${savingsProjection.ripe ? 'border-emerald-300/60' : 'border-white/10'}`}>
                                              <span className="text-emerald-300 text-sm leading-none">💎</span>
                                              <span className="font-display font-black text-emerald-200 text-sm leading-none tabular-nums">
                                                  {savingsProjection.value != null ? <><span key={savingsProjection.value} className="inline-block animate-in zoom-in-75 duration-200">{savingsProjection.value}</span></> : '—'}
                                              </span>
                                              <span className="w-px h-3 bg-white/15" />
                                              <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${savingsProjection.ripe ? 'text-emerald-300' : 'text-white/40'}`}>
                                                  {savingsProjection.value == null ? 'savings — grab it late' : savingsProjection.ripe ? 'ripe! cash it in' : 'let it grow — wait longer'}
                                              </span>
                                          </div>
                                      </div>
                                  )}
                                  <Sequence
                                      sequence={moveSequence}
                                      isExecuting={gameStatus === GameStatus.Executing}
                                      failedMoveIndex={failedMoveIndex}
                                      currentMoveIndex={currentMoveIndex}
                                      gameStatus={gameStatus}
                                      isTouchDevice={isTouchDevice} 
                                      isPhasingMode={isPhasingMode}
                                      onTogglePhase={() => {}}
                                      isTutorialActive={isTutorialActive}
                                      tutorialHintMove={currentTutorialStep?.highlightedMove}
                                      highlightedButton={simulatedButtonHighlight || (currentTutorialStep?.highlightedButton || null)}
                                      isLoading={isLoading}
                                      onRemoveLastMove={handleRemoveLastMove}
                                      onRun={runSequence}
                                      onRetry={resetToPlanning}
                                      autoSolvers={(appState === 'challenge_play' || appState === 'tournament_play' || appState === 'coop_play' || (appState === 'play' && levelIndex < 5)) ? 0 : autoSolvers}
                                      onAutoSolve={handleAutoSolve}
                                      hasAutoSolved={hasAutoSolved}
                                      label={appState === 'coop_play' ? (coopRole === 'host' ? 'HOST' : 'GUEST') : undefined}
                                      accentColor={appState === 'coop_play' ? (coopRole === 'host' ? '#3b82f6' : '#f97316') : undefined}
                                      isOnline={appState === 'coop_play'}
                                      currentUserRole={appState === 'coop_play' ? coopRole : null}
                                      isGhostAtEnd={isGhostAtEnd} 
                                      isAutoplayActive={isAutoplayActive}
                                  />
                              </div>
                          </div>
                      </div>
                  )}

                  {/* ... (Render sub-components like MainMenu, etc. - no changes to their rendering logic, just props passed if state changed location) ... */}
                  {appState === 'build' && (
                      <div className="absolute inset-0 z-30">
                          <React.Suspense fallback={<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.6)'}}>Loading…</div>}>
                              <LevelBuilder
                                  onExit={() => {
                                      if (coopGameId) {
                                          leaveCoopGame(coopGameId).catch(console.error);
                                          setCoopGameId(null);
                                          setCoopState(null);
                                      }
                                      setAppState('main_menu');
                                  }}
                                  onSave={handleSaveLevel}
                                  user={user}
                                  isGuest={isGuest}
                                  onLogin={handleLogin}
                                  onOpenLevels={() => { }}
                              />
                          </React.Suspense>
                      </div>
                  )}

                  {appState === 'shop' && (
                      <ShopTab 
                          totalScore={currency}
                          hatState={hatState}
                          onBuyHat={(id, price) => {
                              if (currency >= price) {
                                  setSpentScore(prev => prev + price);
                                  setHatState(prev => ({ ...prev, unlocked: [...prev.unlocked, id] }));
                                  playSound('unlock');
                                  trackAdminEvent('shop_purchase', 'hat', { price }).catch(() => {});
                              } else {
                                  trackAdminEvent('purchase_blocked', 'hat', { price, balance: currency }).catch(() => {});
                              }
                          }}
                          onEquipHat={(id) => setHatState(prev => ({ ...prev, equipped: id }))}
                          appearance={appearance}
                          onUpdateAppearance={setAppearance}
                          autoSolvers={autoSolvers}
                          onBuyConsumable={(id, price) => {
                              if (currency >= price) {
                                  setSpentScore(prev => prev + price);
                                  if (id === 'autoSolver') setAutoSolvers(prev => prev + 1);
                                  playSound('unlock');
                                  trackAdminEvent('shop_purchase', 'consumable', { price }).catch(() => {});
                              } else {
                                  trackAdminEvent('purchase_blocked', 'consumable', { price, balance: currency }).catch(() => {});
                              }
                          }}
                      />
                  )}

                  {(appState === 'settings' || appState === 'help' || appState === 'about') && (
                      <SettingsView 
                          settings={settings}
                          onSettingsChange={(newSet) => setSettings(prev => ({ ...prev, ...newSet }))}
                          onResetProgress={async () => { 
                              if(confirm("FACTORY RESET: This will permanently erase all progress, scores, and unlocks. This cannot be undone. Are you sure?")) {
                                  if (user?.uid) {
                                      try { await resetUserProgress(user.uid); } catch (e) { console.error("Cloud reset failed", e); }
                                  }
                                  localStorage.clear();
                                  // Clear caches code omitted for brevity but should remain
                                  window.location.reload();
                              }
                          }}
                          onUnlockAll={handleUnlockAll} 
                          onNavigate={onNavigate}
                          initialTab={appState as 'settings' | 'help' | 'about'}
                      />
                  )}

                  {appState === 'social' && (
                      <SocialHub 
                          userUid={user?.uid || ''}
                          userName={user?.name || ''}
                          userPhoto={user?.picture}
                          isGuest={isGuest}
                          onLogin={handleLogin}
                          invites={invites}
                          initialTab={socialTab}
                          challengeData={null}
                          onStartCoop={handleStartCoopFromSocial}
                          onJoinCoop={handleJoinCoopFromSocial}
                          activeCoopGameId={coopGameId}
                          totalScore={currency}
                          completedLevels={Object.keys(resultsByLevel).length}
                          onUpdateName={(n) => user?.uid && updateUserName(user.uid, n)}
                          onUpdatePhoto={handleUpdatePhoto}
                          onLogout={logoutUser}
                          onDeleteAccount={handleDeleteAccount}
                          onJoinTournament={() => setAppState('challenge_setup')}
                          onPlayCommunityLevel={handlePlayCommunityLevel}
                          likedLevels={likedLevels}
                          onToggleLike={handleLikeLevel}
                          customLevels={customLevels}
                          resultsByLevel={resultsByLevel} 
                          onShareLevel={handleChallengeWithLevel}
                          onDeleteLevel={handleDeleteLevel}
                          onEnterBuilder={() => onNavigate('build')}
                      />
                  )}

                  {appState === 'daily_hub' && (
                      <DailyChallengeHub
                          dateStr={dailyProgress.date}
                          lives={dailyProgress.lives}
                          currentLevel={dailyProgress.currentLevel}
                          isCompleted={dailyProgress.isCompleted}
                          streak={dailyProgress.streak || 0}
                          onPlay={startDailyLevel}
                          onExit={() => setAppState('main_menu')}
                      />
                  )}

                  {appState === 'challenge_setup' && (
                      <TournamentHub 
                          onExit={() => setAppState('main_menu')}
                          onJoin={(seed, length) => startChallenge(seed, length)}
                          onJoinLive={handleTournamentJoin}
                          isGuest={isGuest}
                          onLogin={handleLogin}
                      />
                  )}

                  {appState === 'challenge_lobby' && challengeState.challenger && (
                      <ChallengeLobby 
                          challengerName={challengeState.challenger.name} 
                          score={challengeState.challenger.score} 
                          length={challengeState.totalLevels} 
                          onAccept={() => {
                              setChallengeState(prev => ({ ...prev, active: true, mode: 'standard', currentLevelIndex: 0, totalScore: 0 }));
                              setAppState('challenge_play');
                              loadChallengeLevel(0, challengeState.seed, challengeState.totalLevels, 'standard');
                          }}
                          onDecline={() => setAppState('main_menu')}
                      />
                  )}

                  {appState === 'challenge_complete' && (
                      <ChallengeComplete 
                          myScore={challengeState.totalScore} 
                          challenger={challengeState.challenger} 
                          seed={challengeState.seed}
                          length={challengeState.totalLevels}
                          userName={user?.name || 'Player'}
                          onExit={handleExitGame}
                          onOpenUserSearch={() => setShowSearchModal(true)}
                      />
                  )}

                  {appState === 'coop_lobby' && (
                      <CoopLobby 
                          gameId={coopGameId} 
                          isHost={coopRole === 'host'} 
                          onHost={handleCreateCoop}
                          onJoin={handleJoinCoop}
                          onInvite={() => setShowSearchModal(true)}
                          onExit={handleExitGame}
                          status={coopGameId ? (coopState?.guestUid ? 'active' : 'waiting') : 'connecting'}
                          guestName={coopState?.guestName}
                          user={user}
                          onLogin={handleLogin}
                          onStartCoopFromSocial={handleStartCoopFromSocial}
                          onJoinCoopFromSocial={handleJoinCoopFromSocial}
                      />
                  )}

                  {appState === 'tournament_summary' && activeTournament && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                          <div className="w-full h-full max-w-2xl bg-[var(--panel-bg)] p-6 flex flex-col">
                              <h2 className="text-2xl font-black text-center mb-4 text-white">HOURLY ARENA RESULTS</h2>
                              <div className="text-center mb-6">
                                  <p className="text-[var(--text-dark)] text-xs font-bold tracking-wide">Final Score</p>
                                  <p className="text-5xl font-black text-[var(--accent-yellow)]">{activeTournament.currentScore.toLocaleString()}</p>
                              </div>
                              <div className="flex-grow overflow-hidden relative rounded-xl border border-white/10">
                                  <TournamentLeaderboard tournamentId={activeTournament.id} currentUid={user?.uid} />
                              </div>
                              <button onClick={() => setAppState('main_menu')} className="modern-button w-full py-3 mt-4">Return to Menu</button>
                          </div>
                      </div>
                  )}

                  {appState === 'coop_play' && coopGameId && user && (
                      <CoopChat 
                          gameId={coopGameId} 
                          userUid={user.uid!} 
                          userName={user.name} 
                      />
                  )}
                  
                  {worldCompleteData && (
                      <WorldCompleteOverlay
                          world={worldCompleteData.world}
                          stats={worldCompleteData.stats}
                          onContinue={() => {
                              setWorldCompleteData(null);
                              handleNextLevel();
                          }}
                      />
                  )}

                  {appState === 'play' && moneyMission !== null && gameStatus === GameStatus.Planning && (
                      <MissionRibbon
                          lesson={MONEY_LESSONS[moneyMission]}
                          lessonIndex={moneyMission}
                          total={MONEY_LESSONS.length}
                          onDone={() => setMoneyMission(null)}
                      />
                  )}

                  {appState === 'play' && worldConcept !== null && moneyMission === null && gameStatus === GameStatus.Planning && WORLDS[worldConcept] && (
                      <WorldConceptRibbon
                          world={WORLDS[worldConcept]}
                          worldIndex={worldConcept}
                          total={WORLDS.length}
                          onDone={() => setWorldConcept(null)}
                      />
                  )}

                  {interestPayout && (
                      <InterestOverlay
                          result={interestPayout.result}
                          newBalance={interestPayout.newBalance}
                          onClose={() => { setInterestPayout(null); playSound('unlock'); }}
                      />
                  )}
              </div>
          </div>

          <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-black/20 backdrop-blur-2xl border-t border-white/10 grid grid-cols-5 items-center px-1 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
              <button 
                  onClick={() => onNavigate('challenge_setup')} 
                  className={`flex flex-col items-center justify-center gap-1 h-full ${appState === 'challenge_setup' || appState === 'tournament_play' ? 'text-[var(--accent-yellow)]' : 'text-white/40 hover:text-white'}`}
              >
                  <div className={appState === 'challenge_setup' ? 'scale-110' : 'scale-90'}><ICONS.Trophy /></div>
                  <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Arena</span>
              </button>

              <button 
                  onClick={handleOpenDailyHub} 
                  className={`flex flex-col items-center justify-center gap-1 h-full ${appState === 'daily_hub' ? 'text-[var(--accent-orange)]' : 'text-white/40 hover:text-white'}`}
              >
                  <div className={appState === 'daily_hub' ? 'scale-110' : 'scale-90'}><ICONS.Star /></div>
                  <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Daily</span>
              </button>

              <div className="relative -top-5 flex justify-center pointer-events-none">
                  <button 
                      onClick={() => onNavigate('main_menu')} 
                      className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${appState === 'main_menu' || appState === 'play' ? 'bg-[var(--accent-green)] border-white text-black scale-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-800 border-white/20 text-white/50 hover:bg-slate-700 hover:text-white'}`}
                  >
                      <div className="scale-125"><ICONS.Home /></div>
                  </button>
              </div>

              <button 
                  onClick={() => onNavigate('social', 'profile')} 
                  className={`flex flex-col items-center justify-center gap-1 h-full ${appState === 'social' ? 'text-[var(--accent-blue)]' : 'text-white/40 hover:text-white'}`}
              >
                  <div className={appState === 'social' ? 'scale-110' : 'scale-90'}><ICONS.User /></div>
                  <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>Social</span>
              </button>

              <button 
                  onClick={() => setShowMoreMenu(true)} 
                  className={`flex-1 flex flex-col items-center justify-center gap-1 h-full ${showMoreMenu ? 'text-white' : 'text-white/40 hover:text-white'}`}
              >
                  <div className={showMoreMenu ? 'scale-110' : 'scale-90'}><ICONS.Menu /></div>
                  <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-display)' }}>More</span>
              </button>
          </div>

          {showMoreMenu && (
              <MoreMenu 
                  onClose={() => setShowMoreMenu(false)}
                  onNavigate={onNavigate}
                  onSettings={() => setAppState('settings')}
                  onOpenDaily={handleOpenDailyHub}
                  onOpenShop={() => setAppState('shop')}
              />
          )}

          {showSearchModal && (
              <UserSearchModal
                  onClose={() => { setShowSearchModal(false); setCustomLevelInviteData(null); }}
                  currentUid={user?.uid || ''}
                  currentName={user?.name || 'Player'}
                  challengeData={
                      customLevelInviteData ? { 
                          customLevelId: customLevelInviteData.customLevelId,
                          levelName: customLevelInviteData.levelName
                      } : (appState === 'challenge_complete' || appState === 'challenge_play' ? {
                          seed: challengeState.seed,
                          length: challengeState.totalLevels,
                          score: challengeState.totalScore
                      } : undefined)
                  }
                  customSendHandler={appState === 'coop_lobby' ? handleCoopInvite : undefined}
                  secondaryActionLabel={appState === 'coop_lobby' ? "Copy Co-op Code" : undefined}
                  rowActionLabel={appState === 'coop_lobby' ? "Invite to Game" : undefined} 
                  onSecondaryAction={appState === 'coop_lobby' && coopGameId ? () => {
                      navigator.clipboard.writeText(coopGameId);
                      setTransientStatusMessage({ text: "Code copied!", color: 'blue' });
                      setTimeout(() => setTransientStatusMessage(null), 2000);
                      setShowSearchModal(false);
                  } : undefined}
              />
          )}

          {showCoopLoginModal && (
              <LoginModal 
                onClose={() => setShowCoopLoginModal(false)}
                onLogin={handleLogin}
                featureName="Online Co-op"
                description="Co-op missions are synchronized online. Please sign in to connect with a partner."
              />
          )}

                    {showAdminLoginModal && (
                            <LoginModal
                                onClose={() => setShowAdminLoginModal(false)}
                                onLogin={handleLogin}
                                featureName="Admin Dashboard"
                                description="Sign in with Google and use hayhamlt@gmail.com to access traffic and gameplay analytics."
                            />
                    )}

      </div>
  );
};
