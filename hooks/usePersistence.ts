
import { useState, useEffect } from 'react';
import { LevelResult, HatState, CharacterAppearance, DailyProgress, GameSettings, UserProfile } from '../types';
import { saveUserData } from '../firebase';

const DEFAULT_APPEARANCE: CharacterAppearance = {
    model: 'henry',
    skinColor: '#F2C48D',
    shirtColor: '#FF7675',
    pantsColor: '#74B9FF',
    hairColor: '#634236',
    eyeColor: '#333333'
};

const loadLocal = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
};

export const usePersistence = (user: UserProfile | null, isDataLoaded: boolean, disablePersistence: boolean = false) => {
    const [levelIndex, setLevelIndex] = useState(() => loadLocal('hj_level', 0));
    const [resultsByLevel, setResultsByLevel] = useState<{ [level: number]: LevelResult }>(() => loadLocal('hj_results', {}));
    const [hatState, setHatState] = useState<HatState>(() => loadLocal('hj_hats', { unlocked: ['none'], equipped: 'none' }));
    const [appearance, setAppearance] = useState<CharacterAppearance>(() => loadLocal('hj_appearance', DEFAULT_APPEARANCE));
    const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => loadLocal('hj_daily_progress', { date: '', lives: 3, currentLevel: 0, isCompleted: false }));
    const [settings, setSettings] = useState<GameSettings>(() => {
        const defaults: GameSettings = { musicVolume: 0.18, sfxVolume: 0.45, attractModeEnabled: true };
        const localSettings = loadLocal<Partial<GameSettings>>('hj_settings', defaults);
        return { ...defaults, ...localSettings };
    });
    const [seenHints, setSeenHints] = useState<number[]>(() => loadLocal('hj_seen_hints', []));
    const [extraScore, setExtraScore] = useState(() => loadLocal('hj_extra_score', 0));
    const [spentScore, setSpentScore] = useState(() => loadLocal('hj_spent_score', 0));
    const [autoSolvers, setAutoSolvers] = useState(() => loadLocal('hj_autosolvers', 3));
    const [finlitQuizCorrect, setFinlitQuizCorrect] = useState<number[]>(() => loadLocal('hj_finlit_quiz', []));
    const [lastInterestDate, setLastInterestDate] = useState<string>(() => loadLocal('hj_last_interest', ''));
    // Highest balance ever reached — ratchets the savings-goal tier so spending
    // never re-locks a goal you already passed (the meter fill still tracks live
    // currency). Persisted like the other money fields.
    const [savedGoalPeak, setSavedGoalPeak] = useState<number>(() => loadLocal('hj_saved_goal_peak', 0));
    const [cloudStatus, setCloudStatus] = useState<'synced' | 'saving' | 'error' | 'offline'>('synced');

    // Local Storage Effects - Only run if persistence is NOT disabled
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_level', JSON.stringify(levelIndex)); }, [levelIndex, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_results', JSON.stringify(resultsByLevel)); }, [resultsByLevel, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_hats', JSON.stringify(hatState)); }, [hatState, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_appearance', JSON.stringify(appearance)); }, [appearance, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_daily_progress', JSON.stringify(dailyProgress)); }, [dailyProgress, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_extra_score', JSON.stringify(extraScore)); }, [extraScore, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_spent_score', JSON.stringify(spentScore)); }, [spentScore, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_autosolvers', JSON.stringify(autoSolvers)); }, [autoSolvers, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_finlit_quiz', JSON.stringify(finlitQuizCorrect)); }, [finlitQuizCorrect, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_last_interest', JSON.stringify(lastInterestDate)); }, [lastInterestDate, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_saved_goal_peak', JSON.stringify(savedGoalPeak)); }, [savedGoalPeak, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_seen_hints', JSON.stringify(seenHints)); }, [seenHints, disablePersistence]);
    useEffect(() => { if (!disablePersistence) localStorage.setItem('hj_settings', JSON.stringify(settings)); }, [settings, disablePersistence]);

    // Calculate Lifetime Score
    const campaignScore = Object.values(resultsByLevel).reduce((acc: number, r) => acc + ((r as LevelResult).scoreBreakdown?.total || 0), 0);
    const lifetimeScore = campaignScore + extraScore;
    const currency = lifetimeScore - spentScore;

    // Cloud Sync Effect
    useEffect(() => {
        if (!user?.uid || !isDataLoaded || disablePersistence) return;
        const timer = setTimeout(() => {
            setCloudStatus('saving');
            saveUserData(user.uid!, { 
                totalScore: lifetimeScore, 
                resultsByLevel, 
                hatState, 
                completedLevels: Object.keys(resultsByLevel).length, 
                appearance, 
                extraScore, 
                spentScore, 
                autoSolvers,
                badges: user.badges || [],
                seenHints,
                dailyProgress,
                finlitQuizCorrect,
                lastInterestDate,
                savedGoalPeak
            })
            .then(() => setCloudStatus('synced'))
            .catch((e) => {
                console.error("Auto-save failed", e);
                setCloudStatus('error');
            });
        }, 2000);
        return () => clearTimeout(timer);
    }, [lifetimeScore, resultsByLevel, hatState, appearance, user, isDataLoaded, extraScore, spentScore, autoSolvers, seenHints, dailyProgress, finlitQuizCorrect, lastInterestDate, savedGoalPeak, disablePersistence]);

    return {
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
    };
};
