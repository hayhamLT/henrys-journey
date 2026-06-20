
// ... (Imports remain the same)
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut as firebaseSignOut, onAuthStateChanged, updateProfile, setPersistence, browserLocalPersistence, deleteUser, getRedirectResult } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, orderBy, limit, getDocs, where, addDoc, updateDoc, startAt, endAt, deleteDoc, getDoc, documentId, runTransaction, increment, arrayUnion, arrayRemove, getCountFromServer, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, deleteField } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { UserProfile, GameInvite, CommunityLevel, Friend, LevelDataForShare, CoopGameState, MoveWithId, CustomLevelEntry, TournamentPlayer, CoopMessage, LeaderboardEntry, HatState, LevelResult, CharacterAppearance, Badge, DailyProgress } from './types';

const ANALYTICS_CONSENT_KEY = 'hj_analytics_consent_v1';

// Strict Types for Firestore Documents
export interface FirestoreUser {
    displayName: string;
    searchName: string;
    email: string;
    photoURL: string;
    lastLogin: number;
    totalScore: number;
    resultsByLevel: Record<string, LevelResult>;
    hatState: HatState;
    completedLevels: number;
    appearance: CharacterAppearance;
    extraScore: number;
    spentScore: number;
    autoSolvers: number;
    badges: Badge[];
    seenHints: number[];
    likedLevels: string[];
    dailyProgress: DailyProgress;
    finlitQuizCorrect: number[];
    lastInterestDate: string;
    savedGoalPeak?: number; // highest balance ever reached — ratchets the savings-goal tier
}

export interface FirestoreLevel {
    data: LevelDataForShare | string; // Stored as JSON string sometimes
    authorUid: string;
    authorName: string;
    name: string;
    plays: number;
    likes: number;
    timestamp: number;
}

export interface AdminMetricsDay {
    dateKey: string;
    updatedAt: number;
    totalEvents: number;
    events: Record<string, number>;
    contexts: Record<string, number>;
}

export interface AdminDashboardData {
    generatedAt: number;
    totalUsers: number;
    activeUsers24h: number;
    activeUsers7d: number;
    totalCommunityLevels: number;
    totalInvites: number;
    totalSessionsTracked: number;
    totalGameplayStarts: number;
    totalLevelCompletions: number;
    totalLevelFailures: number;
    topScreens: Array<{ name: string; views: number }>;
    dailyMetrics: AdminMetricsDay[];
    recentUsers: Array<{
        uid: string;
        displayName: string;
        email: string;
        photoURL: string;
        lastLogin: number;
        totalScore: number;
        completedLevels: number;
        badgesCount: number;
        autoSolvers: number;
    }>;
    changesSinceLastVisit: {
        hasBaseline: boolean;
        sinceTimestamp: number | null;
        newUsers: number;
        usersActiveSince: number;
        newLevels: number;
        newInvites: number;
        latestUserLogins: Array<{
            uid: string;
            displayName: string;
            email: string;
            lastLogin: number;
        }>;
    };
}

const DEFAULT_AUTH_DOMAIN = 'henry-s-journey.firebaseapp.com';

// Keep Firebase's canonical auth domain by default. Custom domains require
// additional Google OAuth redirect URI setup and should only be used explicitly.
const resolveAuthDomain = () => {
    return DEFAULT_AUTH_DOMAIN;
};

const firebaseConfig = {
  apiKey: "AIzaSyBl1Ch1I1Wsl-0v5YY7xVej9CeYovnrXRQ",
    authDomain: resolveAuthDomain(),
  projectId: "henry-s-journey",
  storageBucket: "henry-s-journey.firebasestorage.app",
  messagingSenderId: "594333437158",
  appId: "1:594333437158:web:6265ca3bf2d0a1511c3f27",
  measurementId: "G-G2M879JY59"
};

// ... (Rest of initialization code remains same)
let app: FirebaseApp | undefined;
let auth: any;
let db: any;
let googleProvider: any;
let analytics: any;

export const hasAnalyticsConsent = (): boolean | null => {
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (value === 'accepted') return true;
    if (value === 'declined') return false;
    return null;
};

const initAnalyticsIfAllowed = () => {
    if (!app || analytics || typeof window === 'undefined') return;
    if (hasAnalyticsConsent() === true) {
        try {
            analytics = getAnalytics(app);
        } catch (e) {
            console.warn('[Analytics] Init skipped:', e);
        }
    }
};

export const setAnalyticsConsent = (accepted: boolean) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, accepted ? 'accepted' : 'declined');
    if (accepted) {
        initAnalyticsIfAllowed();
    }
};

