import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { CartContext } from './cart-context.js';
const KEY = 'guadalupana_cart';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};
export function CartProvider({ children }) {
  const { accessToken } = useAuth();
  const [items, setItems] = useState(read);
  const save = useCallback((next) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);
  useEffect(() => {
    if (!accessToken || !items.length) return;
    apiRequest('/cart/sync', {
      method: 'POST',
      token: accessToken,
      body: { items: items.map(({ productId, quantity }) => ({ productId, quantity })) },
    })
      .then(({ data }) =>
        save(data.cart.items.map((i) => ({ ...i.product, productId: i.productId, quantity: i.quantity }))),
      )
      .catch(() => {});
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps
  const add = useCallback(
    (product, quantity = 1) =>
      save(
        items.some((i) => i.productId === product.id)
          ? items.map((i) =>
              i.productId === product.id ? { ...i, quantity: Math.min(product.stock, i.quantity + quantity) } : i,
            )
          : [...items, { ...product, productId: product.id, quantity }],
      ),
    [items, save],
  );
  const setQuantity = useCallback(
    (id, quantity) =>
      save(items.map((i) => (i.productId === id ? { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) } : i))),
    [items, save],
  );
  const remove = useCallback((id) => save(items.filter((i) => i.productId !== id)), [items, save]);
  const clear = useCallback(() => save([]), [save]);
  const value = useMemo(
    () => ({ items, add, setQuantity, remove, clear, count: items.reduce((s, i) => s + i.quantity, 0) }),
    [items, add, setQuantity, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
