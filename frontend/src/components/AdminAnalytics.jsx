import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { AlertTriangle, BarChart3, Boxes, Download, Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import '../styles/analytics.css';

const moneyKeys = new Set(['salesToday', 'salesMonth', 'retailSales', 'wholesaleSales']);
const labels = {
  salesToday: 'Ventas del día',
  salesMonth: 'Ventas del mes',
  totalOrders: 'Total de pedidos',
  users: 'Usuarios',
  newCustomers: 'Clientes nuevos',
  pendingOrders: 'Pedidos pendientes',
  preparingOrders: 'En preparación',
  deliveredOrders: 'Entregados',
  lowStock: 'Stock bajo',
  outOfStock: 'Agotados',
  retailSales: 'Ventas minoristas',
  wholesaleSales: 'Ventas mayoristas',
  restaurants: 'Restaurantes registrados',
};
const metricReports = {
  salesToday: 'sales',
  salesMonth: 'sales',
  totalOrders: 'orders',
  users: 'users',
  newCustomers: 'users',
  pendingOrders: 'orders',
  preparingOrders: 'orders',
  deliveredOrders: 'orders',
  lowStock: 'products',
  outOfStock: 'products',
  retailSales: 'retail',
  wholesaleSales: 'wholesale',
  restaurants: 'users',
};
const reportTypes = [
  'sales',
  'orders',
  'products',
  'inventory',
  'users',
  'frequent-customers',
  'wholesale',
  'retail',
  'best-sellers',
  'income',
];
const movementTypes = [
  ['ENTRY', 'Entrada'],
  ['LOSS', 'Salida'],
  ['ADJUSTMENT', 'Ajuste'],
  ['SALE', 'Venta'],
  ['RETURN', 'Devolución'],
  ['DAMAGE', 'Daño'],
  ['EXPIRATION', 'Vencimiento'],
];
const cop = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value / 100);

function ChartCard({ title, rows, type = 'bar', money = false, second }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const chart = new Chart(ref.current, {
      type,
      data: {
        labels: rows.map((x) => x.label || x.name),
        datasets: [
          {
            label: title,
            data: rows.map((x) => x.total ?? x.stock),
            backgroundColor: '#567761aa',
            borderColor: '#214c37',
            borderWidth: 2,
          },
          ...(second
            ? [{ label: 'Stock mínimo', data: rows.map((x) => x.minimumStock), backgroundColor: '#d8c49baa' }]
            : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: Boolean(second) } },
        scales:
          type === 'doughnut'
            ? {}
            : { y: { beginAtZero: true, ticks: money ? { callback: (value) => cop(value) } : {} } },
      },
    });
    return () => chart.destroy();
  }, [title, rows, type, money, second]);
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      <div>
        <canvas ref={ref} aria-label={title} />
      </div>
    </article>
  );
}

export function AnalyticsDashboard({ data }) {
  if (!data)
    return (
      <div className="admin-skeleton">
        <i />
        <i />
        <i />
      </div>
    );
  const c = data.charts;
  return (
    <>
      <section className="admin-stats analytics-stats">
        {Object.entries(data.indicators).map(([key, value]) => (
          <Link to={`/admin/reports?metric=${key}&type=${metricReports[key] || 'sales'}`} key={key}>
            <BarChart3 />
            <strong>{moneyKeys.has(key) ? cop(value) : value}</strong>
            <span>{labels[key] || key}</span>
            <small>Abrir detalle y filtros</small>
          </Link>
        ))}
      </section>
      <section className="analytics-ranking">
        <article>
          <h3>Productos más vendidos</h3>
          {data.topProducts.map((x) => (
            <p key={x.productId || x.productName}>
              <span>{x.productName}</span>
              <strong>{x._sum.quantity}</strong>
            </p>
          ))}
        </article>
        <article>
          <h3>Recetas más vistas</h3>
          {data.topRecipes.map((x) => (
            <p key={x.id}>
              <span>{x.title}</span>
              <strong>{x.viewCount}</strong>
            </p>
          ))}
        </article>
        <article>
          <h3>Productos más visitados</h3>
          {data.mostVisitedProducts.map((x) => (
            <p key={x.id}>
              <span>{x.name}</span>
              <strong>{x.viewCount}</strong>
            </p>
          ))}
        </article>
      </section>
      <section className="charts-grid">
        <ChartCard title="Ventas por fecha" rows={c.salesByDate} money />
        <ChartCard title="Ventas por producto" rows={c.salesByProduct} money />
        <ChartCard title="Ventas por categoría" rows={c.salesByCategory} money />
        <ChartCard title="Ventas por tipo de cliente" rows={c.salesByCustomerType} type="doughnut" />
        <ChartCard title="Pedidos por estado" rows={c.ordersByStatus} />
        <ChartCard title="Nuevos usuarios" rows={c.newUsers} type="line" />
        <ChartCard title="Clientes recurrentes" rows={c.recurringCustomers} />
        <ChartCard title="Ciudades" rows={c.cities} />
        <ChartCard title="Inventario" rows={c.inventory} second />
      </section>
    </>
  );
}

