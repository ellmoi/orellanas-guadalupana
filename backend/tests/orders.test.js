import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
let token, product, order, initialStock;
before(async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'cliente@guadalupana.local', password: 'ClienteLocal2026!' });
  token = login.body.data.accessToken;
  product = await prisma.product.findFirst({ where: { slug: 'orellana-fresca-250-g' } });
  initialStock = product.stock;
  await request(app).delete('/api/cart').set('Authorization', `Bearer ${token}`);
});
after(async () => {
  if (order) {
    await prisma.inventoryMovement.deleteMany({ where: { reference: order.number } });
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    await prisma.product.update({ where: { id: product.id }, data: { stock: initialStock } });
  }
  await prisma.$disconnect();
});
test('crea pedido, calcula totales en backend y descuenta inventario', async () => {
  await request(app)
    .put('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product.id, quantity: 2 });
  const response = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${token}`).send({
    name: 'Cliente Demostración',
    phone: '3001234567',
    email: 'cliente@guadalupana.local',
    address: 'Calle 1 # 2-3',
    city: 'Bogotá',
    neighborhood: 'Centro',
    deliveryType: 'DELIVERY',
    paymentMethod: 'PENDING',
  });
  assert.equal(response.status, 201);
  order = response.body.data.order;
  assert.equal(order.subtotalInCents, product.priceInCents * 2);
  assert.equal(order.totalInCents, order.subtotalInCents + order.shippingInCents);
  assert.equal((await prisma.product.findUnique({ where: { id: product.id } })).stock, initialStock - 2);
});
test('rechaza stock insuficiente', async () => {
  const response = await request(app)
    .put('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: product.id, quantity: 999 });
  assert.equal(response.status, 409);
});
test('impide consultar pedido ajeno', async () => {
  const admin = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'admin@guadalupana.local', password: 'AdminLocal2026!' });
  const response = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Authorization', `Bearer ${admin.body.data.accessToken}`);
  assert.equal(response.status, 404);
});
test('valida cantidad mínima mayorista', async () => {
  const wholesale = await prisma.product.findFirst({ where: { wholesaleOnly: true } });
  const response = await request(app)
    .put('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ productId: wholesale.id, quantity: 1 });
  assert.equal(response.status, 200);
  const checkout = await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${token}`).send({
    name: 'Cliente Demostración',
    phone: '3001234567',
    email: 'cliente@guadalupana.local',
    address: 'Calle 1 # 2-3',
    city: 'Bogotá',
    neighborhood: 'Centro',
    deliveryType: 'PICKUP',
    paymentMethod: 'TRANSFER',
  });
  assert.equal(checkout.status, 422);
  await request(app).delete('/api/cart').set('Authorization', `Bearer ${token}`);
});
test('genera comprobante PDF', async () => {
  const response = await request(app)
    .get(`/api/orders/${order.id}/receipt.pdf`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.match(response.headers['content-type'], /application\/pdf/);
  assert.equal(response.body.subarray(0, 4).toString(), '%PDF');
});
test('permite cancelación temprana y repone inventario', async () => {
  const response = await request(app).post(`/api/orders/${order.id}/cancel`).set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.data.order.status, 'CANCELLED');
  assert.equal((await prisma.product.findUnique({ where: { id: product.id } })).stock, initialStock);
});
test('deniega cancelación repetida', async () => {
  const response = await request(app).post(`/api/orders/${order.id}/cancel`).set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 409);
});
