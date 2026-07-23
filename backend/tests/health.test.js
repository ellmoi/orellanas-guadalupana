import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/health informa que la API está disponible', async () => {
  const response = await request(app).get('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
  assert.match(response.body.message, /disponible/i);
  assert.ok(response.body.data.timestamp);
});

test('las rutas inexistentes devuelven 404', async () => {
  const response = await request(app).get('/api/no-existe');

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
});
