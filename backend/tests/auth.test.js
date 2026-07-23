import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const registration = {
  fullName: 'Persona de Prueba',
  email: `registro-${suffix}@example.com`,
  birthDate: '1994-05-20',
  username: `prueba-${suffix}`.slice(0, 30),
  password: 'RegistroSeguro1!',
  confirmPassword: 'RegistroSeguro1!',
  customerType: 'RETAIL',
  phone: '3001234567',
  city: 'Bogotá',
  acceptTerms: true,
  acceptDataProcessing: true,
  commercialConsent: false,
};

after(async () => {
  await prisma.user.deleteMany({ where: { email: registration.email } });
  await prisma.$disconnect();
});

test('registro válido crea una cuenta pendiente sin devolver hash', async () => {
  const response = await request(app).post('/api/auth/register').send(registration);
  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.user.email, registration.email);
  assert.equal(response.body.data.user.passwordHash, undefined);
});

test('registro duplicado devuelve conflicto', async () => {
  const response = await request(app).post('/api/auth/register').send(registration);
  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
});

test('login correcto entrega tokens y usuario seguro', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'admin@guadalupana.local', password: 'AdminLocal2026!' });
  assert.equal(response.status, 200);
  assert.ok(response.body.data.accessToken);
  assert.ok(response.body.data.refreshToken);
  assert.equal(response.body.data.user.passwordHash, undefined);
});

test('login incorrecto no revela el motivo específico', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'admin@guadalupana.local', password: 'Incorrecta1!' });
  assert.equal(response.status, 401);
  assert.match(response.body.message, /incorrectos/i);
});

test('ruta protegida rechaza una solicitud sin token', async () => {
  const response = await request(app).get('/api/auth/me');
  assert.equal(response.status, 401);
});

test('rol no autorizado recibe 403', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'cliente@guadalupana.local', password: 'ClienteLocal2026!' });
  const response = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${login.body.data.accessToken}`);
  assert.equal(response.status, 403);
});

test('administrador puede listar usuarios con paginación numérica', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'admin@guadalupana.local', password: 'AdminLocal2026!' });
  const response = await request(app)
    .get('/api/admin/users?page=1&limit=5')
    .set('Authorization', `Bearer ${login.body.data.accessToken}`);
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.pagination.limit, 5);
  assert.ok(Array.isArray(response.body.data.items));
  assert.equal(response.body.data.items[0].passwordHash, undefined);
});

test('restablecimiento con token inválido devuelve error controlado', async () => {
  const response = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: 'a'.repeat(64), password: 'NuevaSegura1!', confirmPassword: 'NuevaSegura1!' });
  assert.equal(response.status, 400);
  assert.match(response.body.message, /token/i);
});
