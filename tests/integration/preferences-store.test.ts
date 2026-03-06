import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TOKEN_STORAGE_KEY } from '../../src/services/api.ts';
import {
  PREFERENCES_STORAGE_KEY,
  usePreferencesStore,
} from '../../src/store/preferencesStore.ts';

const buildFetchResponse = <T>(status: number, payload: T): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as Response;

describe('preferencesStore integration', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      locale: 'es-MX',
      currency: 'MXN',
      theme: 'dark',
      initialized: false,
    });
    document.documentElement.classList.remove('light-theme');
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  });

  it('syncWithBackend hidrata preferencias desde la respuesta del backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      buildFetchResponse(200, {
        data: {
          locale: 'en-US',
          currency: 'USD',
          theme: 'light',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await usePreferencesStore.getState().syncWithBackend('token-test-123');

    const state = usePreferencesStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.locale).toBe('en-US');
    expect(state.currency).toBe('USD');
    expect(state.theme).toBe('light');
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);

    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}')).toMatchObject({
      locale: 'en-US',
      currency: 'USD',
      theme: 'light',
    });
  });

  it('setCurrency persiste y sincroniza contra backend con token', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'token-sync-1');
    const fetchMock = vi.fn().mockResolvedValue(buildFetchResponse(200, { data: {} }));
    vi.stubGlobal('fetch', fetchMock);

    usePreferencesStore.getState().setCurrency('ARS');

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/user\/settings$/),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-sync-1',
        }),
        body: JSON.stringify({
          locale: 'es-MX',
          currency: 'ARS',
          theme: 'dark',
        }),
      })
    );
  });

  it('setTheme aplica clase del tema y persiste en localStorage', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    usePreferencesStore.getState().setTheme('light');
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);

    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}')).toMatchObject({ theme: 'light' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
