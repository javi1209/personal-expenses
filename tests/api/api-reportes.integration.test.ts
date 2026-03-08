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

const createSession = async (suffix: string): Promise<{ token: string; email: string }> => {
    await request.post('/api/auth/register').send(registerPayload(suffix));
    const loginRes = await request.post('/api/auth/login').send({
        email: `usuario.${suffix}@gastos.test`,
        password: 'password1234',
    }).expect(200);

    return { token: loginRes.body.data.token as string, email: `usuario.${suffix}@gastos.test` };
};

const createGasto = async (token: string, monto: number, categoria: string, fecha: string) => {
    return request.post('/api/gastos').set('Authorization', `Bearer ${token}`).send({
        descripcion: `Gasto ${categoria}`,
        monto,
        fecha,
        categoria,
        notas: '',
        esRecurrente: false,
        cuentaVence: '',
        esCompartido: false,
    });
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '5002';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.CORS_ORIGIN = '*';

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();

    const serverModule = require('../../server/index.cjs') as ServerModule;
    connectDatabase = serverModule.connectDatabase;
    disconnectDatabase = serverModule.disconnectDatabase;
    request = supertest(serverModule.app);

    await connectDatabase();
});

afterAll(async () => {
    await disconnectDatabase();
    await mongoServer.stop();
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        if (Object.prototype.hasOwnProperty.call(collections, key)) {
            await collections[key].deleteMany({});
        }
    }
});

describe('Módulo de Reportes', () => {
    it('debería calcular la tendencia mensual acumulando los gastos de los últimos 6 meses', async () => {
        const { token } = await createSession('trenduser');

        await createGasto(token, 100, 'entretenimiento', '2025-12-01');
        await createGasto(token, 100, 'entretenimiento', '2025-12-31');
        await createGasto(token, 300, 'salud', '2026-01-15');
        await createGasto(token, 400, 'vivienda', '2026-02-20');

        const res = await request
            .get('/api/reportes/tendencia')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        const tendencia = res.body.data;
        console.log('Tendencia array:', tendencia);

        // Verificamos sumatorias por periodos (formato YYYY-MM)
        const dic25 = tendencia.find((t: any) => t.mes === '2025-12');
        const ene26 = tendencia.find((t: any) => t.mes === '2026-01');
        const feb26 = tendencia.find((t: any) => t.mes === '2026-02');

        expect(dic25.Gastos).toBe(200);
        expect(ene26.Gastos).toBe(300);
        expect(feb26.Gastos).toBe(400);
    });
});
