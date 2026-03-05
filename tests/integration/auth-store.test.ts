import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoredToken, getStoredToken, setStoredToken } from '../../src/services/api.ts';
import { useAuthStore } from '../../src/store/authStore.ts';

const buildFetchResponse = <T>(status: number, payload: T): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as Response;

describe('authStore integration', () => {
  beforeEach(() => {
    clearStoredToken();
    useAuthStore.setState({
      user: null,
      token: null,
      loading: false,
      checkingAuth: false,
    });
  });

  it('login guarda usuario y token en store y localStorage', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      buildFetchResponse(200, {
        data: {
          token: 'token-test-123',
          user: {
            id: 'user-1',
            nombre: 'Sansa Stark',
            email: 'sansa@winterfell.com',
          },
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await useAuthStore.getState().login('sansa@winterfell.com', 'north-remembers');

    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('sansa@winterfell.com');
    expect(state.token).toBe('token-test-123');
    expect(getStoredToken()).toBe('token-test-123');
  });

  it('bootstrapAuth con token invalido limpia la sesion', async () => {
    setStoredToken('token-expirado');
    useAuthStore.setState({
      user: null,
      token: 'token-expirado',
      loading: false,
      checkingAuth: true,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValue(buildFetchResponse(401, { message: 'Token invalido o expirado' }));
    vi.stubGlobal('fetch', fetchMock);

    await useAuthStore.getState().bootstrapAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.checkingAuth).toBe(false);
    expect(getStoredToken()).toBeNull();
  });
});
