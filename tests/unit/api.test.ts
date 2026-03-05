import { describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  authApi,
  clearStoredToken,
  getStoredToken,
  normalizeEntity,
  resolveEntityId,
  setStoredToken,
} from '../../src/services/api.ts';

const buildFetchResponse = <T>(status: number, payload: T): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as Response;

describe('api helpers', () => {
  it('resolveEntityId prioriza id sobre _id', () => {
    expect(resolveEntityId({ id: 'front-id', _id: 'mongo-id' })).toBe('front-id');
    expect(resolveEntityId({ _id: 'mongo-id' })).toBe('mongo-id');
    expect(resolveEntityId({})).toBe('');
  });

  it('normalizeEntity asegura id consumible por UI', () => {
    expect(normalizeEntity({ _id: 'mongo-1' })).toEqual({
      _id: 'mongo-1',
      id: 'mongo-1',
    });
  });
});

describe('request error handling', () => {
  it('usa message del backend para construir ApiError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      buildFetchResponse(409, { message: 'El email ya esta registrado' })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      authApi.register({
        nombre: 'Arya Stark',
        email: 'arya@winterfell.com',
        password: 'needle12345',
      })
    ).rejects.toMatchObject<ApiError>({
      message: 'El email ya esta registrado',
      status: 409,
    });
  });

  it('en 401 limpia token y dispara evento auth:unauthorized', async () => {
    clearStoredToken();
    setStoredToken('token-expirado');

    const unauthorizedHandler = vi.fn();
    window.addEventListener('auth:unauthorized', unauthorizedHandler);

    const fetchMock = vi
      .fn()
      .mockResolvedValue(buildFetchResponse(401, { message: 'Token invalido o expirado' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(authApi.me()).rejects.toBeInstanceOf(ApiError);
    expect(getStoredToken()).toBeNull();
    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener('auth:unauthorized', unauthorizedHandler);
  });
});
