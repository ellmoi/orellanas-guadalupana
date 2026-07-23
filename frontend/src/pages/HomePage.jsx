import { Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiHealth } from '../hooks/useApiHealth.js';
import '../styles/home.css';

const statusContent = {
  checking: { label: 'Comprobando conexión…', className: 'status--checking' },
  online: { label: 'Backend conectado', className: 'status--online' },
  offline: { label: 'Backend sin conexión', className: 'status--offline' },
};

export function HomePage() {
  const { status, detail } = useApiHealth();
  const currentStatus = statusContent[status];
  return (
    <main className="welcome-shell">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <img
          className="brand-logo"
          src={`${import.meta.env.BASE_URL}images/logo-setas-la-guadalupana.png`}
          alt="Logo de Setas La Guadalupana con tres orellanas"
        />
        <p className="eyebrow">
          <Sprout aria-hidden="true" size={18} /> Producción familiar y local
        </p>
        <h1 id="welcome-title">Setas La Guadalupana</h1>
        <p className="welcome-copy">Del trabajo de nuestra familia a la cocina de la tuya.</p>
        <div className={`api-status ${currentStatus.className}`} role="status" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          <span>
            <strong>{currentStatus.label}</strong>
            <small>{detail}</small>
          </span>
        </div>
        <div className="home-actions">
          <Link to="/registro" className="primary-button">
            Crear mi cuenta
          </Link>
          <Link to="/iniciar-sesion" className="secondary-button">
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}
