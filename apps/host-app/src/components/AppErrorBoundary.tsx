import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Logger } from '../lib/logger';

export class AppErrorBoundary extends Component<
  { logger: Logger; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.logger.error('app.crashed', { error, componentStack: info.componentStack });
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main
        role="alert"
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          maxWidth: 560,
          margin: '10vh auto',
        }}
      >
        <h1 style={{ fontSize: 20 }}>Something went wrong / حدث خطأ ما</h1>
        <p>Please reload the page. / يرجى إعادة تحميل الصفحة.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ padding: '8px 16px' }}
        >
          Reload / إعادة التحميل
        </button>
      </main>
    );
  }
}
