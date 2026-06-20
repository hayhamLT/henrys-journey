
import React, { useState, useEffect, useRef } from 'react';

type LogType = 'log' | 'warn' | 'error' | 'system';

interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: string;
}

export const DebugConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hasUnreadError, setHasUnreadError] = useState(false);
  const [hasUnreadWarn, setHasUnreadWarn] = useState(false);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  const addLogToState = (type: LogType, message: string) => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const timestamp = `${h}:${m}:${s}.${ms}`;

      setLogs(prev => {
          const newLogs = [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              type,
              message,
              timestamp
          }];
          if (newLogs.length > 200) return newLogs.slice(-200);
          return newLogs;
      });

      if (type === 'error') setHasUnreadError(true);
      if (type === 'warn') setHasUnreadWarn(true);
  };

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    // --- 1. Intercept Console Methods ---
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const formatArg = (arg: any): string => {
        try {
            if (arg === undefined) return 'undefined';
            if (arg === null) return 'null';
            if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
            if (typeof arg === 'object') {
                // Avoid circular dependency issues in simple JSON stringify
                try {
                    return JSON.stringify(arg, null, 2);
                } catch(e) {
                    return '[Circular/Complex Object]';
                }
            }
            return String(arg);
        } catch (e) {
            return String(arg);
        }
    };

    const isIgnoredMessage = (msg: string) => {
        return (
            msg.includes('RunAggregationQuery') ||
            msg.includes('RPC') || 
            msg.includes('RestConnection') || 
            msg.includes('@firebase/firestore') ||
            (msg.includes('Warning') && msg.includes('firebase'))
        );
    };

    console.log = (...args) => {
        const message = args.map(formatArg).join(' ');
        // Don't duplicate system logs if we call console.log inside addLogToState logic (unlikely but safe)
        if (!message.startsWith('[SYSTEM]')) {
            addLogToState('log', message);
        }
        originalLog.apply(console, args);
    };

    console.warn = (...args) => {
        const message = args.map(formatArg).join(' ');
        if (isIgnoredMessage(message)) {
             console.debug('[Suppressed Warning]', message); 
        } else {
             addLogToState('warn', message);
             originalWarn.apply(console, args);
        }
    };

    console.error = (...args) => {
        const msg = args.map(formatArg).join(' ');
        // Don't ignore ANY errors for now to ensure we catch login issues
        addLogToState('error', msg);
        originalError.apply(console, args);
    };

    // --- 2. Global Window Error Handlers ---
    const handleError = (event: ErrorEvent) => {
        addLogToState('error', `[Global Error] ${event.message} at ${event.filename}:${event.lineno}`);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
        addLogToState('error', `[Unhandled Rejection] ${formatArg(event.reason)}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Initial System Info
    addLogToState('system', `App Initialized. Env: ${process.env.NODE_ENV || 'dev'}`);
    addLogToState('system', `User Agent: ${navigator.userAgent}`);
    addLogToState('system', `Window Origin: ${window.location.origin}`);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
        setHasUnreadError(false);
        setHasUnreadWarn(false);
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }
  }, [logs, isOpen]);

  // Expose to window for manual opening if UI fails
  useEffect(() => {
      (window as any).openDebugConsole = () => setIsOpen(true);
  }, []);

  return (
    <>
        {!isOpen && (
            <button 
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-2 left-2 z-[10000] text-[9px] px-3 py-1 rounded-full font-black border transition-all font-mono tracking-wide flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 opacity-50 hover:opacity-100
                    ${hasUnreadError 
                        ? 'bg-red-600 text-white animate-pulse border-red-400 shadow-red-500/50 opacity-100' 
                        : hasUnreadWarn
                            ? 'bg-yellow-500 text-black border-yellow-400 opacity-100'
                            : 'bg-black/80 text-white/50 border-white/10 hover:text-white hover:bg-black hover:border-white/40'
                    }`}
                title="Open Debug Console"
            >
                {hasUnreadError ? '!' : (hasUnreadWarn ? '!' : '>_')}
            </button>
        )}
        
        {isOpen && (
            <div className="fixed inset-x-0 bottom-0 h-[33vh] bg-[#0d1117]/95 border-t border-[#30363d] shadow-[0_-5px_30px_rgba(0,0,0,0.8)] z-[10000] flex flex-col font-mono text-xs text-[#c9d1d9] animate-in slide-in-from-bottom duration-200 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="font-black text-[#58a6ff] text-sm tracking-wide">SYSTEM CONSOLE</span>
                        <div className="h-4 w-px bg-white/10"></div>
                        <span className="text-[10px] text-white/40">{logs.length} events recorded</span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setLogs([])} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/70 transition-colors font-bold">CLEAR</button>
                        <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-[10px] font-bold transition-colors">CLOSE</button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-3 space-y-1 scroll-smooth font-mono select-text bg-[#0d1117]">
                    {logs.map(log => (
                        <div key={log.id} className="flex gap-3 break-all hover:bg-white/5 p-1.5 rounded leading-relaxed items-start transition-colors border-b border-white/5 last:border-0">
                            <span className="text-[#8b949e] shrink-0 select-none opacity-50 text-[10px] mt-0.5 w-16 text-right font-mono">{log.timestamp}</span>
                            <span className={`shrink-0 font-bold w-14 text-center text-[9px] py-0.5 rounded select-none tracking-wide ${
                                log.type === 'error' ? 'bg-red-900/40 text-[#ff7b72] border border-red-900/50' : 
                                log.type === 'warn' ? 'bg-yellow-900/40 text-[#d29922] border border-yellow-900/50' : 
                                log.type === 'system' ? 'bg-purple-900/40 text-[#d2a8ff] border border-purple-900/50' :
                                'bg-blue-900/20 text-[#79c0ff] border border-blue-900/30'
                            }`}>
                                {log.type}
                            </span>
                            <span className={`whitespace-pre-wrap flex-grow select-text cursor-text font-medium ${
                                log.type === 'error' ? 'text-[#ff7b72]' : 
                                log.type === 'warn' ? 'text-[#e3b341]' : 
                                log.type === 'system' ? 'text-[#d2a8ff]' :
                                'text-[#e6edf3]'
                            }`}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        )}
    </>
  );
};
