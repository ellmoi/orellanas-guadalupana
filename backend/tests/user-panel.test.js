import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
let token, product, addressId;
before(async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'cliente@guadalupana.local', password: 'ClienteLocal2026!' });
  token = login.body.data.accessToken;
  product = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
});
after(async () => {
  if (addressId) await prisma.address.deleteMany({ where: { id: addressId } });
  const user = await prisma.user.findUnique({ where: { email: 'cliente@guadalupana.local' } });
  await prisma.favoriteProduct.deleteMany({ where: { userId: user.id, productId: product.id } });
  await prisma.$disconnect();
});
test('rechaza el panel sin sesión', async () => {
  const response = await request(app).get('/api/users/me/dashboard');
  assert.equal(response.status, 401);
});
test('permite acceso autorizado al resumen', async () => {
  const response = await request(app).get('/api/users/me/dashboard').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.data.pendingOrders, 'number');
});
test('edita únicamente el perfil autenticado', async () => {
  const response = await request(app)
    .patch('/api/users/me/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ city: 'Bogotá' });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.user.city, 'Bogotá');
  assert.equal(response.body.data.user.passwordHash, undefined);
});
test('crea y elimina una dirección propia', async () => {
  const created = await request(app).post('/api/users/me/addresses').set('Authorization', `Bearer ${token}`).send({
    label: 'Prueba panel',
    recipient: 'Cliente Demostración',
    phone: '3001234567',
    line1: 'Calle 10 # 20-30',
    city: 'Bogotá',
    department: 'Cundinamarca',
    isDefault: false,
  });
  assert.equal(created.status, 201);
  addressId = created.body.data.address.id;
  const removed = await request(app)
    .delete(`/api/users/me/addresses/${addressId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(removed.status, 200);
});
test('agrega, lista y elimina un producto favorito', async () => {
  const added = await request(app)
    .put(`/api/users/me/favorites/products/${product.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(added.status, 200);
  assert.ok(added.body.data.products.some((x) => x.productId === product.id));
  const removed = await request(app)
    .delete(`/api/users/me/favorites/products/${product.id}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(removed.status, 200);
  assert.ok(!removed.body.data.products.some((x) => x.productId === product.id));
});
