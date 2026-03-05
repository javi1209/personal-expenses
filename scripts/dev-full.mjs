import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const IS_WINDOWS = process.platform === 'win32';
const MONGO_PORT = 27017;
const API_URL = 'http://127.0.0.1:5000';
const WEB_URL = 'http://127.0.0.1:5173';

const managedChildren = [];
let isShuttingDown = false;

const log = (scope, message) => {
  console.log(`[dev:full][${scope}] ${message}`);
};

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isPortListening = (port, host = '127.0.0.1', timeoutMs = 1200) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });

const pipeWithPrefix = (stream, prefix, isError = false) => {
  if (!stream) return;
  stream.setEncoding('utf8');
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      if (isError) {
        console.error(`${prefix}${line}`);
      } else {
        console.log(`${prefix}${line}`);
      }
    }
  });

  stream.on('end', () => {
    if (buffer.trim().length === 0) return;
    if (isError) {
      console.error(`${prefix}${buffer}`);
    } else {
      console.log(`${prefix}${buffer}`);
    }
  });
};

const registerManagedChild = (child, label) => {
  managedChildren.push({ child, label });
};

const resolveMongodPath = () => {
  const fromEnv = process.env.MONGOD_BIN;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const lookup = spawnSync(IS_WINDOWS ? 'where' : 'which', ['mongod'], {
    encoding: 'utf8',
  });
  if (lookup.status === 0) {
    const first = lookup.stdout
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean);
    if (first && existsSync(first)) return first;
  }

  if (IS_WINDOWS) {
    const baseDir = 'C:\\Program Files\\MongoDB\\Server';
    if (!existsSync(baseDir)) return null;
    const versions = readdirSync(baseDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    for (const version of versions) {
      const candidate = path.join(baseDir, version, 'bin', 'mongod.exe');
      if (existsSync(candidate)) return candidate;
    }
  }

  return null;
};

const ensureMongo = async () => {
  if (await isPortListening(MONGO_PORT)) {
    log('mongo', `ya esta activo en 127.0.0.1:${MONGO_PORT}`);
    return;
  }

  const mongodPath = resolveMongodPath();
  if (!mongodPath) {
    throw new Error(
      'No se encontro mongod. Instala MongoDB o define MONGOD_BIN con la ruta al ejecutable.'
    );
  }

  const mongoDataDir = path.join(ROOT_DIR, '.mongodb', 'data');
  const mongoLogDir = path.join(ROOT_DIR, '.mongodb', 'log');
  const mongoLogFile = path.join(mongoLogDir, 'mongod.log');
  mkdirSync(mongoDataDir, { recursive: true });
  mkdirSync(mongoLogDir, { recursive: true });

  log('mongo', `iniciando mongod con dbPath local: ${mongoDataDir}`);
  const mongoChild = spawn(
    mongodPath,
    [
      '--dbpath',
      mongoDataDir,
      '--logpath',
      mongoLogFile,
      '--logappend',
      '--bind_ip',
      '127.0.0.1',
      '--port',
      String(MONGO_PORT),
    ],
    {
      cwd: ROOT_DIR,
      shell: false,
      env: process.env,
    }
  );

  registerManagedChild(mongoChild, 'mongo');
  pipeWithPrefix(mongoChild.stdout, '[mongo] ');
  pipeWithPrefix(mongoChild.stderr, '[mongo] ', true);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isPortListening(MONGO_PORT)) {
      log('mongo', `activo en 127.0.0.1:${MONGO_PORT}`);
      return;
    }
    if (mongoChild.exitCode !== null) {
      throw new Error(`mongod finalizo al iniciar (exitCode=${mongoChild.exitCode})`);
    }
    await wait(500);
  }

  throw new Error('mongod no logro abrir el puerto 27017 a tiempo.');
};

const spawnNpmScript = (label, args, prefix) => {
  const child = IS_WINDOWS
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm', ...args], {
      cwd: ROOT_DIR,
      shell: false,
      env: process.env,
    })
    : spawn('npm', args, {
      cwd: ROOT_DIR,
      shell: false,
      env: process.env,
    });

  registerManagedChild(child, label);
  pipeWithPrefix(child.stdout, prefix);
  pipeWithPrefix(child.stderr, prefix, true);
  return child;
};

const forceKillProcessTree = (pid) => {
  if (!pid) return;
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // no-op
  }
};

const shutdown = (reason, code = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log('main', `cerrando procesos (${reason})...`);

  for (const { child } of [...managedChildren].reverse()) {
    if (!child || child.exitCode !== null) continue;
    forceKillProcessTree(child.pid);
  }

  setTimeout(() => {
    process.exit(code);
  }, 200);
};

const main = async () => {
  try {
    log('main', 'iniciando entorno completo...');
    await ensureMongo();

    const server = spawnNpmScript('server', ['run', 'server'], '[server] ');
    const web = spawnNpmScript(
      'web',
      ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'],
      '[web] '
    );

    server.on('exit', (exitCode, signal) => {
      if (isShuttingDown) return;
      log('main', `server termino (code=${exitCode ?? 'null'} signal=${signal ?? 'null'})`);
      shutdown('server finalizado', 1);
    });

    web.on('exit', (exitCode, signal) => {
      if (isShuttingDown) return;
      log('main', `frontend termino (code=${exitCode ?? 'null'} signal=${signal ?? 'null'})`);
      shutdown('frontend finalizado', 1);
    });

    log('main', `listo: API ${API_URL} | WEB ${WEB_URL}`);
    log('main', 'usa Ctrl+C para detener todo.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[dev:full] error: ${message}`);
    shutdown('error en inicio', 1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT', 0));
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('uncaughtException', (error) => {
  console.error('[dev:full] uncaughtException:', error);
  shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (error) => {
  console.error('[dev:full] unhandledRejection:', error);
  shutdown('unhandledRejection', 1);
});

void main();
