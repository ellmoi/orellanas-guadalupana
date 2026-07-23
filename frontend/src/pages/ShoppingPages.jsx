import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import '../styles/shopping.css';
const money = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    (v || 0) / 100,
  );
export function ShopPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const { add } = useCart();
  useEffect(() => {
    apiRequest('/products')
      .then((r) => setProducts(r.data.items))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="shop-page">
      <header className="page-hero">
        <p className="eyebrow">Cultivo local</p>
        <h1>Tienda</h1>
        <p>Orellanas frescas para tu hogar o negocio.</p>
      </header>
      {error && <p role="alert">{error}</p>}
      <section className="product-grid">
        {products.map((p) => (
          <article className="product-card" key={p.id}>
            <div className="product-placeholder" aria-hidden="true">
              🍄
            </div>
            <h2>{p.name}</h2>
            <p>{p.description}</p>
            <strong>{money(p.priceInCents)}</strong>
            {p.wholesalePriceInCents && (
              <small>
                Mayorista: {money(p.wholesalePriceInCents)} desde {p.minimumWholesaleQuantity}
              </small>
            )}
            <small>Stock: {p.stock}</small>
            <button className="primary-button" disabled={!p.stock} onClick={() => add(p)}>
              Agregar al carrito
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
export function CartPage() {
  const { items, setQuantity, remove, clear } = useCart();
  const subtotal = items.reduce((s, i) => s + i.priceInCents * i.quantity, 0);
  return (
    <main className="shopping-page">
      <h1>Tu carrito</h1>
      {!items.length ? (
        <div className="empty">
          <p>Tu carrito está vacío.</p>
          <Link to="/tienda">Ir a la tienda</Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((i) => (
              <article key={i.productId}>
                <div>
                  <h2>{i.name}</h2>
                  <p>
                    {i.presentation} · {money(i.priceInCents)}
                  </p>
                </div>
                <div className="quantity">
                  <button onClick={() => setQuantity(i.productId, i.quantity - 1)} aria-label="Disminuir">
                    −
                  </button>
                  <span>{i.quantity}</span>
                  <button onClick={() => setQuantity(i.productId, i.quantity + 1)} aria-label="Aumentar">
                    +
                  </button>
                </div>
                <strong>{money(i.priceInCents * i.quantity)}</strong>
                <button className="text-button" onClick={() => remove(i.productId)}>
                  Eliminar
                </button>
              </article>
            ))}
          </div>
          <aside className="summary">
            <p>
              <span>Subtotal estimado</span>
              <strong>{money(subtotal)}</strong>
            </p>
            <p>Descuento y envío se validan al confirmar.</p>
            <Link className="primary-button" to="/checkout">
              Continuar al checkout
            </Link>
            <button className="secondary-button" onClick={clear}>
              Vaciar carrito
            </button>
          </aside>
        </>
      )}
    </main>
  );
}
export function CheckoutPage() {
  const { items, clear } = useCart();
  const { accessToken, user } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await apiRequest('/cart/sync', {
        method: 'POST',
        token: accessToken,
        body: { items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
      });
      const body = Object.fromEntries(form);
      const { data } = await apiRequest('/orders/checkout', { method: 'POST', token: accessToken, body });
      clear();
      nav(`/pedidos/${data.order.id}`);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <main className="shopping-page">
      <h1>Finalizar pedido</h1>
      <p className="online-notice">Pago en línea próximamente.</p>
      <form className="checkout-form" onSubmit={submit}>
        {[
          ['name', 'Nombre', `${user?.firstName || ''} ${user?.lastName || ''}`.trim()],
          ['phone', 'Teléfono', user?.phone || ''],
          ['email', 'Correo', user?.email || ''],
          ['address', 'Dirección', ''],
          ['city', 'Ciudad', user?.city || ''],
          ['neighborhood', 'Barrio', ''],
          ['reference', 'Referencia', ''],
          ['notes', 'Notas', ''],
        ].map(([name, label, value]) => (
          <label key={name}>
            {label}
            <input name={name} defaultValue={value} required={!['reference', 'notes'].includes(name)} />
          </label>
        ))}
        <label>
          Tipo de entrega
          <select name="deliveryType">
            <option value="DELIVERY">Domicilio</option>
            <option value="PICKUP">Recoger</option>
          </select>
        </label>
        <label>
          Método de pago
          <select name="paymentMethod">
            <option value="CASH_ON_DELIVERY">Contra entrega</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="PENDING">Pago pendiente</option>
          </select>
        </label>
        <fieldset>
          <legend>Facturación opcional</legend>
          <p>Podrás solicitar los datos fiscales en las notas mientras se habilita facturación electrónica.</p>
        </fieldset>
        {error && (
          <p role="alert" className="form-status form-status--error">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={!items.length}>
          Confirmar pedido
        </button>
      </form>
    </main>
  );
}
export function OrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    apiRequest('/orders', { token: accessToken }).then((r) => setOrders(r.data.items));
  }, [accessToken]);
  return (
    <main className="shopping-page">
      <h1>Mis pedidos</h1>
      {orders.map((o) => (
        <Link className="order-row" to={`/pedidos/${o.id}`} key={o.id}>
          <strong>{o.number}</strong>
          <span>{new Date(o.createdAt).toLocaleDateString('es-CO')}</span>
          <span>{o.status}</span>
          <strong>{money(o.totalInCents)}</strong>
        </Link>
      ))}
    </main>
  );
}
export function OrderDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const { add } = useCart();
  const [order, setOrder] = useState(null);
  const load = () => apiRequest(`/orders/${id}`, { token: accessToken }).then((r) => setOrder(r.data.order));
  useEffect(load, [id, accessToken]);
  if (!order) return <p className="page-message">Cargando pedido…</p>;
  const cancel = async () => {
    await apiRequest(`/orders/${id}/cancel`, { method: 'POST', token: accessToken });
    load();
  };
  const repeat = () => {
    order.items.forEach(
      (i) =>
        i.productId &&
        add({
          id: i.productId,
          name: i.productName,
          presentation: i.presentation,
          priceInCents: i.unitPriceInCents,
          stock: 999,
        }),
    );
  };
  return (
    <main className="shopping-page">
      <section className="receipt" id="receipt">
        <img src="/images/logo-setas-la-guadalupana.png" alt="Logo Setas La Guadalupana" />
        <h1>Setas La Guadalupana</h1>
        <h2>Comprobante {order.number}</h2>
        <p>
          {new Date(order.createdAt).toLocaleString('es-CO')} · {order.customerName}
        </p>
        {order.items.map((i) => (
          <p className="receipt-line" key={i.id}>
            <span>
              {i.quantity} × {i.productName}
            </span>
            <strong>{money(i.totalInCents)}</strong>
          </p>
        ))}
        <hr />
        <p className="receipt-line">
          <span>Subtotal</span>
          <strong>{money(order.subtotalInCents)}</strong>
        </p>
        <p className="receipt-line">
          <span>Descuento</span>
          <strong>{money(order.discountInCents)}</strong>
        </p>
        <p className="receipt-line">
          <span>Envío</span>
          <strong>{money(order.shippingInCents)}</strong>
        </p>
        <p className="receipt-line total">
          <span>Total</span>
          <strong>{money(order.totalInCents)}</strong>
        </p>
        <p>
          Método: {order.paymentMethod} · Estado: {order.status}
        </p>
        <p>Gracias por apoyar el trabajo de nuestra familia.</p>
        <strong className="warning">
          Este documento es un comprobante de pedido y no constituye una factura electrónica.
        </strong>
      </section>
      <div className="receipt-actions">
        <button className="primary-button" onClick={() => window.print()}>
          Imprimir
        </button>
        <a
          className="secondary-button"
          href={`http://localhost:3000/api/orders/${id}/receipt.pdf`}
          onClick={async (e) => {
            e.preventDefault();
            const response = await fetch(e.currentTarget.href, { headers: { Authorization: `Bearer ${accessToken}` } });
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante-${order.number}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Descargar PDF
        </a>
        <button className="secondary-button" onClick={repeat}>
          Repetir pedido
        </button>
        {['PENDING', 'CONFIRMED'].includes(order.status) && (
          <button className="text-button" onClick={cancel}>
            Cancelar pedido
          </button>
        )}
      </div>
    </main>
  );
}
