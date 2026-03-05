// ============================================================
// GASTOS APP - Express + MongoDB + Socket.io Backend
// ============================================================

require('dotenv').config();
const cors = require('cors');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const DEV_DEFAULT_CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173';
const DEV_DEFAULT_JWT_SECRET = 'dev-jwt-secret-change-this-before-production';
const DEV_DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/gastos-app';
const DEFAULT_JSON_BODY_LIMIT = '100kb';
const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 300;
const DEFAULT_JWT_EXPIRES_IN = '7d';

const readEnv = (key, options = {}) => {
  const {
    defaultValue = undefined,
    requiredInProduction = false,
  } = options;
  const value = process.env[key];
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  if (requiredInProduction && IS_PRODUCTION) {
    throw new Error(`[Config] Falta variable de entorno requerida: ${key}`);
  }
  return defaultValue;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeOrigin = (origin) => origin.trim().toLowerCase().replace(/\/+$/, '');
const isDevLoopbackOrigin = (origin) => {
  if (IS_PRODUCTION || !origin) return false;
  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const corsOriginList = readEnv('CORS_ORIGIN', {
  defaultValue: DEV_DEFAULT_CORS_ORIGINS,
  requiredInProduction: true,
})
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

if (corsOriginList.length === 0) {
  throw new Error('[Config] CORS_ORIGIN no puede estar vacio');
}

const allowedOrigins = new Set(corsOriginList);
const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.has(normalizeOrigin(origin)) || isDevLoopbackOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('Origen no permitido por CORS'));
};

const corsOptions = {
  origin: corsOriginHandler,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

const RATE_LIMIT_WINDOW_MS = parsePositiveInt(
  readEnv('RATE_LIMIT_WINDOW_MS', { defaultValue: DEFAULT_RATE_LIMIT_WINDOW_MS }),
  DEFAULT_RATE_LIMIT_WINDOW_MS
);

const RATE_LIMIT_MAX = parsePositiveInt(
  readEnv('RATE_LIMIT_MAX', { defaultValue: DEFAULT_RATE_LIMIT_MAX }),
  DEFAULT_RATE_LIMIT_MAX
);

const PORT = parsePositiveInt(readEnv('PORT', { defaultValue: 5000 }), 5000);
const MONGO = readEnv('MONGODB_URI', {
  defaultValue: DEV_DEFAULT_MONGODB_URI,
  requiredInProduction: true,
});
const JWT_SECRET = readEnv('JWT_SECRET', {
  defaultValue: DEV_DEFAULT_JWT_SECRET,
  requiredInProduction: true,
});
const JWT_EXPIRES_IN = readEnv('JWT_EXPIRES_IN', { defaultValue: DEFAULT_JWT_EXPIRES_IN });

if (!IS_PRODUCTION && JWT_SECRET === DEV_DEFAULT_JWT_SECRET) {
  console.warn('[Security] JWT_SECRET no esta definido. Se usa solo para desarrollo.');
}

if (IS_PRODUCTION && JWT_SECRET.length < 32) {
  throw new Error('[Security] JWT_SECRET debe tener al menos 32 caracteres en produccion');
}

const sanitizeText = (value) =>
  value.replace(/\u0000/g, '').replace(/[<>]/g, '').trim();

const deepSanitize = (value) => {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map((item) => deepSanitize(item));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        deepSanitize(nestedValue),
      ])
    );
  }
  return value;
};

const io = new Server(server, {
  cors: corsOptions,
});

if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: readEnv('JSON_BODY_LIMIT', { defaultValue: DEFAULT_JSON_BODY_LIMIT }) }));
app.use(express.urlencoded({
  extended: false,
  limit: readEnv('JSON_BODY_LIMIT', { defaultValue: DEFAULT_JSON_BODY_LIMIT }),
}));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  next();
});
app.use(
  '/api',
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.',
    },
  })
);