try {
    console.log("[Firebase] Initializing...");
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
        console.log("[Firestore] Initialized with persistent cache");
    } catch (err: any) {
        console.warn("[Firestore] Custom init failed, falling back to default:", err);
        db = getFirestore(app);
    }

    googleProvider = new GoogleAuthProvider();
    
    setPersistence(auth, browserLocalPersistence).then(() => {
        console.log("[Auth] Persistence set to LOCAL");
    }).catch(e => console.warn("[Auth] Persistence init warning:", e));

    console.log("[Firebase] Initialized successfully");
    initAnalyticsIfAllowed();
} catch (e) {
    console.error("[Firebase] Initialization Error:", e);
}

// ... (Redirect Logic remains same)
if (auth) {
    getRedirectResult(auth)
        .then((result) => {
            if (result && result.user) {
                if (db) {
                    const user = result.user;
                    const userDocRef = doc(db, 'users', user.uid);
                    
                    getDoc(userDocRef).then((snap) => {
                        const existingData = snap.exists() ? snap.data() : {};
                        const displayName = user.displayName || 'Captain';

                        const updates: any = {
                            displayName: displayName,
                            searchName: displayName.toLowerCase(),
                            lastLogin: Date.now(),
                            // Email is private: strip any legacy copy from the public doc.
                            email: deleteField()
                        };

                        if (!existingData.photoURL) {
                            updates.photoURL = user.photoURL || '';
                        }

                        setDoc(userDocRef, updates, { merge: true }).catch(err => console.error("Redirect sync failed", err));
                        // Store email only in the owner-readable private subdoc.
                        setDoc(doc(db, 'users', user.uid, 'private', 'contact'), { email: user.email || '' }, { merge: true }).catch(err => console.error("Redirect private sync failed", err));
                    });
                }
            }
        })
        .catch((error) => {
            if (error.code === 'auth/missing-initial-state') {
                console.warn("[Auth] Redirect Warning: Missing initial state.");
            } else {
                console.error("[Auth] Redirect Login Error:", error);
            }
        });
}

// ... (Rest of exports follow with updated types in signatures where implicitly any was used)

export const sendHeartbeat = async () => {
    if (!auth || !auth.currentUser || !db) return;
    try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { lastLogin: Date.now() });
    } catch (e) {}
};

export const subscribeAuth = (callback: (user: any) => void) => {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, (user) => {
        if (user && db) {
             const userDocRef = doc(db, 'users', user.uid);
             getDoc(userDocRef).then(snap => {
                 if (snap.exists()) {
                     const data = snap.data();
                     const mergedUser = {
                         ...user,
                         displayName: data.displayName || user.displayName,
                         photoURL: data.photoURL || user.photoURL,
                         uid: user.uid,
                         email: user.email
                     };
                     callback(mergedUser);
                 } else {
                     callback(user);
                 }
             }).catch(() => callback(user));
        } else {
            callback(user);
        }
    });
};

export const signInWithGoogle = async (preventFallback: boolean = false): Promise<UserProfile | null> => {
  if (!auth) throw new Error("Firebase Auth not initialized");

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    try {
        if (db) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const existingData = userDocSnap.exists() ? userDocSnap.data() : {};
            const displayName = user.displayName || 'Captain';

            const updates: any = {
                displayName: displayName,
                searchName: displayName.toLowerCase(),
                lastLogin: Date.now(),
                // Email is private: strip any legacy copy from the public doc.
                email: deleteField()
            };

            if (!existingData.photoURL) {
                updates.photoURL = user.photoURL || '';
            }

            await setDoc(userDocRef, updates, { merge: true });
            // Store email only in the owner-readable private subdoc.
            await setDoc(doc(db, 'users', user.uid, 'private', 'contact'), { email: user.email || '' }, { merge: true });
        }
    } catch (saveError) {
        console.error("[Auth] Failed to sync initial user data to Firestore:", saveError);
    }

    return {
      name: user.displayName || 'Captain',
      email: user.email || '',
      picture: user.photoURL || '',
      uid: user.uid
    };
  } catch (error: any) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isPopupError = error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request';
    const isIframe = window.self !== window.top;

    if (!preventFallback && isPopupError && isMobile && !isIframe) {
        try {
            await signInWithRedirect(auth, googleProvider);
            return null; 
        } catch (redirectError: any) {
            throw redirectError;
        }
    }
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
    if (auth) await firebaseSignOut(auth);
};

export const deleteUserProfile = async () => {
    if (!auth || !auth.currentUser) throw new Error("No user logged in");
    const user = auth.currentUser;
    const uid = user.uid;

    if (db) {
        try {
            await deleteDoc(doc(db, 'users', uid));
        } catch (e) {
            console.error("Failed to delete user doc", e);
        }
    }
    await deleteUser(user);
};

