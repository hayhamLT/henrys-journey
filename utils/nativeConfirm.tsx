// Native-looking Promise-based confirm() replacement.
// Renders a portal-mounted modal styled to match the game's design system so
// it doesn't feel like a browser dialog.
//
// Usage:
//   const ok = await confirmDialog({
//     title: "Delete account?",
//     message: "This can't be undone.",
//     confirmLabel: "Delete",
//     destructive: true,
//   });
//   if (ok) { /* proceed */ }

import React from 'react';
import ReactDOM from 'react-dom/client';
import { haptic } from './nativeBridge';

export interface ConfirmOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
}

export const confirmDialog = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
        const host = document.createElement('div');
        host.style.position = 'fixed';
        host.style.inset = '0';
        host.style.zIndex = '9999';
        document.body.appendChild(host);
        const root = ReactDOM.createRoot(host);

        const cleanup = (result: boolean) => {
            root.unmount();
            host.remove();
            resolve(result);
        };

        root.render(
            <ConfirmModal
                {...opts}
                onConfirm={() => { haptic('purchase'); cleanup(true); }}
                onCancel={() => { haptic('select'); cleanup(false); }}
            />
        );
    });
};

const ConfirmModal: React.FC<ConfirmOptions & { onConfirm: () => void; onCancel: () => void; }> = ({
    title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive, onConfirm, onCancel
}) => {
    const confirmClass = destructive
        ? 'bg-red-500 hover:bg-red-600 text-white'
        : 'bg-emerald-500 hover:bg-emerald-600 text-white';

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hj-confirm-title"
        >
            <div
                className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="hj-confirm-title" className="text-white text-lg font-bold mb-2">{title}</h2>
                {message && <p className="text-slate-300 text-sm mb-6 leading-relaxed">{message}</p>}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3.5 px-4 rounded-2xl font-semibold text-sm transition ${confirmClass}`}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

/** Promise-based alert() equivalent — dismissible native-looking notice. */
export const alertDialog = (title: string, message?: string): Promise<void> =>
    confirmDialog({ title, message, confirmLabel: 'OK', cancelLabel: '' }).then(() => undefined);
