import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiHealth } from './api.js';

describe('getApiHealth', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('devuelve la respuesta de salud del backend', async () => {
    const payload = { status: 'ok', message: 'API disponible' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));

    await expect(getApiHealth()).resolves.toEqual(payload);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/health', {
      method: 'GET',
      signal: undefined,
      headers: { Accept: 'application/json' },
    });
  });

  it('lanza un error cuando la API responde con fallo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }));

    await expect(getApiHealth()).rejects.toThrow('503');
  });
});
