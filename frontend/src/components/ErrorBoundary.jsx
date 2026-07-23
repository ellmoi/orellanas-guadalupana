import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Error de interfaz:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="error-page" role="alert">
        <p className="eyebrow">Error inesperado</p>
        <h1>No pudimos mostrar esta página</h1>
        <p>Recarga la página. Si el problema continúa, vuelve al inicio.</p>
        <div className="error-actions">
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            Recargar
          </button>
          <Link className="secondary-button" to="/">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }
}
