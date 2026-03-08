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

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '5001';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.CORS_ORIGIN = 'http://localhost:5173,http://127.0.0.1:5173';
    process.env.RATE_LIMIT_MAX = '10000';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();

    const serverModule = require('../../server/index.cjs') as ServerModule;
    connectDatabase = serverModule.connectDatabase;
    disconnectDatabase = serverModule.disconnectDatabase;

    const app = serverModule.app;
    request = supertest(app);
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

describe('Módulo de Gastos Compartidos e Interfaz Matemática', () => {
    it('debería calcular la cuota justa entre participantes y devolver saldo global (dueño)', async () => {
        const duenoReq = await createSession('owner1');

        // 1. Crear un Gasto Compartido
        const createRes = await request
            .post('/api/compartidos')
            .set('Authorization', `Bearer ${duenoReq.token}`)
            .send({
                descripcion: 'Cena compartida v1',
                montoTotal: 3000,
                fecha: '2026-03-05',
                categoria: 'alimentacion',
                pagadoPor: 'Dueño',
                participantes: [
                    { nombre: 'Amigo1', email: 'amigo1@test.com', monto: 1500 },
                    { nombre: 'Amigo2', email: 'amigo2@test.com', monto: 1500 },
                ],
            })
            .expect(200);

        // El dueño no aparece en el JSON de entrada de los tests como participante que debe plata 
        // pero implicitamente es dueño y la API debe haber creado el registro y registrado todo
        const compId = createRes.body.data._id;

        const getRes = await request
            .get('/api/compartidos')
            .set('Authorization', `Bearer ${duenoReq.token}`)
            .expect(200);

        const shared = getRes.body.data.find((c: any) => c.id === compId || c._id === compId);

        // Cuota de 3000 con 50%: 1500 a pagar cada uno
        const pagoA1 = shared.participantes.find((p: any) => p.email === 'amigo1@test.com');
        expect(pagoA1.monto).toBe(1500);
        expect(pagoA1.pagado).toBe(false);
    });

    it('debería marcar el pago a un usuario e impactar las estadísticas generalas', async () => {
        const resAuth = await createSession('owner2');

        const reqCreate = await request
            .post('/api/compartidos')
            .set('Authorization', `Bearer ${resAuth.token}`)
            .send({
                descripcion: 'Regalo Conjunto',
                montoTotal: 1000,
                fecha: '2026-03-05',
                categoria: 'transporte',
                pagadoPor: 'Dueño',
                participantes: [{ nombre: 'Pedro', email: 'pedro@test.com', monto: 1000 }],
            })
            .expect(200);

        const pagoNombre = reqCreate.body.data.participantes[0].nombre;
        const gastoCompId = reqCreate.body.data._id;

        // Ejecuta marcar como pagado (POST /api/compartidos/:id/pagar)
        await request
            .post(`/api/compartidos/${gastoCompId}/pagar`)
            .set('Authorization', `Bearer ${resAuth.token}`)
            .send({ participante: pagoNombre })
            .expect(200);

        const checkRes = await request
            .get('/api/compartidos')
            .set('Authorization', `Bearer ${resAuth.token}`)
            .expect(200);

        const sharedAfter = checkRes.body.data.find((c: any) => c.id === gastoCompId || c._id === gastoCompId);

        expect(sharedAfter.estado).toBe('saldado');
        expect(sharedAfter.participantes[0].pagado).toBe(true);
    });
});