const logger = {
  info: (message, meta = {}) => {
    if (IS_PRODUCTION) {
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'INFO', message, ...meta }));
    } else {
      console.log(`[INFO] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
  error: (message, error, meta = {}) => {
    const errorData = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { error };
    if (IS_PRODUCTION) {
      console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: 'ERROR', message, ...errorData, ...meta }));
    } else {
      console.error(`[ERROR] ${message}`, errorData, meta);
    }
  }
};

// --- MongoDB Models ---
const UserSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    settings: {
      locale: { type: String, default: 'es-MX' },
      currency: { type: String, default: 'MXN' },
      theme: { type: String, default: 'dark', enum: ['light', 'dark'] },
    },
  },
  { timestamps: true }
);

const GastoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    descripcion: { type: String, required: true },
    monto: { type: Number, required: true },
    fecha: { type: String, required: true },
    categoria: { type: String, required: true },
    categoriaLabel: { type: String, required: true },
    notas: String,
    esRecurrente: { type: Boolean, default: false },
    cuentaVence: String,
    esCompartido: { type: Boolean, default: false },
    cuentaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cuenta', index: true },
  },
  { timestamps: true }
);

const GastoCompartidoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    descripcion: { type: String, required: true },
    montoTotal: { type: Number, required: true },
    fecha: { type: String, required: true },
    categoria: String,
    pagadoPor: String,
    estado: {
      type: String,
      enum: ['pendiente', 'parcial', 'saldado'],
      default: 'pendiente',
    },
    participantes: [
      {
        nombre: String,
        email: String,
        monto: Number,
        pagado: { type: Boolean, default: false },
        pagadoEn: String,
      },
    ],
    notas: String,
  },
  { timestamps: true }
);

const PresupuestoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoria: String,
    categoriaLabel: String,
    montoLimite: Number,
    montoGastado: { type: Number, default: 0 },
    periodo: {
      type: String,
      enum: ['mensual', 'semanal', 'anual'],
      default: 'mensual',
    },
    alertaUmbral: { type: Number, default: 80 },
    color: String,
  },
  { timestamps: true }
);

const CuentaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nombre: { type: String, required: true },
    tipo: {
      type: String,
      enum: ['efectivo', 'banco', 'tarjeta', 'otro'],
      default: 'efectivo',
    },
    saldoInicial: { type: Number, default: 0 },
    saldoActual: { type: Number, default: 0 },
    color: { type: String, default: '#94a3b8' },
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model('User', UserSchema);
const Gasto = mongoose.models.Gasto ?? mongoose.model('Gasto', GastoSchema);
const GastoCompartido =
  mongoose.models.GastoCompartido ?? mongoose.model('GastoCompartido', GastoCompartidoSchema);
const Presupuesto = mongoose.models.Presupuesto ?? mongoose.model('Presupuesto', PresupuestoSchema);
const Cuenta = mongoose.models.Cuenta ?? mongoose.model('Cuenta', CuentaSchema);

const ALLOWED_CATEGORIAS = new Set([
  'alimentacion',
  'transporte',
  'vivienda',
  'entretenimiento',
  'salud',
  'educacion',
  'ropa',
  'servicios',
  'otros',
]);

const CATEGORIA_META = {
  alimentacion: { label: 'Alimentacion', color: '#e8a020' },
  transporte: { label: 'Transporte', color: '#3b82f6' },
  vivienda: { label: 'Vivienda', color: '#8b5cf6' },
  entretenimiento: { label: 'Entretenimiento', color: '#ec4899' },
  salud: { label: 'Salud', color: '#ef4444' },
  educacion: { label: 'Educacion', color: '#06b6d4' },
  ropa: { label: 'Ropa', color: '#f97316' },
  servicios: { label: 'Servicios', color: '#a3e635' },
  otros: { label: 'Otros', color: '#94a3b8' },
};

const ALLOWED_PERIODOS = new Set(['mensual', 'semanal', 'anual']);
const EPSILON = 0.01;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (message) => {
  throw new HttpError(400, message);
};

const unauthorized = (message = 'No autorizado') => {
  throw new HttpError(401, message);
};

const conflict = (message) => {
  throw new HttpError(409, message);
};

const normalizeText = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const normalizeCategoria = (value) => normalizeText(value).toLowerCase();

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const assertObjectBody = (value, label) => {
  if (!isPlainObject(value)) badRequest(`${label} invalido`);
  return value;
};

const ensureAllowedFields = (payload, allowedFields) => {
  const unknown = Object.keys(payload).filter((key) => !allowedFields.has(key));
  if (unknown.length > 0) {
    badRequest(`Campos no permitidos: ${unknown.join(', ')}`);
  }
};

const readString = (payload, field, options = {}) => {
  const {
    required = false,
    minLength = 1,
    maxLength = 200,
    allowEmpty = false,
  } = options;

  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  if (typeof value !== 'string') badRequest(`Campo invalido: ${field}`);
  const text = normalizeText(value);

  if (!allowEmpty && text.length === 0) badRequest(`Campo requerido: ${field}`);
  if (text.length > 0 && text.length < minLength) badRequest(`Campo demasiado corto: ${field}`);
  if (text.length > maxLength) badRequest(`Campo demasiado largo: ${field}`);
  return text;
};

const readNumber = (payload, field, options = {}) => {
  const {
    required = false,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    allowZero = true,
  } = options;

  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) badRequest(`Campo numerico invalido: ${field}`);
  if (!allowZero && parsed === 0) badRequest(`Campo debe ser mayor que cero: ${field}`);
  if (parsed < min || parsed > max) badRequest(`Campo fuera de rango: ${field}`);
  return parsed;
};

const readBoolean = (payload, field, options = {}) => {
  const { required = false } = options;
  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  badRequest(`Campo booleano invalido: ${field}`);
};

const readDate = (payload, field, options = {}) => {
  const {
    required = false,
    allowEmpty = false,
  } = options;

  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  if (typeof value !== 'string') badRequest(`Campo de fecha invalido: ${field}`);
  const text = normalizeText(value);
  if (allowEmpty && text.length === 0) return '';
  if (text.length === 0) badRequest(`Campo requerido: ${field}`);
  if (Number.isNaN(new Date(text).getTime())) badRequest(`Fecha invalida: ${field}`);
  return text;
};

const readCategoria = (payload, field = 'categoria', options = {}) => {
  const { required = false } = options;
  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  const categoria = normalizeCategoria(value);
  if (!ALLOWED_CATEGORIAS.has(categoria)) {
    badRequest(`Categoria invalida: ${field}`);
  }
  return categoria;
};

const sanitizeSettingsPayload = (body) => {
  const payload = assertObjectBody(body, 'Payload de configuracion');
  ensureAllowedFields(payload, new Set(['locale', 'currency', 'theme']));

  const data = {};
  if (payload.locale) data.locale = readString(payload, 'locale', { maxLength: 10 });
  if (payload.currency) data.currency = readString(payload, 'currency', { maxLength: 5 });
  if (payload.theme) {
    data.theme = readString(payload, 'theme');
    if (!['light', 'dark'].includes(data.theme)) badRequest('Tema invalido');
  }
  return data;
};

// ... (Other sanitizers)

const signAuthToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const extractBearerToken = (authHeader) => {
  if (typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
};

const verifyAuthToken = (token) => {
  if (!token) unauthorized('Token requerido');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || typeof payload !== 'object') unauthorized('Token invalido');
    const userId = payload.sub;
    if (typeof userId !== 'string' || userId.length === 0) unauthorized('Token invalido');
    if (!mongoose.Types.ObjectId.isValid(userId)) unauthorized('Token invalido');
    return {
      userId,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    unauthorized('Token invalido o expirado');
  }
};

const requireAuth = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    next();
    return;
  }
  try {
    const token = extractBearerToken(req.headers.authorization);
    req.auth = verifyAuthToken(token);
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(401).json({ message: 'No autorizado' });
  }
};

// ... (Moved down to standard routes section)


const readPeriodo = (payload, field = 'periodo', options = {}) => {
  const { required = false } = options;
  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  const periodo = normalizeText(String(value)).toLowerCase();
  if (!ALLOWED_PERIODOS.has(periodo)) badRequest(`Periodo invalido: ${field}`);
  return periodo;
};

const readHexColor = (payload, field = 'color', options = {}) => {
  const { required = false } = options;
  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  if (typeof value !== 'string') badRequest(`Color invalido: ${field}`);
  const color = normalizeText(value);
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) badRequest(`Color invalido: ${field}`);
  return color.toLowerCase();
};

const readEmail = (value, field) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') badRequest(`Campo invalido: ${field}`);
  const email = normalizeText(value).toLowerCase();
  if (email.length === 0) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) badRequest(`Email invalido: ${field}`);
  return email;
};

const ensureObjectId = (id, field = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    badRequest(`Identificador invalido: ${field}`);
  }
};

const readPassword = (payload, field = 'password', options = {}) => {
  const { required = false } = options;
  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) badRequest(`Campo requerido: ${field}`);
    return undefined;
  }

  if (typeof value !== 'string') badRequest(`Campo invalido: ${field}`);
  const password = value.trim();
  if (password.length < 8 || password.length > 128) {
    badRequest(`Password invalido: ${field}`);
  }
  return password;
};

const toClientUser = (user) => {
  if (!user) return null;
  const raw = typeof user.toObject === 'function' ? user.toObject({ virtuals: true }) : user;
  return {
    id: raw.id ?? String(raw._id),
    nombre: raw.nombre,
    email: raw.email,
  };
};

// ... (Moved up)

const toUserRoom = (userId) => `user:${userId}`;

const extractSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim().length > 0) return authToken.trim();
  const bearerToken = extractBearerToken(socket.handshake.headers?.authorization);
  if (bearerToken) return bearerToken;
  return null;
};

const toCategoriaLabel = (categoria) => CATEGORIA_META[categoria]?.label ?? categoria;
const toCategoriaColor = (categoria) => CATEGORIA_META[categoria]?.color ?? '#94a3b8';

const deriveEstadoCompartido = (participantes) => {
  const todosPagaron = participantes.every((p) => p.pagado);
  if (todosPagaron) return 'saldado';
  const algunoPago = participantes.some((p) => p.pagado);
  return algunoPago ? 'parcial' : 'pendiente';
};

const sanitizeGastoPayload = (body, options = {}) => {
  const { partial = false } = options;
  const payload = assertObjectBody(body, 'Payload de gasto');
  ensureAllowedFields(
    payload,
    new Set([
      'descripcion',
      'monto',
      'fecha',
      'categoria',
      'categoriaLabel',
      'notas',
      'esRecurrente',
      'cuentaVence',
      'esCompartido',
      'cuentaId',
    ])
  );

  const data = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'descripcion')) {
    data.descripcion = readString(payload, 'descripcion', {
      required: !partial,
      minLength: 2,
      maxLength: 120,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'monto')) {
    data.monto = readNumber(payload, 'monto', {
      required: !partial,
      min: 0.01,
      allowZero: false,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'fecha')) {
    data.fecha = readDate(payload, 'fecha', { required: !partial });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'categoria')) {
    const categoria = readCategoria(payload, 'categoria', { required: !partial });
    data.categoria = categoria;
    data.categoriaLabel = toCategoriaLabel(categoria);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'notas')) {
    const notas = readString(payload, 'notas', { maxLength: 500, allowEmpty: true });
    data.notas = notas ?? '';
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'esRecurrente')) {
    const esRecurrente = readBoolean(payload, 'esRecurrente', { required: !partial });
    data.esRecurrente = esRecurrente ?? false;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'cuentaVence')) {
    const cuentaVence = readDate(payload, 'cuentaVence', { allowEmpty: true });
    data.cuentaVence = cuentaVence ?? '';
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'esCompartido')) {
    const esCompartido = readBoolean(payload, 'esCompartido', { required: !partial });
    data.esCompartido = esCompartido ?? false;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'cuentaId')) {
    const cuentaId = payload.cuentaId;
    if (cuentaId) {
      ensureObjectId(cuentaId, 'cuentaId');
      data.cuentaId = cuentaId;
    } else {
      data.cuentaId = null;
    }
  }

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  if (partial && Object.keys(cleanData).length === 0) {
    badRequest('No hay campos validos para actualizar el gasto');
  }
  return cleanData;
};

const sanitizeCuentaPayload = (body, options = {}) => {
  const { partial = false } = options;
  const payload = assertObjectBody(body, 'Payload de cuenta');
  ensureAllowedFields(
    payload,
    new Set(['nombre', 'tipo', 'saldoInicial', 'color'])
  );

  const data = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'nombre')) {
    data.nombre = readString(payload, 'nombre', { required: !partial, minLength: 2, maxLength: 80 });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'tipo')) {
    data.tipo = readString(payload, 'tipo', { required: !partial });
    if (!['efectivo', 'banco', 'tarjeta', 'otro'].includes(data.tipo)) {
      badRequest('Tipo de cuenta invalido');
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'saldoInicial')) {
    data.saldoInicial = readNumber(payload, 'saldoInicial', { required: !partial, allowZero: true });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'color')) {
    data.color = readHexColor(payload, 'color') ?? '#94a3b8';
  }

  return data;
};

const sanitizeParticipantes = (rawParticipantes, montoTotal) => {
  if (!Array.isArray(rawParticipantes) || rawParticipantes.length === 0) {
    badRequest('Debe incluir al menos un participante');
  }

  const seenNames = new Set();
  const participantes = rawParticipantes.map((item, index) => {
    const participante = assertObjectBody(item, `Participante ${index + 1}`);
    const nombre = readString(participante, 'nombre', { required: true, minLength: 2, maxLength: 80 });
    const normalizedName = nombre.toLowerCase();
    if (seenNames.has(normalizedName)) {
      badRequest(`Participante repetido: ${nombre}`);
    }
    seenNames.add(normalizedName);

    const monto = readNumber(participante, 'monto', {
      required: true,
      min: 0.01,
      allowZero: false,
    });
    const pagado = readBoolean(participante, 'pagado') ?? false;
    const pagadoEn = pagado
      ? (readDate(participante, 'pagadoEn', { allowEmpty: true }) || new Date().toISOString())
      : '';
    const email = readEmail(participante.email, `participantes[${index}].email`);

    return {
      nombre,
      email,
      monto,
      pagado,
      pagadoEn,
    };
  });

  const sumaParticipantes = participantes.reduce((acc, participante) => acc + participante.monto, 0);
  if (Math.abs(sumaParticipantes - montoTotal) > EPSILON) {
    badRequest('La suma de participantes debe coincidir con el monto total');
  }

  return participantes;
};

const sanitizeCompartidoPayload = (body) => {
  const payload = assertObjectBody(body, 'Payload de gasto compartido');
  ensureAllowedFields(
    payload,
    new Set([
      'descripcion',
      'montoTotal',
      'fecha',
      'categoria',
      'pagadoPor',
      'participantes',
      'notas',
      'estado',
    ])
  );

  const descripcion = readString(payload, 'descripcion', {
    required: true,
    minLength: 2,
    maxLength: 120,
  });
  const montoTotal = readNumber(payload, 'montoTotal', {
    required: true,
    min: 0.01,
    allowZero: false,
  });
  const fecha = readDate(payload, 'fecha', { required: true });
  const categoria = readCategoria(payload, 'categoria', { required: true });
  const pagadoPor = readString(payload, 'pagadoPor', {
    required: true,
    minLength: 2,
    maxLength: 80,
  });
  const notas = readString(payload, 'notas', { maxLength: 500, allowEmpty: true }) ?? '';
  const participantes = sanitizeParticipantes(payload.participantes, montoTotal);

  return {
    descripcion,
    montoTotal,
    fecha,
    categoria,
    pagadoPor,
    notas,
    participantes,
    estado: deriveEstadoCompartido(participantes),
  };
};

const sanitizeParticipantePagoPayload = (body) => {
  const payload = assertObjectBody(body, 'Payload de pago');
  ensureAllowedFields(payload, new Set(['participante']));
  return readString(payload, 'participante', {
    required: true,
    minLength: 2,
    maxLength: 80,
  });
};

const sanitizePresupuestoPayload = (body, options = {}) => {
  const { partial = false } = options;
  const payload = assertObjectBody(body, 'Payload de presupuesto');
  ensureAllowedFields(
    payload,
    new Set([
      'categoria',
      'categoriaLabel',
      'montoLimite',
      'montoGastado',
      'periodo',
      'alertaUmbral',
      'color',
    ])
  );

  const data = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'categoria')) {
    const categoria = readCategoria(payload, 'categoria', { required: !partial });
    data.categoria = categoria;
    data.categoriaLabel = toCategoriaLabel(categoria);
    if (!Object.prototype.hasOwnProperty.call(payload, 'color')) {
      data.color = toCategoriaColor(categoria);
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'montoLimite')) {
    data.montoLimite = readNumber(payload, 'montoLimite', {
      required: !partial,
      min: 0.01,
      allowZero: false,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'periodo')) {
    data.periodo = readPeriodo(payload, 'periodo', { required: !partial }) ?? 'mensual';
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'alertaUmbral')) {
    data.alertaUmbral = readNumber(payload, 'alertaUmbral', {
      required: !partial,
      min: 1,
      max: 100,
      allowZero: false,
    });
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'color')) {
    const explicitColor = readHexColor(payload, 'color');
    if (explicitColor) data.color = explicitColor;
  }

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  if (partial && Object.keys(cleanData).length === 0) {
    badRequest('No hay campos validos para actualizar el presupuesto');
  }
  return cleanData;
};

const getSpentForCategoria = async (categoria, userId) => {
  const normalized = normalizeCategoria(categoria);
  if (!normalized) return 0;

  const [result] = await Gasto.aggregate([
    { $match: { categoria: normalized, userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$monto' } } },
  ]);
  return result?.total ?? 0;
};

const syncPresupuestoSpentForCategorias = async (userId, categorias) => {
  const targets = Array.from(
    new Set((categorias ?? []).map(normalizeCategoria).filter(Boolean))
  );
  if (targets.length === 0) return;

  await Promise.all(
    targets.map(async (categoria) => {
      const montoGastado = await getSpentForCategoria(categoria, userId);
      await Presupuesto.updateMany({ userId, categoria }, { $set: { montoGastado } });
    })
  );
};

const syncPresupuestoSpentForAll = async (userId) => {
  const categorias = await Presupuesto.distinct('categoria', { userId });
  await syncPresupuestoSpentForCategorias(userId, categorias);
};

const syncCuentaBalance = async (userId, cuentaId) => {
  if (!cuentaId) return;
  const cuenta = await Cuenta.findOne({ _id: cuentaId, userId });
  if (!cuenta) return;

  const [result] = await Gasto.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), cuentaId: new mongoose.Types.ObjectId(cuentaId) } },
    { $group: { _id: null, total: { $sum: '$monto' } } },
  ]);

  const saldoActual = (cuenta.saldoInicial || 0) - (result?.total || 0);
  await Cuenta.updateOne({ _id: cuentaId }, { $set: { saldoActual } });
};

const toClientDoc = (doc) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : doc;
  return { ...raw, id: raw.id ?? String(raw._id) };
};

const toClientList = (docs) => docs.map(toClientDoc);

const asyncRoute = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    res.status(500).json({ message });
  }
};

// --- Routes: Auth ---
app.post(
  '/api/auth/register',
  asyncRoute(async (req, res) => {
    const payload = assertObjectBody(req.body, 'Payload de registro');
    ensureAllowedFields(payload, new Set(['nombre', 'email', 'password']));

    const nombre = readString(payload, 'nombre', {
      required: true,
      minLength: 2,
      maxLength: 80,
    });
    const email = readEmail(payload.email, 'email');
    const password = readPassword(payload, 'password', { required: true });

    if (!email) badRequest('Campo requerido: email');

    const existing = await User.findOne({ email }).lean();
    if (existing) conflict('El email ya esta registrado');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ nombre, email, passwordHash });
    const token = signAuthToken(user);

    res.status(201).json({
      data: {
        token,
        user: toClientUser(user),
      },
    });
  })
);

app.post(
  '/api/auth/login',
  asyncRoute(async (req, res) => {
    const payload = assertObjectBody(req.body, 'Payload de login');
    ensureAllowedFields(payload, new Set(['email', 'password']));

    const email = readEmail(payload.email, 'email');
    const password = readPassword(payload, 'password', { required: true });

    if (!email) badRequest('Campo requerido: email');

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) unauthorized('Credenciales invalidas');

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) unauthorized('Credenciales invalidas');

    const token = signAuthToken(user);

    res.json({
      data: {
        token,
        user: toClientUser(user),
        settings: user.settings,
      },
    });
  })
);

app.get(
  '/api/auth/me',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.auth.userId);
    if (!user) unauthorized('Sesion invalida');
    res.json({ data: { user: toClientUser(user), settings: user.settings } });
  })
);

// --- Routes: Settings ---
app.get(
  '/api/user/settings',
  requireAuth,
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.auth.userId);
    if (!user) badRequest('Usuario no encontrado');
    res.json({ data: user.settings || {} });
  })
);

app.patch(
  '/api/user/settings',
  requireAuth,
  asyncRoute(async (req, res) => {
    const data = sanitizeSettingsPayload(req.body);
    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      { $set: { settings: data } },
      { new: true }
    );
    logger.info('Configuracion actualizada', { userId: req.auth.userId, settings: data });
    res.json({ data: user.settings });
  })
);

app.use('/api', requireAuth);

// --- Routes: Gastos ---
app.get(
  '/api/gastos',
  asyncRoute(async (req, res) => {
    const data = await Gasto.find({ userId: req.auth.userId }).sort({ fecha: -1 });
    res.json({ data: toClientList(data) });
  })
);

app.post(
  '/api/gastos',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    const payload = sanitizeGastoPayload(req.body);
    const gasto = await Gasto.create({ ...payload, userId });
    await syncPresupuestoSpentForCategorias(userId, [gasto.categoria]);
    await syncCuentaBalance(userId, gasto.cuentaId);
    res.json({ data: toClientDoc(gasto) });
  })
);

app.put(
  '/api/gastos/:id',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    ensureObjectId(req.params.id, 'id');
    const existing = await Gasto.findOne({ _id: req.params.id, userId });
    if (!existing) {
      res.status(404).json({ message: 'No encontrado' });
      return;
    }

    const updates = sanitizeGastoPayload(req.body, { partial: true });
    const categoriaAnterior = existing.categoria;
    const cuentaIdAnterior = existing.cuentaId;
    Object.assign(existing, updates);
    const gasto = await existing.save();
    await syncPresupuestoSpentForCategorias(userId, [categoriaAnterior, gasto.categoria]);
    await syncCuentaBalance(userId, cuentaIdAnterior);
    if (String(cuentaIdAnterior) !== String(gasto.cuentaId)) {
      await syncCuentaBalance(userId, gasto.cuentaId);
    }

    res.json({ data: toClientDoc(gasto) });
  })
);

app.delete(
  '/api/gastos/:id',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    ensureObjectId(req.params.id, 'id');
    const deleted = await Gasto.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      res.status(404).json({ message: 'No encontrado' });
      return;
    }
    await syncPresupuestoSpentForCategorias(userId, [deleted.categoria]);
    await syncCuentaBalance(userId, deleted.cuentaId);
    res.json({ message: 'Eliminado' });
  })
);

// --- Routes: Gastos Compartidos ---
app.get(
  '/api/compartidos',
  asyncRoute(async (req, res) => {
    const data = await GastoCompartido.find({ userId: req.auth.userId }).sort({ fecha: -1 });
    res.json({ data: toClientList(data) });
  })
);

app.post(
  '/api/compartidos',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    const sharedInput = sanitizeCompartidoPayload(req.body);
    const gasto = await GastoCompartido.create({ ...sharedInput, userId });
    const payload = toClientDoc(gasto);
    io.to(toUserRoom(userId)).emit('gasto_compartido:nuevo', payload);
    res.json({ data: payload });
  })
);

app.post(
  '/api/compartidos/:id/pagar',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    ensureObjectId(req.params.id, 'id');
    const participante = sanitizeParticipantePagoPayload(req.body);
    const participanteSearch = participante.toLowerCase();
    const gasto = await GastoCompartido.findOne({ _id: req.params.id, userId });
    if (!gasto) {
      res.status(404).json({ message: 'No encontrado' });
      return;
    }

    let participantFound = false;
    gasto.participantes = gasto.participantes.map((p) => {
      if (normalizeText(p.nombre).toLowerCase() === participanteSearch) {
        participantFound = true;
        return {
          ...p.toObject(),
          pagado: true,
          pagadoEn: new Date().toISOString(),
        };
      }
      return p;
    });

    if (!participantFound) {
      badRequest('Participante no encontrado en el gasto compartido');
    }

    gasto.estado = deriveEstadoCompartido(gasto.participantes);
    await gasto.save();

    const payload = toClientDoc(gasto);
    io.to(toUserRoom(userId)).emit('gasto_compartido:participante_pagado', {
      gastoId: payload.id,
      participanteNombre: participante,
    });
    io.to(toUserRoom(userId)).emit('gasto_compartido:actualizado', payload);
    res.json({ data: payload });
  })
);

// --- Routes: Presupuestos ---
app.get(
  '/api/presupuestos',
  asyncRoute(async (req, res) => {
    const data = await Presupuesto.find({ userId: req.auth.userId });
    res.json({ data: toClientList(data) });
  })
);

app.post(
  '/api/presupuestos',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    const payload = sanitizePresupuestoPayload(req.body);
    const categoria = payload.categoria;
    const montoGastado = await getSpentForCategoria(categoria, userId);
    const presupuesto = await Presupuesto.create({
      ...payload,
      userId,
      categoria,
      montoGastado,
    });
    res.json({ data: toClientDoc(presupuesto) });
  })
);

app.put(
  '/api/presupuestos/:id',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    ensureObjectId(req.params.id, 'id');
    const existing = await Presupuesto.findOne({ _id: req.params.id, userId });
    if (!existing) {
      res.status(404).json({ message: 'No encontrado' });
      return;
    }

    const updates = sanitizePresupuestoPayload(req.body, { partial: true });
    const categoriaAnterior = existing.categoria;
    Object.assign(existing, updates);
    existing.categoria = normalizeCategoria(existing.categoria);
    if (!ALLOWED_CATEGORIAS.has(existing.categoria)) {
      badRequest('Categoria invalida en presupuesto');
    }
    existing.categoriaLabel = toCategoriaLabel(existing.categoria);
    existing.color = updates.color ?? existing.color ?? toCategoriaColor(existing.categoria);
    existing.montoGastado = await getSpentForCategoria(existing.categoria, userId);
    const presupuesto = await existing.save();
    await syncPresupuestoSpentForCategorias(userId, [categoriaAnterior, presupuesto.categoria]);

    res.json({ data: toClientDoc(presupuesto) });
  })
);

app.delete(
  '/api/presupuestos/:id',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    ensureObjectId(req.params.id, 'id');
    const deleted = await Presupuesto.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      res.status(404).json({ message: 'No encontrado' });
      return;
    }
    res.json({ message: 'Eliminado' });
  })
);

// --- Routes: Cuentas ---
app.get(
  '/api/cuentas',
  asyncRoute(async (req, res) => {
    const data = await Cuenta.find({ userId: req.auth.userId });
    res.json({ data: toClientList(data) });
  })
);

app.post(
  '/api/cuentas',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    const payload = sanitizeCuentaPayload(req.body);
    const cuenta = await Cuenta.create({
      ...payload,
      userId,
      saldoActual: payload.saldoInicial,
    });
    res.json({ data: toClientDoc(cuenta) });
  })
);

app.put(
  '/api/cuentas/:id',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    ensureObjectId(req.params.id, 'id');
    const existing = await Cuenta.findOne({ _id: req.params.id, userId });
    if (!existing) {
      res.status(404).json({ message: 'No encontrado' });
      return;
    }

    const updates = sanitizeCuentaPayload(req.body, { partial: true });
    Object.assign(existing, updates);
    await existing.save();
    await syncCuentaBalance(userId, existing._id);

    res.json({ data: toClientDoc(existing) });
  })
);

app.delete(
  '/api/cuentas/:id',
  asyncRoute(async (req, res) => {
    const userId = req.auth.userId;
    ensureObjectId(req.params.id, 'id');
    const deleted = await Cuenta.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      res.status(404).json({ message: 'No encontrado' });
      return;
    }
    // Desvincular gastos
    await Gasto.updateMany({ userId, cuentaId: deleted._id }, { $set: { cuentaId: null } });
    res.json({ message: 'Eliminado' });
  })
);

// --- Routes: Reportes ---
app.get(
  '/api/reportes/tendencia',
  asyncRoute(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.auth.userId);
    const monthsLimit = parsePositiveInt(req.query.months, 12);

    // Agregación para obtener gastos por mes
    const gastosPorMes = await Gasto.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $substr: ['$fecha', 0, 7] }, // YYYY-MM
          totalGastado: { $sum: '$monto' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Obtener snapshot de presupuestos para la línea de referencia
    const presupuestos = await Presupuesto.find({ userId });
    const monthlyBudget = presupuestos.reduce((total, p) => {
      if (p.periodo === 'semanal') return total + p.montoLimite * 4.345;
      if (p.periodo === 'anual') return total + p.montoLimite / 12;
      return total + p.montoLimite;
    }, 0);

    // Generar lista final (últimos N meses)
    const result = gastosPorMes.slice(-monthsLimit).map((item) => ({
      mes: item._id,
      Gastos: item.totalGastado,
      Presupuesto: monthlyBudget,
    }));

    res.json({ data: result });
  })
);

app.use((err, _req, res, next) => {
  if (!err) {
    next();
    return;
  }

  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  if (message === 'Origen no permitido por CORS') {
    res.status(403).json({ message });
    return;
  }

  res.status(500).json({ message });
});

// --- Socket.io ---
io.use((socket, next) => {
  try {
    const token = extractSocketToken(socket);
    socket.data.auth = verifyAuthToken(token);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No autorizado';
    next(new Error(message));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.auth?.userId;
  if (!userId) {
    socket.disconnect(true);
    return;
  }
  socket.join(toUserRoom(userId));
  console.log(`[Socket] Cliente conectado: ${socket.id} (user: ${userId})`);
  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
  });
});

const syncPresupuestosOnBoot = async () => {
  try {
    const userIds = await Presupuesto.distinct('userId');
    await Promise.all(userIds.map((userId) => syncPresupuestoSpentForAll(String(userId))));
    console.log('[DB] Presupuestos sincronizados');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[DB] Error sincronizando presupuestos:', msg);
  }
};

const connectDatabase = async (mongoUri = MONGO) => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(mongoUri);
  return mongoose.connection;
};

const disconnectDatabase = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
};

const listenServer = async (port = PORT) => {
  if (server.listening) return server;
  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('error', onError);
      reject(error);
    };
    server.once('error', onError);
    server.listen(port, () => {
      server.off('error', onError);
      resolve();
    });
  });
  return server;
};

const closeServer = async () => {
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

const closeSocketServer = async () =>
  new Promise((resolve) => {
    io.close(() => resolve());
  });

const startServer = async (options = {}) => {
  const {
    mongoUri = MONGO,
    port = PORT,
    continueOnDbError = true,
  } = options;

  let dbConnected = false;
  try {
    await connectDatabase(mongoUri);
    dbConnected = true;
    console.log('[DB] MongoDB conectado');
    await syncPresupuestosOnBoot();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[DB] Error conectando MongoDB:', msg);
    if (!continueOnDbError) throw err;
  }

  await listenServer(port);
  console.log(
    `[Server] Corriendo${dbConnected ? '' : ' sin DB'} en http://localhost:${port}`
  );
  return server;
};

const stopServer = async (options = {}) => {
  const { disconnectDb = true } = options;
  await closeSocketServer();
  await closeServer();
  if (disconnectDb) {
    await disconnectDatabase();
  }
};

module.exports = {
  app,
  server,
  io,
  models: {
    User,
    Gasto,
    GastoCompartido,
    Presupuesto,
  },
  connectDatabase,
  disconnectDatabase,
  startServer,
  stopServer,
};

if (require.main === module) {
  startServer().catch((error) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Server] Error fatal al iniciar:', msg);
    process.exit(1);
  });
}
