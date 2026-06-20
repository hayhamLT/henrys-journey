import React from 'react';

interface Props {
  children: React.ReactNode;
  /** Optional label for logs/telemetry, e.g. "root" or "gameplay". */
  label?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  showDetails: boolean;
}

/**
 * Catches render-time crashes anywhere in its subtree and shows a friendly,
 * kid-safe "tap to refresh" screen instead of React's blank white page.
 *
 * Deliberately uses INLINE styles (no Tailwind/CSS classes) so the fallback
 * still renders even if the stylesheet or the Tailwind runtime failed to load —
 * which is exactly the kind of failure a boundary needs to survive.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // The boundary must never throw — wrap all reporting defensively.
    try {
      // eslint-disable-next-line no-console
      console.error(`[ErrorBoundary${this.props.label ? ':' + this.props.label : ''}]`, error, info?.componentStack);
      const w = window as unknown as { __hjReportError?: (e: Error, i: React.ErrorInfo, label?: string) => void };
      if (typeof w.__hjReportError === 'function') w.__hjReportError(error, info, this.props.label);
    } catch {
      /* swallow — reporting must not break the fallback */
    }
  }

  private handleReload = () => {
    try { window.location.reload(); } catch { /* ignore */ }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '16px', padding: '24px', textAlign: 'center',
          background: 'linear-gradient(160deg, #0f172a 0%, #020617 100%)',
          color: '#f8fafc', fontFamily: "'Fredoka', 'Nunito', system-ui, -apple-system, sans-serif",
          // honor reduced motion implicitly (no animations here)
        }}
      >
        <div style={{ fontSize: '60px', lineHeight: 1 }} aria-hidden="true">🤖💫</div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Oops! Henry tripped.</h1>
        <p style={{ fontSize: '15px', color: 'rgba(248,250,252,0.7)', maxWidth: '320px', margin: 0, lineHeight: 1.5 }}>
          Something hiccuped — but don&apos;t worry, your coins and progress are safe. Let&apos;s hop back in!
        </p>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: '6px', padding: '14px 30px', fontSize: '17px', fontWeight: 800,
            color: '#052e1a', background: 'linear-gradient(160deg, #4ade80, #10b981)',
            border: 'none', borderRadius: '16px', cursor: 'pointer',
            boxShadow: '0 4px 0 #047857, 0 6px 20px rgba(16,185,129,0.4)',
            fontFamily: 'inherit',
          }}
        >
          ↻ Tap to refresh
        </button>

        {this.state.error && (
          <button
            onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
            style={{
              marginTop: '8px', background: 'none', border: 'none',
              color: 'rgba(248,250,252,0.35)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {this.state.showDetails ? 'hide details' : 'show details'}
          </button>
        )}
        {this.state.showDetails && this.state.error && (
          <pre
            style={{
              maxWidth: '90vw', maxHeight: '30vh', overflow: 'auto', textAlign: 'left',
              fontSize: '11px', color: '#fca5a5', background: 'rgba(0,0,0,0.4)',
              padding: '12px', borderRadius: '10px', whiteSpace: 'pre-wrap',
            }}
          >
            {String(this.state.error?.stack || this.state.error?.message)}
          </pre>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;
