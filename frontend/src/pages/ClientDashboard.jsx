import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart, Home, LifeBuoy, LockKeyhole, LogOut, MapPin, Package, Store, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { apiRequest } from '../services/api.js';
import '../styles/account.css';

const sections = [
  ['resumen', 'Resumen', Home],
  ['perfil', 'Perfil', UserRound],
  ['direcciones', 'Direcciones', MapPin],
  ['pedidos', 'Pedidos', Package],
  ['favoritos', 'Favoritos', Heart],
  ['mayoristas', 'Mayoristas', Store],
  ['soporte', 'Soporte', LifeBuoy],
  ['seguridad', 'Seguridad', LockKeyhole],
];
export function ClientDashboard() {
  const { section = 'resumen' } = useParams();
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setData(null);
    const paths = {
      resumen: '/users/me/dashboard',
      direcciones: '/users/me/addresses',
      pedidos: '/orders',
      favoritos: '/users/me/favorites',
      mayoristas: '/users/me/wholesale-requests',
    };
    if (paths[section]) {
      const response = await apiRequest(paths[section], { token: accessToken });
      setData(response.data);
    } else setData({});
  }, [section, accessToken]);
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, [load]);
  const done = (text) => {
    setMessage(text);
    load();
  };
  return (
    <main className="client-area">
      <button
        className="account-menu-button"
        onClick={() => document.querySelector('.account-sidebar')?.classList.toggle('open')}
      >
        Menú de cuenta
      </button>
      <aside className="account-sidebar">
        <div>
          <p className="eyebrow">Mi cuenta</p>
          <strong>
            {user.firstName} {user.lastName}
          </strong>
          <small>{user.email}</small>
        </div>
        <nav>
          {sections.map(([key, label, Icon]) => (
            <Link className={section === key ? 'active' : ''} to={`/cuenta/${key}`} key={key}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          className="link-button"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </aside>
      <section className="account-content" aria-live="polite">
        {message && (
          <p className="account-message" role="status">
            {message}
          </p>
        )}
        {data === null && !['perfil', 'seguridad', 'soporte'].includes(section) ? (
          <Skeleton />
        ) : (
          <Section section={section} data={data || {}} user={user} token={accessToken} done={done} />
        )}
      </section>
    </main>
  );
}
function Section({ section, data, user, token, done }) {
  if (section === 'resumen') return <Dashboard data={data} />;
  if (section === 'perfil') return <Profile user={user} token={token} done={done} />;
  if (section === 'direcciones') return <Addresses data={data} token={token} done={done} />;
  if (section === 'pedidos') return <Orders data={data} />;
  if (section === 'favoritos') return <Favorites data={data} token={token} done={done} />;
  if (section === 'mayoristas') return <Wholesale data={data} user={user} token={token} done={done} />;
  if (section === 'soporte') return <Support token={token} done={done} />;
  if (section === 'seguridad') return <Security user={user} token={token} done={done} />;
  return <Empty text="Sección no encontrada." />;
}
function Dashboard({ data }) {
  return (
    <>
      <Title title="Resumen de cuenta" text="Todo lo importante, en un solo lugar." />
      <div className="stat-grid">
        <Stat label="Pedidos pendientes" value={data.pendingOrders} />
        <Stat label="Pedidos completados" value={data.completedOrders} />
        <Stat label="Productos favoritos" value={data.favoriteProducts} />
        <Stat label="Recetas favoritas" value={data.favoriteRecipes} />
      </div>
      <article className="account-panel">
        <h2>Último pedido</h2>
        {data.lastOrder ? (
          <Link to={`/pedidos/${data.lastOrder.id}`}>
            {data.lastOrder.number} · {data.lastOrder.status}
          </Link>
        ) : (
          <Empty text="Aún no tienes pedidos." />
        )}
      </article>
      <div className="quick-links">
        <Link to="/tienda">Comprar</Link>
        <Link to="/cuenta/direcciones">Agregar dirección</Link>
        <Link to="/cuenta/soporte">Solicitar ayuda</Link>
      </div>
    </>
  );
}
function Profile({ user, token, done }) {
  const submit = async (e) => {
    e.preventDefault();
    await apiRequest('/users/me/profile', {
      method: 'PATCH',
      token,
      body: Object.fromEntries(new FormData(e.currentTarget)),
    });
    done('Perfil actualizado correctamente.');
  };
  return (
    <>
      <Title title="Mi perfil" text="Mantén actualizados tus datos de contacto." />
      <form className="account-form" onSubmit={submit}>
        {[
          ['firstName', 'Nombre'],
          ['lastName', 'Apellido'],
          ['username', 'Usuario'],
          ['phone', 'Teléfono'],
          ['city', 'Ciudad'],
        ].map(([name, label]) => (
          <label key={name}>
            {label}
            <input name={name} defaultValue={user[name] || ''} />
          </label>
        ))}
        <button className="primary-button">Guardar cambios</button>
      </form>
    </>
  );
}
function Addresses({ data, token, done }) {
  const addresses = data.addresses || [];
  const submit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    body.isDefault = new FormData(e.currentTarget).has('isDefault');
    await apiRequest('/users/me/addresses', { method: 'POST', token, body });
    e.currentTarget.reset();
    done('Dirección agregada.');
  };
  return (
    <>
      <Title title="Direcciones" text="Gestiona tus destinos de entrega." />
      <div className="card-list">
        {addresses.map((a) => (
          <article key={a.id}>
            <strong>{a.label || 'Dirección'}</strong>
            <p>
              {a.line1}, {a.city}
            </p>
            <button
              className="text-button"
              onClick={async () => {
                if (confirm('¿Eliminar esta dirección?')) {
                  await apiRequest(`/users/me/addresses/${a.id}`, { method: 'DELETE', token });
                  done('Dirección eliminada.');
                }
              }}
            >
              Eliminar
            </button>
          </article>
        ))}
        {!addresses.length && <Empty text="No tienes direcciones guardadas." />}
      </div>
      <form className="account-form compact" onSubmit={submit}>
        {[
          ['label', 'Etiqueta'],
          ['recipient', 'Destinatario'],
          ['phone', 'Teléfono'],
          ['line1', 'Dirección'],
          ['city', 'Ciudad'],
          ['department', 'Departamento'],
        ].map(([name, label]) => (
          <label key={name}>
            {label}
            <input name={name} required={!['label'].includes(name)} />
          </label>
        ))}
        <label className="check">
          <input type="checkbox" name="isDefault" />
          Predeterminada
        </label>
        <button className="primary-button">Agregar dirección</button>
      </form>
    </>
  );
}
function Orders({ data }) {
  const orders = data.items || data.orders || [];
  return (
    <>
      <Title title="Mis pedidos" text="Consulta, imprime, repite o cancela cuando corresponda." />
      <div className="card-list">
        {orders.map((o) => (
          <Link to={`/pedidos/${o.id}`} key={o.id}>
            <strong>{o.number}</strong>
            <span>{o.status}</span>
            <small>{new Date(o.createdAt).toLocaleDateString('es-CO')}</small>
          </Link>
        ))}
        {!orders.length && <Empty text="Aún no tienes pedidos." />}
      </div>
    </>
  );
}
function Favorites({ data, token, done }) {
  const remove = async (type, id) => {
    await apiRequest(`/users/me/favorites/${type}/${id}`, { method: 'DELETE', token });
    done('Favorito eliminado.');
  };
  return (
    <>
      <Title title="Favoritos" text="Tus productos y recetas guardados." />
      <h2>Productos</h2>
      <div className="card-list">
        {data.products?.map((x) => (
          <article key={x.id}>
            <strong>{x.product.name}</strong>
            <button className="text-button" onClick={() => remove('products', x.productId)}>
              Quitar
            </button>
          </article>
        ))}
        {!data.products?.length && <Empty text="No tienes productos favoritos." />}
      </div>
      <h2>Recetas</h2>
      <div className="card-list">
        {data.recipes?.map((x) => (
          <article key={x.id}>
            <strong>{x.recipe.title}</strong>
            <button className="text-button" onClick={() => remove('recipes', x.recipeId)}>
              Quitar
            </button>
          </article>
        ))}
        {!data.recipes?.length && <Empty text="No tienes recetas favoritas." />}
      </div>
    </>
  );
}
function Wholesale({ data, user, token, done }) {
  const submit = async (e) => {
    e.preventDefault();
    await apiRequest('/users/me/wholesale-requests', {
      method: 'POST',
      token,
      body: Object.fromEntries(new FormData(e.currentTarget)),
    });
    e.currentTarget.reset();
    done('Solicitud mayorista enviada.');
  };
  return (
    <>
      <Title title="Solicitudes mayoristas" text="Consulta tus solicitudes o crea una nueva." />
      <div className="card-list">
        {data.requests?.map((x) => (
          <article key={x.id}>
            <strong>{x.businessName}</strong>
            <span>{x.status}</span>
          </article>
        ))}
        {!data.requests?.length && <Empty text="No tienes solicitudes mayoristas." />}
      </div>
      <form className="account-form" onSubmit={submit}>
        {[
          ['businessName', 'Negocio', ''],
          ['contactName', 'Contacto', `${user.firstName} ${user.lastName}`],
          ['email', 'Correo', user.email],
          ['phone', 'Teléfono', user.phone || ''],
          ['city', 'Ciudad', user.city || ''],
          ['estimatedVolumeKg', 'Cantidad estimada (kg)', ''],
          ['message', 'Mensaje', ''],
        ].map(([name, label, value]) => (
          <label key={name}>
            {label}
            <input name={name} defaultValue={value} required={!['estimatedVolumeKg', 'message'].includes(name)} />
          </label>
        ))}
        <label>
          Tipo de negocio
          <select name="businessType">
            <option value="RESTAURANT">Restaurante</option>
            <option value="WHOLESALE">Mayorista</option>
            <option value="DISTRIBUTOR">Distribuidor</option>
          </select>
        </label>
        <button className="primary-button">Enviar solicitud</button>
      </form>
    </>
  );
}
function Support({ token, done }) {
  const submit = async (e) => {
    e.preventDefault();
    await apiRequest('/users/me/support', {
      method: 'POST',
      token,
      body: Object.fromEntries(new FormData(e.currentTarget)),
    });
    e.currentTarget.reset();
    done('Solicitud de soporte creada.');
  };
  return (
    <>
      <Title title="Soporte" text="Cuéntanos cómo podemos ayudarte." />
      <form className="account-form" onSubmit={submit}>
        <label>
          Asunto
          <input name="subject" required />
        </label>
        <label>
          Teléfono opcional
          <input name="phone" />
        </label>
        <label className="full">
          Mensaje
          <textarea name="message" rows="6" required />
        </label>
        <button className="primary-button">Enviar solicitud</button>
      </form>
    </>
  );
}
function Security({ user, token, done }) {
  const change = async (e) => {
    e.preventDefault();
    await apiRequest('/auth/change-password', {
      method: 'POST',
      token,
      body: Object.fromEntries(new FormData(e.currentTarget)),
    });
    e.currentTarget.reset();
    done('Contraseña actualizada.');
  };
  const verify = () =>
    apiRequest('/auth/resend-verification', { method: 'POST', body: { email: user.email } }).then(() =>
      done('Enlace de verificación generado. Revisa la consola en desarrollo.'),
    );
  return (
    <>
      <Title title="Seguridad" text="Protege y verifica tu cuenta." />
      <form className="account-form" onSubmit={change}>
        <label>
          Contraseña actual
          <input type="password" name="currentPassword" autoComplete="current-password" required />
        </label>
        <label>
          Nueva contraseña
          <input type="password" name="newPassword" autoComplete="new-password" required />
        </label>
        <label>
          Confirmar contraseña
          <input type="password" name="confirmPassword" autoComplete="new-password" required />
        </label>
        <button className="primary-button">Cambiar contraseña</button>
      </form>
      <button className="secondary-button" onClick={verify}>
        Reenviar verificación de correo
      </button>
    </>
  );
}
function Title({ title, text }) {
  return (
    <header className="account-title">
      <p className="eyebrow">Área privada</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}
function Stat({ label, value }) {
  return (
    <article className="stat">
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
    </article>
  );
}
function Empty({ text }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}
function Skeleton() {
  return (
    <div className="skeleton-grid" aria-label="Cargando">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