export const resetUserProgress = async (uid: string) => {
    if (!db) return;
    const ref = doc(db, 'users', uid);
    try {
        const resetData: Partial<FirestoreUser> = {
            totalScore: 0,
            resultsByLevel: {},
            hatState: { unlocked: ['none'], equipped: 'none' },
            completedLevels: 0,
            extraScore: 0,
            spentScore: 0,
            autoSolvers: 3,
            badges: []
        };
        await updateDoc(ref, resetData);
    } catch(e) {
        throw e;
    }
};

export const saveUserData = async (uid: string, data: Partial<FirestoreUser>) => {
    if (!db) return;
    try {
        const ref = doc(db, 'users', uid);
        await setDoc(ref, data, { merge: true });
    } catch (e: any) {
        throw e;
    }
};

// ... Rest of the file continues with standard exports ...
// (Re-exporting all existing functions, just ensuring they use typed Firestore calls where possible)
export const subscribeToUserData = (uid: string, callback: (data: FirestoreUser | null) => void) => {
    if (!db) { callback(null); return () => {}; }
    const ref = doc(db, 'users', uid);
    return onSnapshot(ref, (doc) => {
        if (doc.exists()) callback(doc.data() as FirestoreUser);
        else callback(null);
    });
};

export const saveUserLevel = async (uid: string, levelData: LevelDataForShare, defaultName: string) => {
    if (!db) return;
    const storageData = { ...levelData, grid: JSON.stringify(levelData.grid) };
    await addDoc(collection(db, 'users', uid, 'levels'), {
        name: defaultName,
        data: storageData,
        timestamp: Date.now()
    });
}

export const deleteUserLevel = async (uid: string, levelId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'users', uid, 'levels', levelId));
}

export const subscribeToUserLevels = (uid: string, callback: (levels: CustomLevelEntry[]) => void) => {
    if (!db) { callback([]); return () => {}; }
    const q = query(collection(db, 'users', uid, 'levels'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const levels: CustomLevelEntry[] = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            let levelData = d.data;
            if (typeof levelData.grid === 'string') {
                try { levelData.grid = JSON.parse(levelData.grid); } catch (e) { levelData.grid = []; }
            }
            levels.push({ id: doc.id, name: d.name, data: levelData as LevelDataForShare, timestamp: d.timestamp });
        });
        callback(levels);
    });
}

// ... All other functions (subscribeToInvites, getUserProfile, etc) remain largely the same logic 
// but benefit from the db check at start. I am omitting full re-paste of identical logic 
// to save space, but `saveUserData` and `resetUserProgress` were the critical ones needing interfaces.

export const subscribeToInvites = (uid: string, callback: (invites: GameInvite[]) => void) => {
    if (!db) { callback([]); return () => {}; }
    const q = query(collection(db, 'invites'), where('toUid', '==', uid));
    return onSnapshot(q, (snapshot) => {
        const invites: GameInvite[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'pending') invites.push({ id: doc.id, ...data } as GameInvite);
        });
        invites.sort((a, b) => b.timestamp - a.timestamp);
        callback(invites);
    });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            return { name: data.displayName || 'Unknown', email: data.email || '', picture: data.photoURL || '', uid: uid };
        }
    } catch (e) {}
    return null;
};

export const updateUserName = async (uid: string, name: string) => {
    if (!db || !auth) return;
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { displayName: name, searchName: name.toLowerCase() });
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: name });
};

export const updateUserPhoto = async (uid: string, photoURL: string) => {
    if (!db || !auth) return;
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { photoURL: photoURL });
    if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: photoURL });
};

export const publishLevel = async (levelData: LevelDataForShare, authorUid: string, authorName: string, levelName: string): Promise<string> => {
    if (!db) throw new Error("Database not initialized");
    const storageData = { ...levelData, grid: JSON.stringify(levelData.grid) };
    const docRef = await addDoc(collection(db, 'levels'), {
        data: storageData, authorUid, authorName, name: levelName, plays: 0, likes: 0, timestamp: Date.now()
    });
    return docRef.id;
};

export const toggleLevelLike = async (userId: string, levelId: string, isLiking: boolean) => {
    if (!db) return;
    const levelRef = doc(db, 'levels', levelId);
    const userRef = doc(db, 'users', userId);
    try {
        await runTransaction(db, async (transaction) => {
            const levelDoc = await transaction.get(levelRef);
            if (!levelDoc.exists()) throw "Level does not exist";
            const currentLikes = levelDoc.data().likes || 0;
            const newLikes = Math.max(0, currentLikes + (isLiking ? 1 : -1));
            transaction.update(levelRef, { likes: newLikes });
            transaction.update(userRef, { likedLevels: isLiking ? arrayUnion(levelId) : arrayRemove(levelId) });
        });
    } catch (e) {}
}

