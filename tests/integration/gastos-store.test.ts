import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearStoredToken, setStoredToken } from '../../src/services/api.ts';
import { useGastosStore } from '../../src/store/gastosStore.ts';

const buildFetchResponse = <T>(status: number, payload: T): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(payload),
  }) as unknown as Response;

describe('gastosStore integration', () => {
  beforeEach(() => {
    clearStoredToken();
    useGastosStore.setState({
      gastos: [],
      loading: false,
      error: null,
      filtroCategoria: 'todas',
    });
  });

  it('loadGastos normaliza _id a id al traer datos desde API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      buildFetchResponse(200, {
        data: [
          {
            _id: 'mongo-gasto-1',
            descripcion: 'Mercado',
            monto: 1200,
            fecha: '2026-03-04',
            categoria: 'alimentacion',
            categoriaLabel: 'Alimentacion',
            esRecurrente: false,
            esCompartido: false,
            notas: '',
            cuentaVence: '',
          },
        ],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await useGastosStore.getState().loadGastos();

    const state = useGastosStore.getState();
    expect(state.error).toBeNull();
    expect(state.gastos).toHaveLength(1);
    expect(state.gastos[0]?.id).toBe('mongo-gasto-1');
  });

  it('loadGastos en 401 vacia lista y mantiene mensaje real de error', async () => {
    setStoredToken('token-expirado');
    useGastosStore.setState({
      gastos: [
        {
          id: 'gasto-previo',
          descripcion: 'Dato previo',
          monto: 100,
          fecha: '2026-03-04',
          categoria: 'otros',
          categoriaLabel: 'Otros',
          esRecurrente: false,
          esCompartido: false,
          notas: '',
          cuentaVence: '',
        },
      ],
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValue(buildFetchResponse(401, { message: 'Token invalido o expirado' }));
    vi.stubGlobal('fetch', fetchMock);

    await useGastosStore.getState().loadGastos();

    const state = useGastosStore.getState();
    expect(state.gastos).toEqual([]);
    expect(state.error).toBe('Token invalido o expirado');
  });
});
