import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';

const originalFetch = globalThis.fetch;

const clearStorageSafely = (storage: Storage | undefined): void => {
  storage?.clear();
};

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
  clearStorageSafely(globalThis.localStorage);
  clearStorageSafely(globalThis.sessionStorage);
});