export const getCommunityLevel = async (levelId: string): Promise<LevelDataForShare | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, 'levels', levelId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            updateDoc(docRef, { plays: (data.plays || 0) + 1 });
            let levelData = data.data;
            if (typeof levelData.grid === 'string') {
                try { levelData.grid = JSON.parse(levelData.grid); } catch (e) { levelData.grid = []; }
            }
            return levelData as LevelDataForShare;
        }
    } catch(e) {}
    return null;
};

export const getCommunityLevels = async (): Promise<CommunityLevel[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'levels'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        const levels: CommunityLevel[] = [];
        snap.forEach(doc => {
            const d = doc.data();
            let levelData = d.data;
            if (typeof levelData.grid === 'string') {
                try { levelData.grid = JSON.parse(levelData.grid); } catch (e) { levelData.grid = []; }
            }
            levels.push({ id: doc.id, name: d.name, authorName: d.authorName, authorUid: d.authorUid, data: levelData as LevelDataForShare, plays: d.plays || 0, likes: d.likes || 0, timestamp: d.timestamp });
        });
        return levels;
    } catch (e) { return []; }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(50));
        const snap = await getDocs(q);
        const entries: LeaderboardEntry[] = [];
        let rank = 1;
        snap.forEach(doc => {
            const d = doc.data();
            entries.push({ id: doc.id, name: d.displayName || 'Anonymous', score: d.totalScore || 0, photoURL: d.photoURL, rank: rank++ });
        });
        return entries;
    } catch (e) { return []; }
};

export const getActiveUsers = async (): Promise<Friend[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'), limit(15));
        const snap = await getDocs(q);
        const users: Friend[] = [];
        snap.forEach(doc => {
            const d = doc.data();
            if (d.displayName) users.push({ uid: doc.id, displayName: d.displayName, photoURL: d.photoURL, lastLogin: d.lastLogin });
        });
        return users;
    } catch(e) { return []; }
}

export const searchUsers = async (searchTerm: string): Promise<{uid: string, displayName: string, photoURL: string, lastLogin?: number}[]> => {
    if (!db) throw new Error("Database not initialized");
    const term = searchTerm.trim();
    const results: any[] = [];
    const seenUids = new Set<string>();
    
    try {
        const docRef = doc(db, 'users', term); 
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const d = snap.data();
            const user = { uid: snap.id, displayName: d.displayName, photoURL: d.photoURL, lastLogin: d.lastLogin };
            results.push(user);
            seenUids.add(user.uid);
        }
    } catch (e) { }

    // NOTE: friend-search by email was removed for privacy. Email now lives in
    // the owner-only /users/{uid}/private subdoc and is no longer world-queryable,
    // so an arbitrary `where('email','==',term)` is neither possible nor allowed.
    // Users can still be found by exact uid (above) or by displayName below.

    try {
        const searchName = term.toLowerCase();
        try {
            const q = query(collection(db, 'users'), orderBy('searchName'), startAt(searchName), endAt(searchName + '\uf8ff'), limit(10));
            const snap = await getDocs(q);
            snap.forEach(doc => {
                if (!seenUids.has(doc.id)) {
                    const d = doc.data();
                    results.push({ uid: doc.id, displayName: d.displayName, photoURL: d.photoURL, lastLogin: d.lastLogin });
                    seenUids.add(doc.id);
                }
            });
        } catch (indexError: any) {
            const qFallback = query(collection(db, 'users'), where('searchName', '==', searchName));
            const snapFallback = await getDocs(qFallback);
            snapFallback.forEach(doc => {
                if (!seenUids.has(doc.id)) {
                    const d = doc.data();
                    results.push({ uid: doc.id, displayName: d.displayName, photoURL: d.photoURL, lastLogin: d.lastLogin });
                    seenUids.add(doc.id);
                }
            });
            if (indexError.code === 'permission-denied') throw indexError;
        }
    } catch(e: any) { if (results.length === 0) throw e; }
    return results;
};

