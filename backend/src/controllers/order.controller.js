import * as service from '../services/order.service.js';
import { success } from '../utils/response.js';

export async function cart(req, res) {
  return success(res, { data: { cart: await service.getCart(req.user.id) } });
}
export async function setItem(req, res) {
  return success(res, {
    data: { cart: await service.setCartItem(req.user.id, req.body.productId, req.body.quantity) },
  });
}
export async function sync(req, res) {
  return success(res, { data: { cart: await service.syncCart(req.user.id, req.body.items) } });
}
export async function removeItem(req, res) {
  return success(res, { data: { cart: await service.removeCartItem(req.user.id, req.params.productId) } });
}
export async function clear(req, res) {
  return success(res, { data: { cart: await service.clearCart(req.user.id) } });
}
export async function checkout(req, res) {
  const order = await service.checkout(req.user, req.body, { ip: req.ip, userAgent: req.get('user-agent') });
  return success(res, { status: 201, message: 'Pedido creado correctamente.', data: { order } });
}
export async function listOwn(req, res) {
  return success(res, { data: await service.listOwn(req.user.id, req.query) });
}
export async function detail(req, res) {
  return success(res, { data: { order: await service.getOwn(req.user.id, req.params.id) } });
}
export async function cancel(req, res) {
  return success(res, {
    message: 'Pedido cancelado.',
    data: { order: await service.cancelOwn(req.user.id, req.params.id) },
  });
}
export async function repeat(req, res) {
  return success(res, {
    message: 'Productos agregados nuevamente al carrito.',
    data: { cart: await service.repeatOwn(req.user.id, req.params.id) },
  });
}
export async function receipt(req, res) {
  const order = await service.getOwn(req.user.id, req.params.id);
  const pdf = await service.receiptPdf(order, await service.receiptSettings());
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="comprobante-${order.number}.pdf"`,
  });
  return res.send(pdf);
}
export async function adminList(req, res) {
  return success(res, { data: await service.listAdmin(req.query) });
}
export async function adminStatus(req, res) {
  return success(res, {
    data: { order: await service.updateStatus(req.user.id, req.params.id, req.body.status, req.body.comment) },
  });
}
export async function adminReceipt(req, res) {
  const order = await service.getAdmin(req.params.id);
  const pdf = await service.receiptPdf(order, await service.receiptSettings());
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="comprobante-${order.number}.pdf"`,
  });
  return res.send(pdf);
}
export async function adminPayment(req, res) {
  return success(res, {
    message: 'Pago manual registrado.',
    data: { order: await service.registerManualPayment(req.user.id, req.params.id, req.body) },
  });
}
export async function adminNote(req, res) {
  return success(res, {
    message: 'Nota interna actualizada.',
    data: { order: await service.setInternalNote(req.user.id, req.params.id, req.body.note) },
  });
}