export function InventoryAdmin({ token, notify }) {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ page: 1 });
  const [show, setShow] = useState(false);
  const load = () =>
    apiRequest(`/admin/inventory?${new URLSearchParams(filters)}`, { token })
      .then((r) => setData(r.data))
      .catch((e) => notify(e.message));
  useEffect(load, [token, filters.page]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.quantity = Number(body.quantity);
    try {
      await apiRequest('/admin/inventory/movements', { method: 'POST', token, body });
      setShow(false);
      notify('Movimiento registrado y stock actualizado.');
      load();
    } catch (error) {
      notify(error.message);
    }
  };
  if (!data)
    return (
      <div className="admin-skeleton">
        <i />
        <i />
      </div>
    );
  return (
    <>
      <section className="inventory-alerts">
        <article>
          <AlertTriangle />
          <strong>{data.alerts.lowStock.length}</strong>
          <span>Stock bajo</span>
        </article>
        <article>
          <AlertTriangle />
          <strong>{data.alerts.outOfStock.length}</strong>
          <span>Sin stock</span>
        </article>
        <article>
          <AlertTriangle />
          <strong>{data.alerts.unusual}</strong>
          <span>Movimientos inusuales</span>
        </article>
      </section>
      <div className="admin-toolbar">
        <div>
          <select
            aria-label="Producto"
            onChange={(e) => setFilters((x) => ({ ...x, productId: e.target.value, page: 1 }))}
          >
            <option value="">Todos los productos</option>
            {data.products.map((x) => (
              <option value={x.id} key={x.id}>
                {x.name} ({x.stock})
              </option>
            ))}
          </select>
          <select aria-label="Tipo" onChange={(e) => setFilters((x) => ({ ...x, type: e.target.value, page: 1 }))}>
            <option value="">Todos los tipos</option>
            {movementTypes.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <button onClick={load}>Filtrar</button>
        </div>
        <button onClick={() => setShow(true)}>
          <Plus size={16} /> Registrar movimiento
        </button>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock actual / mínimo</th>
              <th>Movimiento</th>
              <th>Motivo</th>
              <th>Responsable</th>
              <th>Fecha / referencia</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((x) => (
              <tr key={x.id}>
                <td>
                  {x.product.name}
                  <small>{x.product.sku}</small>
                </td>
                <td>
                  {x.product.stock} / {x.product.minimumStock}
                </td>
                <td>
                  <strong className={x.quantity < 0 ? 'stock-out' : 'stock-in'}>
                    {x.quantity > 0 ? '+' : ''}
                    {x.quantity} {movementTypes.find(([value]) => value === x.type)?.[1] || x.type}
                  </strong>
                </td>
                <td>{x.reason || '-'}</td>
                <td>{x.actor ? `${x.actor.firstName} ${x.actor.lastName}` : 'Sistema'}</td>
                <td>
                  {new Date(x.createdAt).toLocaleString('es-CO')}
                  <small>{x.reference || ''}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.items.length && <p className="admin-empty">No hay movimientos para estos filtros.</p>}
      </div>
      <footer className="admin-pagination">
        <button disabled={filters.page <= 1} onClick={() => setFilters((x) => ({ ...x, page: x.page - 1 }))}>
          Anterior
        </button>
        <span>
          Página {data.pagination.page} de {data.pagination.pages || 1}
        </span>
        <button
          disabled={filters.page >= data.pagination.pages}
          onClick={() => setFilters((x) => ({ ...x, page: x.page + 1 }))}
        >
          Siguiente
        </button>
      </footer>
      {show && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-modal" onSubmit={submit}>
            <h2>Registrar movimiento</h2>
            <label>
              Producto
              <select name="productId" required>
                {data.products.map((x) => (
                  <option value={x.id} key={x.id}>
                    {x.name} - stock {x.stock}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select name="type">
                {movementTypes.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cantidad
              <input name="quantity" type="number" min="1" required />
            </label>
            <label>
              Motivo
              <textarea name="reason" required />
            </label>
            <label>
              Referencia al pedido o documento
              <input name="reference" />
            </label>
            <div>
              <button type="button" onClick={() => setShow(false)}>
                Cancelar
              </button>
              <button>Guardar movimiento</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function ReportsAdmin({ token, notify }) {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') || 'sales');
  const [rows, setRows] = useState([]);
  const metric = searchParams.get('metric');
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const metricFilters = {
    salesToday: { from: today, to: today },
    salesMonth: { from: monthStart, to: today },
    pendingOrders: { status: 'PENDING' },
    preparingOrders: { status: 'PREPARING' },
    deliveredOrders: { status: 'DELIVERED' },
    lowStock: { stockLevel: 'low' },
    outOfStock: { stockLevel: 'out' },
    retailSales: { customerType: 'RETAIL' },
    restaurants: { customerType: 'RESTAURANT' },
  };
  const [filters, setFilters] = useState(metricFilters[metric] || {});
  const [options, setOptions] = useState({ products: [], categories: [], customers: [] });
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const load = async () => {
    try {
      const response = await apiRequest(`/admin/reports/${type}?${new URLSearchParams(filters)}`, { token });
      setRows(response.data.rows);
      setPage(1);
    } catch (error) {
      notify(error.message);
    }
  };
  useEffect(() => {
    apiRequest('/admin/reports/options', { token })
      .then((response) => setOptions(response.data))
      .catch((error) => notify(error.message));
  }, [token, notify]);
  useEffect(() => {
    load();
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps
  const download = async (format) => {
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
      const response = await fetch(`${base}/admin/reports/${type}/export/${format}?${new URLSearchParams(filters)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('No fue posible exportar el reporte.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${type}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      notify(error.message);
    }
  };
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <>
      <section className="report-heading">
        <div>
          <Boxes />
          <h2>Reportes y detalle {metric ? `- ${labels[metric] || metric}` : ''}</h2>
        </div>
        <p>Las exportaciones excluyen contraseñas, tokens y datos innecesarios.</p>
      </section>
      <section className="report-filters">
        <label>
          Reporte
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {reportTypes.map((x) => (
              <option value={x} key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input type="date" onChange={(e) => setFilters((x) => ({ ...x, from: e.target.value }))} />
        </label>
        <label>
          Hasta
          <input type="date" onChange={(e) => setFilters((x) => ({ ...x, to: e.target.value }))} />
        </label>
        <label>
          Producto
          <select onChange={(e) => setFilters((x) => ({ ...x, productId: e.target.value }))}>
            <option value="">Todos</option>
            {options.products.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({x.sku})
              </option>
            ))}
          </select>
        </label>
        <label>
          Categoría
          <select onChange={(e) => setFilters((x) => ({ ...x, categoryId: e.target.value }))}>
            <option value="">Todas</option>
            {options.categories.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cliente
          <select onChange={(e) => setFilters((x) => ({ ...x, customerId: e.target.value }))}>
            <option value="">Todos</option>
            {options.customers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.firstName} {x.lastName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo de cliente
          <select onChange={(e) => setFilters((x) => ({ ...x, customerType: e.target.value }))}>
            <option value="">Todos</option>
            <option>RETAIL</option>
            <option>WHOLESALE</option>
            <option>RESTAURANT</option>
            <option>DISTRIBUTOR</option>
          </select>
        </label>
        <label>
          Estado
          <input onChange={(e) => setFilters((x) => ({ ...x, status: e.target.value }))} />
        </label>
        <label>
          Ciudad
          <input onChange={(e) => setFilters((x) => ({ ...x, city: e.target.value }))} />
        </label>
        <label>
          Método de pago
          <input onChange={(e) => setFilters((x) => ({ ...x, paymentMethod: e.target.value }))} />
        </label>
        <button onClick={load}>Aplicar filtros</button>
        <button onClick={() => download('csv')}>
          <Download size={15} /> CSV
        </button>
        <button onClick={() => download('pdf')}>
          <Download size={15} /> PDF
        </button>
      </section>
      <div className="admin-table-wrap report-preview">
        <table>
          <thead>
            <tr>
              {Object.keys(rows[0] || {}).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={index}>
                {Object.values(row).map((value, i) => (
                  <td key={i}>
                    {typeof value === 'string' && value.includes('T')
                      ? new Date(value).toLocaleString('es-CO')
                      : String(value ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="admin-empty">No hay resultados para estos filtros.</p>}
      </div>
      <footer className="admin-pagination">
        <button disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>
          Anterior
        </button>
        <span>
          Página {page} de {pages} · {rows.length} registros
        </span>
        <button disabled={page >= pages} onClick={() => setPage((x) => x + 1)}>
          Siguiente
        </button>
      </footer>
      <p className="report-note">
        Vista paginada en bloques de {pageSize}. Excel queda documentado como mejora futura.
      </p>
    </>
  );
}