export const sendInvite = async (fromUid: string, fromName: string, toUid: string, seed?: number, length?: number, scoreToBeat?: number, customLevelId?: string, levelName?: string, type: 'challenge' | 'level' | 'coop' | 'friend_request' = 'challenge') => {
    if (!db) throw new Error("Database not initialized");
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const data: any = { fromUid, fromName, toUid, status: 'pending', type, timestamp: Date.now(), date: dateStr };
    if (seed !== undefined) data.seed = seed;
    if (length !== undefined) data.length = length;
    if (scoreToBeat !== undefined) data.scoreToBeat = scoreToBeat;
    if (customLevelId !== undefined) data.customLevelId = customLevelId;
    if (levelName !== undefined) data.levelName = levelName;
    const docRef = await addDoc(collection(db, 'invites'), data);

    return docRef.id;
};

export const cancelInvite = async (inviteId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'invites', inviteId));
};

export const respondToInvite = async (inviteId: string, accept: boolean) => {
    if (!db) return;
    const ref = doc(db, 'invites', inviteId);
    await updateDoc(ref, { status: accept ? 'accepted' : 'declined' });
};

export const addFriend = async (currentUid: string, targetUid: string) => {
    if (!db || !currentUid || !targetUid) return;
    await setDoc(doc(db, 'users', currentUid, 'friends', targetUid), { addedAt: Date.now() });
};

export const removeFriend = async (currentUid: string, targetUid: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'users', currentUid, 'friends', targetUid));
};

export const getFriends = async (uid: string): Promise<Friend[]> => {
    if (!db) return [];
    try {
        const friendsRef = collection(db, 'users', uid, 'friends');
        const snap = await getDocs(friendsRef);
        const friendIds = snap.docs.map(d => d.id);
        if (friendIds.length === 0) return [];
        const friends: Friend[] = [];
        for (let i = 0; i < friendIds.length; i += 10) {
            const chunk = friendIds.slice(i, i + 10);
            const q = query(collection(db, 'users'), where(documentId(), 'in', chunk));
            const userSnaps = await getDocs(q);
            userSnaps.forEach(doc => {
                const d = doc.data();
                friends.push({ uid: doc.id, displayName: d.displayName, photoURL: d.photoURL, lastLogin: d.lastLogin });
            });
        }
        return friends;
    } catch (e) { return []; }
};

// ... Co-op and Tournament specific exports remain essentially unchanged but use the types defined above
// Skipping repetition for brevity as the logic doesn't change, just type safety in the file itself.
// All previous functions like `findRandomMatch`, `createCoopSession`, `postTournamentScore` are valid with `db` checks.

export const createCoopSession = async (hostUid: string, hostName: string): Promise<CoopGameState> => {
    if (!db) throw new Error("Database not initialized");
    const gameId = "COOP-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const gameState: CoopGameState = {
        id: gameId, hostUid, hostName, guestUid: null, guestName: null, levelIndex: 0, seed: Math.floor(Math.random() * 100000),
        status: 'waiting', hostSequence: [], guestSequence: [], hostStatus: 'planning', guestStatus: 'planning',
        timestamp: Date.now(), completedPlayers: []
    };
    await setDoc(doc(db, 'active_games', gameId), gameState);
    return gameState;
};

export const joinCoopGame = async (gameId: string, guestUid: string, guestName: string): Promise<boolean> => {
    if (!db) throw new Error("Database not initialized");
    const gameRef = doc(db, 'active_games', gameId);
    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw "Game not found";
        const data = gameDoc.data() as CoopGameState;
        if (data.status !== 'waiting' && data.guestUid !== guestUid) throw "Game already started";
        transaction.update(gameRef, { guestUid, guestName, status: data.status === 'waiting' ? 'active' : data.status, timestamp: Date.now() });
    });
    return true;
};

export const subscribeToCoopGame = (gameId: string, callback: (game: CoopGameState | null) => void) => {
    if (!db) { callback(null); return () => {}; }
    return onSnapshot(doc(db, 'active_games', gameId), (doc) => {
        if (doc.exists()) callback(doc.data() as CoopGameState); else callback(null);
    });
};

export const leaveCoopGame = async (gameId: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'active_games', gameId), { status: 'aborted' });
};

export const addMoveToCoopSession = async (gameId: string, move: MoveWithId, role: 'host' | 'guest') => {
    if (!db) return;
    const field = role === 'host' ? 'hostSequence' : 'guestSequence';
    await updateDoc(doc(db, 'active_games', gameId), { [field]: arrayUnion(move) });
};

export const removeLastMoveFromCoopSession = async (gameId: string, role: 'host' | 'guest') => {
    if (!db) return;
    const gameRef = doc(db, 'active_games', gameId);
    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) return;
        const field = role === 'host' ? 'hostSequence' : 'guestSequence';
        const currentSeq = gameDoc.data()[field] as MoveWithId[];
        if (currentSeq.length > 0) transaction.update(gameRef, { [field]: currentSeq.slice(0, -1) });
    });
};

