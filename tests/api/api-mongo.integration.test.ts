// @vitest-environment node

import { createRequire } from 'node:module';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest, { type SuperTest, type Test } from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

interface ServerModule {
  app: Express;
  connectDatabase: (mongoUri?: string) => Promise<mongoose.Connection>;
  disconnectDatabase: () => Promise<void>;
}

const require = createRequire(import.meta.url);

const TEST_JWT_SECRET = 'test-jwt-secret-with-32-characters-minimum';

let mongoServer: MongoMemoryServer;
let request: SuperTest<Test>;
let connectDatabase: ServerModule['connectDatabase'];
let disconnectDatabase: ServerModule['disconnectDatabase'];

const registerPayload = (suffix: string) => ({
  nombre: `Usuario ${suffix}`,
  email: `usuario.${suffix}@gastos.test`,
  password: 'password1234',
});

const gastoPayload = (descripcion: string) => ({
  descripcion,
  monto: 1500,
  fecha: '2026-03-04',
  categoria: 'alimentacion',
  notas: '',
  esRecurrente: false,
  cuentaVence: '',
  esCompartido: false,
});

const createSession = async (suffix: string): Promise<{ token: string }> => {
  const registerRes = await request
    .post('/api/auth/register')
    .send(registerPayload(suffix))
    .expect(201);

  return { token: registerRes.body.data.token as string };
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '5000';
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.CORS_ORIGIN = 'http://localhost:5173,http://127.0.0.1:5173';
  process.env.RATE_LIMIT_MAX = '10000';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  const serverModule = require('../../server/index.cjs') as ServerModule;
  connectDatabase = serverModule.connectDatabase;
  disconnectDatabase = serverModule.disconnectDatabase;
  request = supertest(serverModule.app);

  await connectDatabase(process.env.MONGODB_URI);
});

beforeEach(async () => {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB no esta conectado para los tests de integracion');
  }
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('API integration with mongodb-memory-server', () => {
  it('register + login + me devuelve sesion valida', async () => {
    const payload = registerPayload('auth-flow');

    const registerRes = await request.post('/api/auth/register').send(payload).expect(201);
    expect(registerRes.body.data.user).toMatchObject({
      nombre: payload.nombre,
      email: payload.email,
    });
    expect(registerRes.body.data.token).toEqual(expect.any(String));

    const loginRes = await request
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password })
      .expect(200);
    const token = loginRes.body.data.token as string;
    expect(token).toEqual(expect.any(String));

    const meRes = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.data.user).toMatchObject({
      nombre: payload.nombre,
      email: payload.email,
    });
  });

  it('CRUD de gastos aplica aislamiento por usuario', async () => {
    const owner = await createSession('owner');
    const other = await createSession('other');

    const createRes = await request
      .post('/api/gastos')
      .set('Authorization', `Bearer ${owner.token}`)
      .send(gastoPayload('Supermercado semanal'))
      .expect(200);

    const gastoId = createRes.body.data.id as string;
    expect(gastoId).toEqual(expect.any(String));
    expect(createRes.body.data).toMatchObject({
      descripcion: 'Supermercado semanal',
      categoria: 'alimentacion',
      categoriaLabel: 'Alimentacion',
    });

    const ownerList = await request
      .get('/api/gastos')
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(ownerList.body.data).toHaveLength(1);
    expect(ownerList.body.data[0]).toMatchObject({ id: gastoId });

    const otherList = await request
      .get('/api/gastos')
      .set('Authorization', `Bearer ${other.token}`)
      .expect(200);
    expect(otherList.body.data).toHaveLength(0);

    const updateRes = await request
      .put(`/api/gastos/${gastoId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ monto: 1890, notas: 'Actualizado desde test' })
      .expect(200);
    expect(updateRes.body.data).toMatchObject({
      id: gastoId,
      monto: 1890,
      notas: 'Actualizado desde test',
    });

    await request
      .delete(`/api/gastos/${gastoId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .expect(404);

    await request
      .delete(`/api/gastos/${gastoId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);

    const finalList = await request
      .get('/api/gastos')
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(finalList.body.data).toHaveLength(0);
  });

  it('rechaza gastos sin token o con categoria invalida', async () => {
    await request.get('/api/gastos').expect(401);

    const user = await createSession('invalid-category');
    await request
      .post('/api/gastos')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        ...gastoPayload('Pago invalido'),
        categoria: 'categoria-no-existe',
      })
      .expect(400);
  });
});

describe('Recurrentes: generación automática mensual', () => {
  it('genera copias de gastos recurrentes del mes anterior', async () => {
    const { token } = await createSession('recurrentes-gen');

    // Crear gasto recurrente en el "mes anterior" (2026-02)
    await request
      .post('/api/gastos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...gastoPayload('Alquiler mensual'),
        esRecurrente: true,
        fecha: '2026-02-15',
      })
      .expect(200);

    // Crear gasto NO recurrente — no debe copiarse
    await request
      .post('/api/gastos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...gastoPayload('Compra puntual'),
        esRecurrente: false,
        fecha: '2026-02-20',
      })
      .expect(200);

    // Llamar al endpoint de generación para 2026-03
    const genRes = await request
      .post('/api/admin/generar-recurrentes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(genRes.body.data).toMatchObject({
      generados: 1,
      mes: '2026-03',
      yaGenerado: false,
    });

    // Verificar que la copia tiene la fecha del mes actual y sigue siendo recurrente
    const listRes = await request
      .get('/api/gastos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const copia = (listRes.body.data as { descripcion: string; esRecurrente: boolean; fecha: string }[]).find(
      (g) => g.descripcion === 'Alquiler mensual' && g.fecha === '2026-03-01'
    );
    expect(copia).toBeDefined();
    expect(copia?.esRecurrente).toBe(true);
  });

  it('es idempotente: no duplica al llamar dos veces en el mismo mes', async () => {
    const { token } = await createSession('recurrentes-idem');

    await request
      .post('/api/gastos')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...gastoPayload('Seguro auto'), esRecurrente: true, fecha: '2026-02-10' })
      .expect(200);

    // Primera llamada
    await request
      .post('/api/admin/generar-recurrentes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Segunda llamada — debe devolver yaGenerado: true
    const segundaRes = await request
      .post('/api/admin/generar-recurrentes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(segundaRes.body.data.yaGenerado).toBe(true);
  });

  it('devuelve 401 sin token de autenticación', async () => {
    await request.post('/api/admin/generar-recurrentes').expect(401);
    await request.get('/api/admin/recurrentes-log').expect(401);
  });

  it('devuelve el log de ejecuciones previas', async () => {
    const { token } = await createSession('recurrentes-log');

    await request
      .post('/api/gastos')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...gastoPayload('Netflix'), esRecurrente: true, fecha: '2026-02-01' })
      .expect(200);

    await request
      .post('/api/admin/generar-recurrentes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const logRes = await request
      .get('/api/admin/recurrentes-log')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(logRes.body.data)).toBe(true);
    expect(logRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(logRes.body.data[0]).toMatchObject({ mes: '2026-03' });
  });
});
