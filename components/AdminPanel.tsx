import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminDashboardData, getAdminDashboardData } from '../firebase';
import { UserProfile } from '../types';
import { ICONS } from './icons';

const ADMIN_EMAIL = 'hayhamlt@gmail.com';

interface AdminPanelProps {
    user: UserProfile | null;
    onBack: () => void;
    onLogin: () => Promise<void>;
}

const RANGE_OPTIONS = [7, 14, 30] as const;
const ADMIN_LAST_SEEN_KEY = 'hj_admin_last_seen_v1';

const pct = (v: number) => `${Math.round(v)}%`;

const toTitle = (raw: string) =>
    raw
        .replace(/^screen_view_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());

const downloadTextFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const formatDateTime = (ts: number) => {
    if (!ts) return 'never';
    return new Date(ts).toLocaleString();
};

const StatCard: React.FC<{ label: string; value: string | number; hint?: string }> = ({ label, value, hint }) => (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="text-[10px] text-teal-200/70 font-black">{label}</div>
        <div className="mt-2 text-2xl font-black text-white">{value}</div>
        {hint && <div className="mt-1 text-[11px] text-white/55">{hint}</div>}
    </div>
);

const BigStatCard: React.FC<{ title: string; value: string; trend: string; color: string }> = ({ title, value, trend, color }) => (
    <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.22),rgba(2,6,23,0.82)_62%)] p-5 shadow-[0_20px_60px_rgba(8,47,73,0.45)]">
        <div className="text-[10px] text-white/60 font-black">{title}</div>
        <div className="mt-2 text-3xl font-black text-white">{value}</div>
        <div className={`mt-3 inline-flex items-center rounded-full px-2 py-1 text-[11px] font-black ${color}`}>{trend}</div>
    </div>
);

const RingGauge: React.FC<{ label: string; value: number; subLabel: string }> = ({ label, value, subLabel }) => {
    const safeValue = Math.max(0, Math.min(100, value));
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="text-xs text-white/60 font-black mb-4">{label}</div>
            <div className="flex items-center gap-4">
                <div
                    className="relative h-24 w-24 rounded-full"
                    style={{
                        background: `conic-gradient(rgb(20 184 166) ${safeValue * 3.6}deg, rgba(255,255,255,0.08) 0deg)`
                    }}
                >
                    <div className="absolute inset-[10px] rounded-full bg-slate-950/95 flex items-center justify-center text-xl font-black text-white">
                        {safeValue}%
                    </div>
                </div>
                <div>
                    <div className="text-sm text-white/90 font-bold">{subLabel}</div>
                    <div className="mt-1 text-xs text-white/55">Quality score across tracked outcomes</div>
                </div>
            </div>
        </div>
    );
};