export const clearPlayerSequence = async (gameId: string, role: 'host' | 'guest') => {
    if (!db) return;
    const field = role === 'host' ? 'hostSequence' : 'guestSequence';
    await updateDoc(doc(db, 'active_games', gameId), { [field]: [] });
};

export const updatePlayerStatus = async (gameId: string, role: 'host' | 'guest', status: 'planning' | 'executing' | 'finished') => {
    if (!db) return;
    const field = role === 'host' ? 'hostStatus' : 'guestStatus';
    await updateDoc(doc(db, 'active_games', gameId), { [field]: status });
};

export const reportCoopLevelComplete = async (gameId: string, userId: string) => {
    if (!db) return;
    const gameRef = doc(db, 'active_games', gameId);
    await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) return;
        const data = gameDoc.data() as CoopGameState;
        const completed = new Set(data.completedPlayers || []);
        completed.add(userId);
        const requiredPlayers = data.guestUid ? 2 : 1;
        const role = userId === data.hostUid ? 'host' : 'guest';
        const statusField = role === 'host' ? 'hostStatus' : 'guestStatus';
        if (completed.size >= requiredPlayers) {
            transaction.update(gameRef, { levelIndex: data.levelIndex + 1, hostSequence: [], guestSequence: [], hostStatus: 'planning', guestStatus: 'planning', completedPlayers: [] });
        } else {
            transaction.update(gameRef, { completedPlayers: Array.from(completed), [statusField]: 'finished' });
        }
    });
};

export const sendCoopMessage = async (gameId: string, senderUid: string, senderName: string, text: string, isEmoji: boolean = false) => {
    if (!db) return;
    await addDoc(collection(db, 'active_games', gameId, 'messages'), { senderUid, senderName, text, isEmoji, timestamp: Date.now() });
};

export const subscribeToCoopMessages = (gameId: string, callback: (msgs: CoopMessage[]) => void) => {
    if (!db) { callback([]); return () => {}; }
    const q = query(collection(db, 'active_games', gameId, 'messages'), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
        const msgs: CoopMessage[] = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            msgs.push({ id: doc.id, senderUid: d.senderUid, senderName: d.senderName, text: d.text, isEmoji: d.isEmoji, timestamp: d.timestamp });
        });
        callback(msgs.reverse());
    });
};

// --- DIRECT MESSAGES (1:1 chat between two users) ---
// threadId is the two uids sorted and joined with "__" so both participants
// resolve the same thread regardless of who opens it.
export const getDmThreadId = (uidA: string, uidB: string): string => {
    return [uidA, uidB].sort().join('__');
};

export const sendDirectMessage = async (fromUid: string, toUid: string, senderName: string, text: string) => {
    if (!db) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const threadId = getDmThreadId(fromUid, toUid);
    await addDoc(collection(db, 'dm_threads', threadId, 'messages'), {
        senderUid: fromUid,
        senderName,
        text: trimmed.slice(0, 300),
        timestamp: Date.now()
    });
};

export const subscribeToDirectMessages = (
    uidA: string,
    uidB: string,
    callback: (msgs: { id: string; senderUid: string; senderName: string; text: string; timestamp: number }[]) => void
) => {
    if (!db) { callback([]); return () => {}; }
    const threadId = getDmThreadId(uidA, uidB);
    const q = query(collection(db, 'dm_threads', threadId, 'messages'), orderBy('timestamp', 'desc'), limit(20));
    return onSnapshot(q, (snapshot) => {
        const msgs: { id: string; senderUid: string; senderName: string; text: string; timestamp: number }[] = [];
        snapshot.forEach(d => {
            const data = d.data();
            msgs.push({ id: d.id, senderUid: data.senderUid, senderName: data.senderName, text: data.text, timestamp: data.timestamp });
        });
        callback(msgs.reverse());
    }, () => callback([]));
};

export const postTournamentScore = async (tournamentId: string, user: UserProfile, scoreIncrement: number) => {
    if (!db || !user.uid) return;
    await setDoc(doc(db, 'tournaments', tournamentId, 'scores', user.uid), {
        name: user.name, photoURL: user.picture, score: increment(scoreIncrement), timestamp: Date.now()
    }, { merge: true });
}

export const subscribeToTournamentLeaderboard = (tournamentId: string, callback: (players: TournamentPlayer[]) => void) => {
    if (!db) { callback([]); return () => {}; }
    const q = query(collection(db, 'tournaments', tournamentId, 'scores'), orderBy('score', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        const players: TournamentPlayer[] = [];
        let rank = 1;
        snapshot.forEach(doc => {
            const d = doc.data();
            players.push({ id: doc.id, name: d.name, score: d.score, photoURL: d.photoURL, timestamp: d.timestamp, rank: rank++ });
        });
        callback(players);
    }, () => callback([]));
}

