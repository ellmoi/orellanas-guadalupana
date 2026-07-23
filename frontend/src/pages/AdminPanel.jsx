import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bell, ChevronRight, LayoutDashboard, LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { apiRequest } from '../services/api.js';
import { AnalyticsDashboard, InventoryAdmin, ReportsAdmin } from '../components/AdminAnalytics.jsx';
import '../styles/admin.css';

const modules = [
  ['dashboard', 'Dashboard', ['ADMIN', 'CONTENT_EDITOR', 'ORDER_MANAGER']],
  ['products', 'Productos', ['ADMIN', 'CONTENT_EDITOR']],
  ['categories', 'Categorias', ['ADMIN', 'CONTENT_EDITOR']],
  ['recipes', 'Recetas', ['ADMIN', 'CONTENT_EDITOR']],
  ['publications', 'Publicaciones', ['ADMIN', 'CONTENT_EDITOR']],
  ['testimonials', 'Testimonios', ['ADMIN', 'CONTENT_EDITOR']],
  ['faqs', 'Preguntas frecuentes', ['ADMIN', 'CONTENT_EDITOR']],
  ['users', 'Usuarios', ['ADMIN']],
  ['orders', 'Pedidos', ['ADMIN', 'ORDER_MANAGER']],
  ['inventory', 'Inventario', ['ADMIN', 'ORDER_MANAGER']],
  ['reports', 'Reportes', ['ADMIN', 'ORDER_MANAGER']],
  ['wholesale-requests', 'Solicitudes mayoristas', ['ADMIN', 'ORDER_MANAGER']],
  ['contacts', 'Mensajes de contacto', ['ADMIN', 'ORDER_MANAGER']],
  ['reviews', 'Opiniones', ['ADMIN', 'ORDER_MANAGER']],
  ['discounts', 'Descuentos', ['ADMIN']],
  ['coupons', 'Cupones', ['ADMIN']],
  ['settings', 'Configuracion', ['ADMIN']],
  ['audit', 'Auditoria', ['ADMIN']],
];
const endpoints = { users: '/admin/users', orders: '/admin/orders' };

export function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    try {
      const user = await login(Object.fromEntries(new FormData(event.currentTarget)));
      if (!user.roles.some((x) => ['ADMIN', 'CONTENT_EDITOR', 'ORDER_MANAGER'].includes(x)))
        throw new Error('Esta cuenta no tiene acceso administrativo.');
      navigate('/admin/dashboard');
    } catch (reason) {
      setError(reason.message);
    }
  };
  return (
    <main className="admin-login">
      <form onSubmit={submit}>
        <img src="/images/logo-setas-la-guadalupana.png" alt="Setas La Guadalupana" />
        <p>Administracion segura</p>
        <h1>Panel administrativo</h1>
        <label>
          Correo o usuario
          <input name="identifier" required />
        </label>
        <label>
          Contrasena
          <input type="password" name="password" required />
        </label>
        {error && <p role="alert">{error}</p>}
        <button>Ingresar</button>
        <Link to="/">Volver al sitio</Link>
      </form>
    </main>
  );
}