const Sparkline: React.FC<{ values: number[]; days: number }> = ({ values, days }) => {
    const width = 420;
    const height = 120;
    const max = Math.max(1, ...values);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    const points = values
        .map((v, i) => {
            const x = (i / Math.max(1, values.length - 1)) * width;
            const y = height - ((v - min) / range) * height;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="text-xs text-white/60 font-black mb-3">Activity Trendline</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
                <defs>
                    <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="50%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                </defs>
                <polyline fill="none" stroke="url(#trendStroke)" strokeWidth="4" points={points} strokeLinecap="round" />
            </svg>
            <div className="mt-2 text-[11px] text-white/55">Shows total tracked events over the last {days} days.</div>
        </div>
    );
};

const MiniBarChart: React.FC<{ data: Array<{ label: string; value: number }>; days: number }> = ({ data, days }) => {
    const maxValue = useMemo(() => Math.max(1, ...data.map(d => d.value)), [data]);

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="text-xs text-white/60 font-black mb-3">Daily Activity ({days}d)</div>
            <div className="space-y-2">
                {data.map(item => (
                    <div key={item.label} className="grid grid-cols-[64px_1fr_56px] items-center gap-2">
                        <div className="text-[10px] text-white/60 font-bold">{item.label.slice(5)}</div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-teal-400 via-blue-400 to-emerald-300"
                                style={{ width: `${Math.max(6, Math.round((item.value / maxValue) * 100))}%` }}
                            />
                        </div>
                        <div className="text-right text-[11px] text-white/70 font-bold">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HorizontalBreakdown: React.FC<{
    title: string;
    rows: Array<{ label: string; value: number }>;
    total: number;
    color: string;
}> = ({ title, rows, total, color }) => (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
        <div className="text-xs text-white/60 font-black mb-3">{title}</div>
        <div className="space-y-2">
            {rows.length === 0 && <div className="text-sm text-white/60">No data yet.</div>}
            {rows.map((row) => {
                const ratio = total > 0 ? (row.value / total) * 100 : 0;
                return (
                    <div key={row.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white/80">{toTitle(row.label)}</span>
                            <span className="text-white/65 font-bold">{row.value.toLocaleString()} ({pct(ratio)})</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(5, ratio)}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

const ActivityHeatStrip: React.FC<{ data: Array<{ label: string; value: number }> }> = ({ data }) => {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="text-xs text-white/60 font-black mb-3">Activity Heat Strip</div>
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2">
                {data.map((day) => {
                    const ratio = day.value / max;
                    const alpha = Math.max(0.12, ratio * 0.95);
                    return (
                        <div key={day.label} className="space-y-1">
                            <div
                                title={`${day.label}: ${day.value.toLocaleString()} events`}
                                className="h-8 rounded-md border border-white/10"
                                style={{ backgroundColor: `rgba(20, 184, 166, ${alpha})` }}
                            />
                            <div className="text-[9px] text-white/45 text-center">{day.label.slice(8)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ScreenMix: React.FC<{ rows: Array<{ name: string; views: number }> }> = ({ rows }) => {
    const total = rows.reduce((sum, row) => sum + row.views, 0);
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
            <div className="text-xs text-white/60 font-black mb-3">Screen Mix</div>
            <div className="space-y-2">
                {rows.length === 0 && <div className="text-sm text-white/60">No screen data yet.</div>}
                {rows.map((screen) => {
                    const share = total > 0 ? (screen.views / total) * 100 : 0;
                    return (
                        <div key={screen.name}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-white/80">{toTitle(screen.name)}</span>
                                <span className="text-white/65 font-bold">{pct(share)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-teal-300 to-emerald-300" style={{ width: `${Math.max(5, share)}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onBack, onLogin }) => {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [windowDays, setWindowDays] = useState<number>(14);
    const [exportingPng, setExportingPng] = useState(false);
    const [exportingCsv, setExportingCsv] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [lastSeenAt] = useState<number | null>(() => {
        if (typeof window === 'undefined') return null;
        const raw = window.localStorage.getItem(ADMIN_LAST_SEEN_KEY);
        const parsed = raw ? Number(raw) : 0;
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    });
    const [didStoreSeen, setDidStoreSeen] = useState(false);
    const dashboardRef = useRef<HTMLDivElement | null>(null);

    const isAdmin = (user?.email || '').toLowerCase() === ADMIN_EMAIL;

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const dashboardData = await getAdminDashboardData(windowDays, lastSeenAt);
            if (!dashboardData) {
                setError('Could not load dashboard data.');
                setData(null);
            } else {
                setData(dashboardData);
                if (!didStoreSeen && typeof window !== 'undefined') {
                    window.localStorage.setItem(ADMIN_LAST_SEEN_KEY, String(Date.now()));
                    setDidStoreSeen(true);
                }
            }
        } catch (e: any) {
            setError(e?.message || 'Failed to load admin analytics.');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [windowDays, lastSeenAt, didStoreSeen]);

    useEffect(() => {
        if (!isAdmin) return;
        loadData();
        const timer = window.setInterval(loadData, 30000);
        return () => window.clearInterval(timer);
    }, [isAdmin, loadData]);

    const analytics = useMemo(() => {
        if (!data) return null;

        const orderedDays = data.dailyMetrics.slice().reverse();
        const trendValues = orderedDays.map((day) => day.totalEvents || 0);
        const totalEvents = trendValues.reduce((sum, value) => sum + value, 0);

        const outcomes = data.totalLevelCompletions + data.totalLevelFailures;
        const successRate = outcomes > 0 ? Math.round((data.totalLevelCompletions / outcomes) * 100) : 0;
        const failRate = outcomes > 0 ? Math.round((data.totalLevelFailures / outcomes) * 100) : 0;
        const startRate = data.totalSessionsTracked > 0 ? Math.round((data.totalGameplayStarts / data.totalSessionsTracked) * 100) : 0;
        const completionFromStart = data.totalGameplayStarts > 0 ? Math.round((data.totalLevelCompletions / data.totalGameplayStarts) * 100) : 0;
        const stickiness = data.activeUsers7d > 0 ? Math.round((data.activeUsers24h / data.activeUsers7d) * 100) : 0;

        const eventTotals: Record<string, number> = {};
        const contextTotals: Record<string, number> = {};
        orderedDays.forEach((day) => {
            Object.entries(day.events || {}).forEach(([k, v]) => {
                eventTotals[k] = (eventTotals[k] || 0) + (v || 0);
            });
            Object.entries(day.contexts || {}).forEach(([k, v]) => {
                contextTotals[k] = (contextTotals[k] || 0) + (v || 0);
            });
        });

        const topEvents = Object.entries(eventTotals)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        const topContexts = Object.entries(contextTotals)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Money / learning / retention funnel totals — derived from the same
        // per-day events map the dashboard already aggregates. New events show up
        // here automatically; these named pulls just give them dedicated tiles.
        const ev = (name: string) => eventTotals[name] || 0;
        const moneyLearning = {
            lessonsCompleted: ev('lesson_complete'),
            coinsEvents: ev('coins_earned'),
            shopPurchases: ev('shop_purchase'),
            purchasesBlocked: ev('purchase_blocked'),
            dailyStarts: ev('daily_start'),
            dailyCompletes: ev('daily_complete'),
            streaksBroken: ev('daily_streak_broken'),
            coopMatches: ev('coop_match_started'),
            tournamentsComplete: ev('tournament_complete'),
            levelsPublished: ev('level_published'),
            signInAttempts: ev('sign_in_attempt')
        };
        const dailyCompletionRate = moneyLearning.dailyStarts > 0
            ? Math.round((moneyLearning.dailyCompletes / moneyLearning.dailyStarts) * 100)
            : 0;

        const peakDay = orderedDays.reduce(
            (best, day) => ((day.totalEvents || 0) > (best.totalEvents || 0) ? day : best),
            orderedDays[0] || { dateKey: 'n/a', totalEvents: 0 }
        );

        const compareWindow = Math.max(1, Math.floor(windowDays / 2));
        const currentWindow = trendValues.slice(-compareWindow);
        const previousWindow = trendValues.slice(-(compareWindow * 2), -compareWindow);
        const currentAvg = currentWindow.length ? currentWindow.reduce((s, n) => s + n, 0) / currentWindow.length : 0;
        const previousAvg = previousWindow.length ? previousWindow.reduce((s, n) => s + n, 0) / previousWindow.length : 0;
        const momentum = previousAvg > 0 ? Math.round(((currentAvg - previousAvg) / previousAvg) * 100) : (currentAvg > 0 ? 100 : 0);

        const anomalyAlerts: Array<{ level: 'critical' | 'warning' | 'info'; title: string; detail: string }> = [];
        if (trendValues.length > 3) {
            const avg = trendValues.reduce((s, n) => s + n, 0) / trendValues.length;
            const variance = trendValues.reduce((s, n) => s + (n - avg) ** 2, 0) / trendValues.length;
            const stdDev = Math.sqrt(variance);
            const latest = trendValues[trendValues.length - 1] || 0;

            if (stdDev > 0 && latest >= avg + stdDev * 2) {
                anomalyAlerts.push({
                    level: 'warning',
                    title: 'Traffic Spike',
                    detail: `Latest daily volume is ${Math.round(((latest - avg) / Math.max(1, avg)) * 100)}% above baseline.`
                });
            }

            if (stdDev > 0 && latest <= Math.max(0, avg - stdDev * 2)) {
                anomalyAlerts.push({
                    level: 'critical',
                    title: 'Traffic Drop',
                    detail: 'Latest daily volume dropped well below normal variance.'
                });
            }
        }

        if (completionFromStart < 45 && data.totalGameplayStarts > 40) {
            anomalyAlerts.push({
                level: 'critical',
                title: 'Completion Conversion Risk',
                detail: `Play-to-complete conversion is ${completionFromStart}% (watch for level friction).`
            });
        }

        if (failRate > 55 && outcomes > 20) {
            anomalyAlerts.push({
                level: 'warning',
                title: 'Failure Share High',
                detail: `${failRate}% of outcomes are failures in this window.`
            });
        }

        if (stickiness < 20 && data.activeUsers7d > 0) {
            anomalyAlerts.push({
                level: 'info',
                title: 'Stickiness Soft',
                detail: `DAU/WAU is ${stickiness}%, consider returning-user nudges.`
            });
        }

        if (anomalyAlerts.length === 0) {
            anomalyAlerts.push({
                level: 'info',
                title: 'System Stable',
                detail: 'No major anomalies detected in the selected date range.'
            });
        }

        return {
            orderedDays,
            trendValues,
            totalEvents,
            outcomes,
            successRate,
            failRate,
            startRate,
            completionFromStart,
            stickiness,
            topEvents,
            topContexts,
            peakDay,
            currentAvg,
            compareWindow,
            momentum,
            anomalyAlerts,
            moneyLearning,
            dailyCompletionRate
        };
    }, [data, windowDays]);

    const filteredUsers = useMemo(() => {
        if (!data) return [];
        const q = userSearch.trim().toLowerCase();
        if (!q) return data.recentUsers;
        return data.recentUsers.filter((u) =>
            u.displayName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.uid.toLowerCase().includes(q)
        );
    }, [data, userSearch]);

    const handleExportCsv = useCallback(() => {
        if (!data || !analytics) return;
        setExportingCsv(true);
        try {
            const lines: string[] = [];
            lines.push('section,metric,value');
            lines.push(`overview,window_days,${windowDays}`);
            lines.push(`overview,total_users,${data.totalUsers}`);
            lines.push(`overview,active_users_24h,${data.activeUsers24h}`);
            lines.push(`overview,active_users_7d,${data.activeUsers7d}`);
            lines.push(`overview,total_sessions,${data.totalSessionsTracked}`);
            lines.push(`overview,total_gameplay_starts,${data.totalGameplayStarts}`);
            lines.push(`overview,total_level_completions,${data.totalLevelCompletions}`);
            lines.push(`overview,total_level_failures,${data.totalLevelFailures}`);
            lines.push(`overview,success_rate_pct,${analytics.successRate}`);
            lines.push(`overview,fail_rate_pct,${analytics.failRate}`);
            lines.push('daily,date,total_events');
            analytics.orderedDays.forEach((day) => {
                lines.push(`daily,${day.dateKey},${day.totalEvents || 0}`);
            });
            lines.push('top_event,name,count');
            analytics.topEvents.forEach((row) => {
                lines.push(`top_event,${row.label},${row.value}`);
            });
            lines.push('top_context,name,count');
            analytics.topContexts.forEach((row) => {
                lines.push(`top_context,${row.label},${row.value}`);
            });

            downloadTextFile(`admin-analytics-${windowDays}d.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
        } finally {
            setExportingCsv(false);
        }
    }, [data, analytics, windowDays]);

    const handleExportPng = useCallback(async () => {
        if (!dashboardRef.current) return;
        setExportingPng(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(dashboardRef.current, {
                backgroundColor: '#020617',
                scale: 2,
                useCORS: true
            });
            const imageUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `admin-analytics-${windowDays}d.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error('Failed to export PNG:', e);
        } finally {
            setExportingPng(false);
        }
    }, [windowDays]);

    if (!user) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center backdrop-blur-xl">
                    <div className="mx-auto mb-3 text-teal-300 w-10"><ICONS.CPU /></div>
                    <h2 className="text-2xl font-black text-white">Admin Control Room</h2>
                    <p className="mt-2 text-sm text-white/70">Sign in with Google to access game analytics.</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button onClick={onBack} className="px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:bg-white/5">Back</button>
                        <button onClick={onLogin} className="px-5 py-2 rounded-xl bg-teal-400 text-slate-900 font-black hover:bg-teal-300">Sign In With Google</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-3xl border border-rose-300/25 bg-rose-950/40 p-8 text-center backdrop-blur-xl">
                    <div className="mx-auto mb-3 text-rose-300 w-10"><ICONS.Lock /></div>
                    <h2 className="text-2xl font-black text-white">Access Restricted</h2>
                    <p className="mt-2 text-sm text-white/75">
                        This panel is currently restricted to {ADMIN_EMAIL}. You are signed in as {user.email || 'unknown'}.
                    </p>
                    <button onClick={onBack} className="mt-6 px-5 py-2 rounded-xl border border-white/20 text-white/90 hover:bg-white/5">Back To Game</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto no-scrollbar p-4 sm:p-6 md:p-8">
            <div ref={dashboardRef} className="max-w-7xl mx-auto space-y-5">
                <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.85),rgba(12,74,110,0.35),rgba(2,132,199,0.18))] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-[10px] text-teal-200/75 font-black">Henry's Journey</div>
                            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white">Admin Intelligence Deck</h1>
                            <p className="mt-2 text-xs sm:text-sm text-white/70">Live telemetry, growth indicators, gameplay funnel, and behavioral pulse over the selected range.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                            <div className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 p-1 gap-1">
                                {RANGE_OPTIONS.map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => setWindowDays(days)}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition ${windowDays === days ? 'bg-teal-300 text-slate-950' : 'text-white/75 hover:bg-white/10'}`}
                                    >
                                        {days}d
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleExportCsv}
                                disabled={exportingCsv || loading || !data}
                                className="px-3 py-2 rounded-xl border border-white/20 text-white/85 text-xs font-black hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exportingCsv ? 'CSV...' : 'Export CSV'}
                            </button>
                            <button
                                onClick={handleExportPng}
                                disabled={exportingPng || loading || !data}
                                className="px-3 py-2 rounded-xl border border-white/20 text-white/85 text-xs font-black hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exportingPng ? 'PNG...' : 'Export PNG'}
                            </button>
                            <button onClick={loadData} className="px-3 py-2 rounded-xl border border-white/20 text-white/85 text-xs font-black hover:bg-white/5">Refresh</button>
                            <button onClick={onBack} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-black hover:bg-white/20">Exit</button>
                        </div>
                    </div>
                </div>

                {loading && <div className="text-white/70 text-sm">Loading analytics...</div>}
                {error && <div className="rounded-xl border border-rose-300/20 bg-rose-900/20 px-4 py-3 text-rose-200 text-sm">{error}</div>}

                {!loading && data && analytics && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <BigStatCard
                                title="Momentum"
                                value={`${analytics.momentum >= 0 ? '+' : ''}${analytics.momentum}%`}
                                trend={`${analytics.compareWindow}d vs previous ${analytics.compareWindow}d`}
                                color={analytics.momentum >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/20 text-rose-200'}
                            />
                            <BigStatCard
                                title="Peak Activity Day"
                                value={analytics.peakDay.dateKey || 'n/a'}
                                trend={`${(analytics.peakDay.totalEvents || 0).toLocaleString()} events`}
                                color="bg-teal-400/20 text-teal-200"
                            />
                            <BigStatCard
                                title="Signal Volume"
                                value={analytics.totalEvents.toLocaleString()}
                                trend={`Avg ${Math.round(analytics.currentAvg).toLocaleString()} / day (${analytics.compareWindow}d)`}
                                color="bg-sky-400/20 text-sky-200"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard label="Total Users" value={data.totalUsers.toLocaleString()} />
                            <StatCard label="Active 24h" value={data.activeUsers24h.toLocaleString()} />
                            <StatCard label="Active 7d" value={data.activeUsers7d.toLocaleString()} />
                            <StatCard label={`Sessions (${windowDays}d)`} value={data.totalSessionsTracked.toLocaleString()} hint="Tracked app opens" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard label="Community Levels" value={data.totalCommunityLevels.toLocaleString()} />
                            <StatCard label="Invites Sent" value={data.totalInvites.toLocaleString()} />
                            <StatCard label="Level Starts" value={data.totalGameplayStarts.toLocaleString()} />
                            <StatCard label="Win Rate" value={`${analytics.successRate}%`} hint="Completions / outcomes" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard label="Session->Play" value={pct(analytics.startRate)} hint="Sessions that reach gameplay" />
                            <StatCard label="Play->Complete" value={pct(analytics.completionFromStart)} hint="Completions from starts" />
                            <StatCard label="Failure Share" value={pct(analytics.failRate)} hint="Failed outcomes" />
                            <StatCard label="Stickiness" value={pct(analytics.stickiness)} hint="DAU/WAU ratio" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <StatCard label="Lessons Completed" value={analytics.moneyLearning.lessonsCompleted.toLocaleString()} hint={`${windowDays}d finlit clears`} />
                            <StatCard label="Daily Completion" value={pct(analytics.dailyCompletionRate)} hint={`${analytics.moneyLearning.dailyCompletes}/${analytics.moneyLearning.dailyStarts} runs`} />
                            <StatCard label="Streaks Broken" value={analytics.moneyLearning.streaksBroken.toLocaleString()} hint="Daily retention churn" />
                            <StatCard label="Shop Purchases" value={analytics.moneyLearning.shopPurchases.toLocaleString()} hint={`${analytics.moneyLearning.purchasesBlocked} blocked (no coins)`} />
                            <StatCard label="Coop Matches" value={analytics.moneyLearning.coopMatches.toLocaleString()} hint="Live 2-player starts" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <MiniBarChart
                                data={analytics.orderedDays
                                    .map(day => ({
                                        label: day.dateKey,
                                        value: day.totalEvents || 0
                                    }))}
                                days={windowDays}
                            />

                            <Sparkline values={analytics.trendValues} days={windowDays} />

                            <RingGauge
                                label="Outcome Quality"
                                value={analytics.successRate}
                                subLabel={`${data.totalLevelCompletions.toLocaleString()} clears vs ${data.totalLevelFailures.toLocaleString()} failures`}
                            />
                        </div>

                        <ActivityHeatStrip
                            data={analytics.orderedDays.map((day) => ({ label: day.dateKey, value: day.totalEvents || 0 }))}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                <div className="text-xs text-white/60 font-black mb-4">Gameplay Funnel</div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Sessions', value: data.totalSessionsTracked, color: 'bg-teal-400' },
                                        { label: 'Gameplay Starts', value: data.totalGameplayStarts, color: 'bg-sky-400' },
                                        { label: 'Completions', value: data.totalLevelCompletions, color: 'bg-emerald-400' }
                                    ].map((stage, idx, arr) => {
                                        const base = Math.max(1, arr[0].value);
                                        const w = Math.max(8, (stage.value / base) * 100);
                                        const prev = idx > 0 ? arr[idx - 1].value : stage.value;
                                        const conversion = prev > 0 ? Math.round((stage.value / prev) * 100) : 0;
                                        return (
                                            <div key={stage.label}>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-white/85 font-bold">{stage.label}</span>
                                                    <span className="text-white/65">{stage.value.toLocaleString()} {idx === 0 ? '' : `(${conversion}% from previous)`}</span>
                                                </div>
                                                <div className="h-8 rounded-lg bg-white/10 overflow-hidden">
                                                    <div className={`h-full ${stage.color} bg-gradient-to-r from-white/20 to-transparent`} style={{ width: `${w}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                <div className="text-xs text-white/60 font-black mb-3">Top Screens</div>
                                <div className="space-y-2">
                                    {data.topScreens.length === 0 && <div className="text-sm text-white/60">No screen view data yet.</div>}
                                    {data.topScreens.map(screen => (
                                        <div key={screen.name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                                            <div className="text-sm text-white/85">{screen.name.replace(/_/g, ' ')}</div>
                                            <div className="text-sm font-black text-teal-300">{screen.views.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <ScreenMix rows={data.topScreens.slice(0, 8)} />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            <HorizontalBreakdown
                                title="Top Events"
                                rows={analytics.topEvents}
                                total={analytics.totalEvents}
                                color="bg-gradient-to-r from-teal-400 to-sky-300"
                            />
                            <HorizontalBreakdown
                                title="Context Hotspots"
                                rows={analytics.topContexts}
                                total={analytics.totalEvents}
                                color="bg-gradient-to-r from-emerald-400 to-teal-300"
                            />
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(120deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88),rgba(3,105,161,0.2))] p-5">
                            <div className="text-xs text-teal-200/70 font-black mb-3">Ops Brief</div>
                            <div className="grid grid-cols-1 gap-2 mb-3">
                                {analytics.anomalyAlerts.map((alert, index) => (
                                    <div
                                        key={`${alert.title}-${index}`}
                                        className={`rounded-xl border px-3 py-2 text-sm ${
                                            alert.level === 'critical'
                                                ? 'border-rose-300/30 bg-rose-500/15 text-rose-100'
                                                : alert.level === 'warning'
                                                    ? 'border-amber-300/30 bg-amber-500/15 text-amber-100'
                                                    : 'border-teal-300/30 bg-teal-500/15 text-teal-100'
                                        }`}
                                    >
                                        <div className="font-black text-[11px]">{alert.title}</div>
                                        <div className="mt-1 text-white/90">{alert.detail}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-white/80">
                                    <div className="text-white font-black">Acquisition Pulse</div>
                                    <div className="mt-1">{data.activeUsers24h.toLocaleString()} active in 24h from {data.totalUsers.toLocaleString()} total users.</div>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-white/80">
                                    <div className="text-white font-black">Engagement Pulse</div>
                                    <div className="mt-1">{data.totalGameplayStarts.toLocaleString()} starts, with {pct(analytics.completionFromStart)} resolving to completion.</div>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-white/80">
                                    <div className="text-white font-black">Social Pulse</div>
                                    <div className="mt-1">{data.totalInvites.toLocaleString()} invites and {data.totalCommunityLevels.toLocaleString()} published community levels.</div>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3 border border-white/10 text-white/80">
                                    <div className="text-white font-black">Risk Watch</div>
                                    <div className="mt-1">Failure share is {pct(analytics.failRate)} across {analytics.outcomes.toLocaleString()} tracked outcomes.</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-teal-300/20 bg-[linear-gradient(130deg,rgba(6,24,34,0.92),rgba(7,31,48,0.9),rgba(14,116,144,0.22))] p-5">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                                <div>
                                    <div className="text-xs text-teal-200/70 font-black">Since Last Admin Login</div>
                                    <div className="text-sm text-white/75 mt-1">
                                        {data.changesSinceLastVisit.hasBaseline
                                            ? `Tracking changes since ${formatDateTime(data.changesSinceLastVisit.sinceTimestamp || 0)}`
                                            : 'No previous admin login baseline yet. Changes will appear after your next login.'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <StatCard label="Users Active" value={data.changesSinceLastVisit.usersActiveSince.toLocaleString()} hint="Logged in since your last admin visit" />
                                <StatCard label="Fresh User Signals" value={data.changesSinceLastVisit.newUsers.toLocaleString()} hint="Recent logins from the latest user cohort" />
                                <StatCard label="New Community Levels" value={data.changesSinceLastVisit.newLevels.toLocaleString()} hint="Created since your last visit" />
                                <StatCard label="New Invites" value={data.changesSinceLastVisit.newInvites.toLocaleString()} hint="Social activity delta" />
                            </div>

                            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                <div className="text-xs text-white/60 font-black mb-2">Latest User Logins Since Last Visit</div>
                                <div className="space-y-2">
                                    {data.changesSinceLastVisit.latestUserLogins.length === 0 && (
                                        <div className="text-sm text-white/60">No user changes detected in this period.</div>
                                    )}
                                    {data.changesSinceLastVisit.latestUserLogins.map((u) => (
                                        <div key={u.uid} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-bold text-white/90">{u.displayName}</div>
                                                <div className="text-xs text-white/55">{u.email}</div>
                                            </div>
                                            <div className="text-xs text-teal-200/80">{formatDateTime(u.lastLogin)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                                <div>
                                    <div className="text-xs text-white/60 font-black">Specific Users</div>
                                    <div className="text-sm text-white/70 mt-1">Search by name, email, or uid and inspect progress + behavior signals.</div>
                                </div>
                                <input
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="w-full md:w-80 rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-teal-300/60"
                                />
                            </div>

                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {filteredUsers.length === 0 && <div className="text-sm text-white/60">No users match this search.</div>}
                                {filteredUsers.map((u) => (
                                    <div key={u.uid} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <div>
                                                <div className="text-sm font-black text-white">{u.displayName}</div>
                                                <div className="text-xs text-white/55">{u.email}</div>
                                                <div className="text-[10px] text-white/35 mt-1">uid: {u.uid}</div>
                                            </div>
                                            <div className="text-xs text-teal-200/80">Last login: {formatDateTime(u.lastLogin)}</div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                                            <div className="rounded-lg bg-slate-900/60 px-2 py-1 border border-white/10 text-white/80">Score: {u.totalScore.toLocaleString()}</div>
                                            <div className="rounded-lg bg-slate-900/60 px-2 py-1 border border-white/10 text-white/80">Completed: {u.completedLevels}</div>
                                            <div className="rounded-lg bg-slate-900/60 px-2 py-1 border border-white/10 text-white/80">Badges: {u.badgesCount}</div>
                                            <div className="rounded-lg bg-slate-900/60 px-2 py-1 border border-white/10 text-white/80">Auto Solvers: {u.autoSolvers}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
