import { Component } from 'react';

/** Catches any render error so the visitor never sees a blank white page; offers a one-tap recovery. */
export default class ErrorBoundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('[mfr] recovered from', err, info?.componentStack); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: null }); }
  render() {
    if (!this.state.err) return this.props.children;
    const { title, sub, retry, home } = this.props.labels;
    return (
      <div className="crash" role="alert">
        <div className="crash-card">
          <span className="crash-ico" aria-hidden="true">🛠️</span>
          <h2>{title}</h2>
          <p className="muted">{sub}</p>
          <div className="crash-actions">
            <button type="button" className="btn" onClick={() => this.setState({ err: null })}>{retry}</button>
            <button type="button" className="btn btn-ghost" onClick={() => { this.setState({ err: null }); this.props.onHome?.(); }}>{home}</button>
          </div>
        </div>
      </div>
    );
  }
}
