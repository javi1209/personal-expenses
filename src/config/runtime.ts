const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const readEnv = (value: string | undefined): string | null => {
  if (!value) return null;
  const normalized = trimTrailingSlash(value.trim());
  return normalized.length > 0 ? normalized : null;
};

const apiOrigin = readEnv(import.meta.env.VITE_API_URL);
const explicitApiBase = readEnv(import.meta.env.VITE_API_BASE_URL);

const derivedSocketFromApiBase =
  explicitApiBase && /^https?:\/\//i.test(explicitApiBase)
    ? explicitApiBase.replace(/\/api$/i, '')
    : null;

export const API_BASE_URL = explicitApiBase ?? (apiOrigin ? `${apiOrigin}/api` : '/api');

export const SOCKET_URL =
  readEnv(import.meta.env.VITE_SOCKET_URL) ??
  apiOrigin ??
  derivedSocketFromApiBase ??
  '/';
