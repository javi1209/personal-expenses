import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const IS_WINDOWS = process.platform === 'win32';

async function start() {
    console.log('[dev-memory] Iniciando MongoMemoryServer...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`[dev-memory] MongoDB en memoria activo en: ${uri}`);

    process.env.MONGODB_URI = uri;
    process.env.NODE_ENV = 'development';

    const spawnArgs = { cwd: ROOT_DIR, env: process.env, shell: true };

    const serverProcess = spawn('npm', ['run', 'server'], { ...spawnArgs, stdio: 'pipe' });
    const webProcess = spawn('npm', ['run', 'dev'], { ...spawnArgs, stdio: 'pipe' });

    serverProcess.stdout.on('data', d => process.stdout.write(`[SERVER] ${d.toString()}`));
    serverProcess.stderr.on('data', d => process.stderr.write(`[SERVER ERR] ${d.toString()}`));

    webProcess.stdout.on('data', d => process.stdout.write(`[WEB] ${d.toString()}`));
    webProcess.stderr.on('data', d => process.stderr.write(`[WEB ERR] ${d.toString()}`));

    console.log('[dev-memory] Escuchando procesos de servidor y frontend.');
}

start().catch(console.error);
