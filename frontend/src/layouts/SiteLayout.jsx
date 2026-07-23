import { Link, Outlet } from 'react-router-dom';
import { LogOut, ShoppingCart, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import '../styles/auth.css';

export function SiteLayout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="site-header">
        <Link to="/" className="brand-link">
          <img src={`${import.meta.env.BASE_URL}images/logo-setas-la-guadalupana.png`} alt="Setas La Guadalupana" />
          <span>Setas La Guadalupana</span>
        </Link>
        <nav aria-label="Navegación principal">
          <Link to="/tienda">Tienda</Link>
          <Link to="/carrito">
            <ShoppingCart aria-hidden="true" size={17} /> Carrito ({count})
          </Link>
          {user ? (
            <>
              <Link to="/pedidos">Pedidos</Link>
              <Link to="/cuenta/resumen">
                <UserRound aria-hidden="true" size={17} /> Mi cuenta
              </Link>
              <button type="button" className="link-button" onClick={logout}>
                <LogOut aria-hidden="true" size={17} /> Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/iniciar-sesion">Ingresar</Link>
              <Link className="nav-cta" to="/registro">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>
      <div id="main-content" tabIndex="-1">
        <Outlet />
      </div>
    </div>
  );
}