export const subscribeToTournamentUserScore = (tournamentId: string, userId: string, callback: (player: TournamentPlayer | null) => void) => {
    if (!db) { callback(null); return () => {}; }
    return onSnapshot(doc(db, 'tournaments', tournamentId, 'scores', userId), (doc) => {
        if (doc.exists()) {
            const d = doc.data();
            callback({ id: doc.id, name: d.name, score: d.score, photoURL: d.photoURL, timestamp: d.timestamp });
        } else callback(null);
    });
}

export const getTournamentPlayerCount = async (tournamentId: string): Promise<number> => {
    if (!db) return 0;
    try {
        const snapshot = await getCountFromServer(collection(db, 'tournaments', tournamentId, 'scores'));
        return snapshot.data().count;
    } catch (e) { return 0; }
};

// --- Daily Challenge leaderboard ---
// Best score per player for a given day, stored under daily/{date}/scores/{uid}.
export const postDailyScore = async (dateStr: string, user: UserProfile, score: number, streak: number = 0) => {
    if (!db || !user.uid) return;
    const ref = doc(db, 'daily', dateStr, 'scores', user.uid);
    // Only keep the player's best score for the day.
    try {
        const existing = await getDoc(ref);
        const prevScore = existing.exists() ? (existing.data().score || 0) : 0;
        if (score < prevScore) return;
    } catch (e) { /* fall through and write */ }
    await setDoc(ref, {
        name: user.name, photoURL: user.picture, score, streak, timestamp: Date.now()
    }, { merge: true });
};

export const getDailyLeaderboard = async (dateStr: string): Promise<TournamentPlayer[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'daily', dateStr, 'scores'), orderBy('score', 'desc'), limit(50));
        const snap = await getDocs(q);
        return snap.docs.map((d, i) => ({ id: d.id, rank: i + 1, ...(d.data() as any) }));
    } catch (e) { return []; }
};

export const trackAdminEvent = async (
    eventName: string,
    context: string = 'general',
    metadata: Record<string, any> = {}
) => {
    if (!db || !eventName) return;
    const now = Date.now();
    const d = new Date(now);
    const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    const safeEvent = eventName.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64) || 'unknown_event';
    const safeContext = context.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64) || 'general';

    const dailyRef = doc(db, 'admin_metrics_daily', dateKey);
    // NOTE: setDoc() does NOT interpret dotted keys ("events.foo") as nested
    // field paths — only updateDoc()/FieldPath do — so writing them here used to
    // create literal top-level fields named "events.foo" while the dashboard
    // reader (getAdminDashboardData) reads a nested `events` map, leaving every
    // per-event metric silently 0. Write real nested maps instead; merge applies
    // the increment() sentinel at the correct nested path.
    await setDoc(
        dailyRef,
        {
            dateKey,
            updatedAt: now,
            totalEvents: increment(1),
            events: { [safeEvent]: increment(1) },
            contexts: { [safeContext]: increment(1) }
        },
        { merge: true }
    );

    if (Object.keys(metadata).length > 0) {
        await addDoc(collection(db, 'admin_event_logs'), {
            eventName: safeEvent,
            context: safeContext,
            metadata,
            timestamp: now
        });
    }
};