export function AdminPanel() {
  const { module = 'dashboard' } = useParams();
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const allowed = modules.filter(([, , roles]) => roles.some((role) => user.roles.includes(role)));
  const current = allowed.find(([key]) => key === module) || allowed[0];
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const special = ['inventory', 'reports'].includes(module);
  const load = () => {
    if (special) return;
    setResult(null);
    const path = module === 'dashboard' ? '/admin/dashboard' : endpoints[module] || `/admin/${module}`;
    apiRequest(`${path}${query ? `?search=${encodeURIComponent(query)}` : ''}`, { token: accessToken })
      .then((response) => setResult(response.data))
      .catch((error) => setNotice(error.message));
  };
  useEffect(load, [module, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin/dashboard">
          <img src="/images/logo-setas-la-guadalupana.png" alt="" />
          <span>
            La Guadalupana<small>Administracion</small>
          </span>
        </Link>
        <nav>
          {allowed.map(([key, label]) => (
            <Link className={module === key ? 'active' : ''} to={`/admin/${key}`} key={key}>
              {key === 'dashboard' && <LayoutDashboard size={17} />} {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => {
            logout();
            navigate('/admin/login');
          }}
        >
          <LogOut size={17} /> Cerrar sesion
        </button>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <button
            className="admin-menu"
            aria-label="Abrir menu"
            onClick={() => document.querySelector('.admin-sidebar')?.classList.toggle('open')}
          >
            <Menu />
          </button>
          <div>
            <small>Panel / {current[1]}</small>
            <h1>{current[1]}</h1>
          </div>
          <div className="admin-user">
            <Bell />
            <span>
              {user.firstName}
              <small>{user.roles.join(', ')}</small>
            </span>
          </div>
        </header>
        <div className="breadcrumbs">
          <Link to="/admin/dashboard">Inicio</Link>
          <ChevronRight size={14} />
          <span>{current[1]}</span>
        </div>
        {notice && (
          <div className="admin-notice" role="status">
            {notice}
          </div>
        )}
        {module === 'dashboard' ? (
          <AnalyticsDashboard data={result} />
        ) : module === 'inventory' ? (
          <InventoryAdmin token={accessToken} notify={setNotice} />
        ) : module === 'reports' ? (
          <ReportsAdmin token={accessToken} notify={setNotice} />
        ) : (
          <ModuleTable
            module={module}
            result={result}
            query={query}
            setQuery={setQuery}
            load={load}
            token={accessToken}
            notify={setNotice}
          />
        )}
      </main>
    </div>
  );
}

function ModuleTable({ module, result, query, setQuery, load, token, notify }) {
  const items = result?.items || [];
  const pagination = result?.pagination;
  const [show, setShow] = useState(false);
  return (
    <>
      <section className="admin-toolbar">
        <div>
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" />
          <button onClick={load}>Filtrar</button>
        </div>
        {['products', 'categories', 'recipes', 'publications', 'testimonials', 'faqs'].includes(module) && (
          <button onClick={() => setShow(true)}>Crear registro</button>
        )}
      </section>
      {!result ? (
        <Skeleton />
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre / referencia</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.name ||
                      item.title ||
                      item.question ||
                      item.number ||
                      item.email ||
                      item.key ||
                      item.action ||
                      item.id}
                  </td>
                  <td>{item.status ?? (item.isActive ? 'ACTIVO' : '')}</td>
                  <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-CO') : '-'}</td>
                  <td>
                    <button
                      onClick={async () => {
                        if (confirm('Confirmas esta accion?')) {
                          try {
                            await apiRequest(`/admin/${module}/${item.id}`, { method: 'DELETE', token });
                            notify('Registro archivado.');
                            load();
                          } catch (error) {
                            notify(error.message);
                          }
                        }
                      }}
                    >
                      Archivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="admin-empty">No hay resultados.</p>}
        </div>
      )}
      {pagination && (
        <footer className="admin-pagination">
          <span>
            Pagina {pagination.page} de {pagination.pages || 1}
          </span>
          <span>{pagination.total} registros</span>
        </footer>
      )}
      {show && (
        <CreateModal
          module={module}
          token={token}
          close={() => setShow(false)}
          done={() => {
            setShow(false);
            load();
          }}
          notify={notify}
        />
      )}
    </>
  );
}

function CreateModal({ module, token, close, done, notify }) {
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['priceInCents', 'stock']) if (body[key]) body[key] = Number(body[key]);
    if (module === 'products')
      Object.assign(body, {
        status: 'DRAFT',
        description: body.description || 'Pendiente de contenido',
        presentation: body.presentation || 'Por definir',
      });
    if (module === 'recipes')
      Object.assign(body, { status: 'DRAFT', summary: body.summary || 'Pendiente de contenido' });
    try {
      await apiRequest(`/admin/${module}`, { method: 'POST', token, body });
      done();
    } catch (error) {
      notify(error.message);
    }
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="admin-modal" onSubmit={submit}>
        <h2>Crear en {module}</h2>
        <label>
          Nombre o titulo
          <input name={module === 'recipes' ? 'title' : module === 'faqs' ? 'question' : 'name'} required />
        </label>
        {module === 'faqs' ? (
          <label>
            Respuesta
            <textarea name="answer" required />
          </label>
        ) : (
          <>
            <label>
              Slug
              <input name="slug" required />
            </label>
            {module === 'products' && (
              <>
                <label>
                  SKU
                  <input name="sku" required />
                </label>
                <label>
                  Precio en centavos
                  <input name="priceInCents" type="number" required />
                </label>
                <label>
                  Stock
                  <input name="stock" type="number" defaultValue="0" />
                </label>
              </>
            )}
          </>
        )}
        <div>
          <button type="button" onClick={close}>
            Cancelar
          </button>
          <button>Guardar</button>
        </div>
      </form>
    </div>
  );
}
function Skeleton() {
  return (
    <div className="admin-skeleton">
      <i />
      <i />
      <i />
    </div>
  );
}