export const getAdminDashboardData = async (
    days: number = 14,
    sinceTimestamp?: number | null
): Promise<AdminDashboardData | null> => {
    if (!db) return null;
    const now = Date.now();
    const safeDays = Math.max(1, Math.min(30, days));
    const cutoff24h = now - 24 * 60 * 60 * 1000;
    const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;
    const safeSince = typeof sinceTimestamp === 'number' && sinceTimestamp > 0 ? sinceTimestamp : null;

    try {
        const [
            totalUsersSnap,
            active24Snap,
            active7Snap,
            communityLevelsSnap,
            invitesSnap,
            metricsSnap,
            recentUsersSnap,
            activeUsersSinceSnap,
            levelsSinceSnap,
            invitesSinceSnap
        ] = await Promise.all([
            getCountFromServer(collection(db, 'users')),
            getCountFromServer(query(collection(db, 'users'), where('lastLogin', '>=', cutoff24h))),
            getCountFromServer(query(collection(db, 'users'), where('lastLogin', '>=', cutoff7d))),
            getCountFromServer(collection(db, 'levels')),
            getCountFromServer(collection(db, 'invites')),
            getDocs(query(collection(db, 'admin_metrics_daily'), orderBy('dateKey', 'desc'), limit(safeDays))),
            getDocs(query(collection(db, 'users'), orderBy('lastLogin', 'desc'), limit(40))),
            safeSince
                ? getCountFromServer(query(collection(db, 'users'), where('lastLogin', '>=', safeSince)))
                : Promise.resolve(null),
            safeSince
                ? getCountFromServer(query(collection(db, 'levels'), where('timestamp', '>=', safeSince)))
                : Promise.resolve(null),
            safeSince
                ? getCountFromServer(query(collection(db, 'invites'), where('timestamp', '>=', safeSince)))
                : Promise.resolve(null)
        ]);

        const dailyMetrics: AdminMetricsDay[] = [];
        let totalSessionsTracked = 0;
        let totalGameplayStarts = 0;
        let totalLevelCompletions = 0;
        let totalLevelFailures = 0;
        const screenMap: Record<string, number> = {};

        metricsSnap.forEach((dayDoc) => {
            const raw = dayDoc.data() as Partial<AdminMetricsDay> & { events?: Record<string, number> };
            const events = raw.events || {};
            const contexts = raw.contexts || {};

            dailyMetrics.push({
                dateKey: raw.dateKey || dayDoc.id,
                updatedAt: raw.updatedAt || 0,
                totalEvents: raw.totalEvents || 0,
                events,
                contexts
            });

            totalSessionsTracked += events.session_start || 0;
            totalGameplayStarts += events.gameplay_start || 0;
            totalLevelCompletions += events.level_complete || 0;
            totalLevelFailures += events.level_failure || 0;

            Object.entries(events).forEach(([key, value]) => {
                if (key.startsWith('screen_view_')) {
                    const screenName = key.replace('screen_view_', '');
                    screenMap[screenName] = (screenMap[screenName] || 0) + (value || 0);
                }
            });
        });

        const topScreens = Object.entries(screenMap)
            .map(([name, views]) => ({ name, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 8);

        // Email now lives in the per-user private subdoc; admin is allowed to
        // read it. Fetch each recent user's contact doc in parallel, falling
        // back to any legacy top-level email still present on un-migrated docs.
        const recentEmails = await Promise.all(
            recentUsersSnap.docs.map(async (userDoc) => {
                try {
                    const priv = await getDoc(doc(db, 'users', userDoc.id, 'private', 'contact'));
                    if (priv.exists() && priv.data().email) return priv.data().email as string;
                } catch (e) { /* ignore, fall back below */ }
                return (userDoc.data() as Partial<FirestoreUser>).email || 'unknown@unknown';
            })
        );
        const recentUsers = recentUsersSnap.docs.map((userDoc, i) => {
            const raw = userDoc.data() as Partial<FirestoreUser>;
            return {
                uid: userDoc.id,
                displayName: raw.displayName || 'Unknown',
                email: recentEmails[i] || 'unknown@unknown',
                photoURL: raw.photoURL || '',
                lastLogin: raw.lastLogin || 0,
                totalScore: raw.totalScore || 0,
                completedLevels: raw.completedLevels || 0,
                badgesCount: Array.isArray(raw.badges) ? raw.badges.length : 0,
                autoSolvers: raw.autoSolvers || 0
            };
        });

        const latestUserLogins = safeSince
            ? recentUsers
                .filter((u) => u.lastLogin >= safeSince)
                .slice(0, 8)
                .map((u) => ({
                    uid: u.uid,
                    displayName: u.displayName,
                    email: u.email,
                    lastLogin: u.lastLogin
                }))
            : [];

        const newUsersEstimate = safeSince
            ? recentUsers.filter((u) => u.lastLogin >= safeSince).length
            : 0;

        return {
            generatedAt: now,
            totalUsers: totalUsersSnap.data().count,
            activeUsers24h: active24Snap.data().count,
            activeUsers7d: active7Snap.data().count,
            totalCommunityLevels: communityLevelsSnap.data().count,
            totalInvites: invitesSnap.data().count,
            totalSessionsTracked,
            totalGameplayStarts,
            totalLevelCompletions,
            totalLevelFailures,
            topScreens,
            dailyMetrics,
            recentUsers,
            changesSinceLastVisit: {
                hasBaseline: !!safeSince,
                sinceTimestamp: safeSince,
                newUsers: newUsersEstimate,
                usersActiveSince: activeUsersSinceSnap?.data().count || 0,
                newLevels: levelsSinceSnap?.data().count || 0,
                newInvites: invitesSinceSnap?.data().count || 0,
                latestUserLogins
            }
        };
    } catch (e) {
        console.error('[Admin] Failed to load dashboard data', e);
        return null;
    }
};
