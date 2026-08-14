// lib/secure-store-adapter.ts branches on `Platform.OS` at *module load
// time* (the `authStorage` export is a `const` computed once, not
// recomputed per call). To exercise both the native and web branches we
// have to force a fresh module evaluation with a different `Platform.OS`
// for each case: `jest.resetModules()` + re-require after mocking
// `react-native`'s `Platform.OS`.
//
// `expo-secure-store` is auto-mocked (no factory) so every exported function
// becomes a jest.fn(). Because we `require('expo-secure-store')` ourselves
// immediately before requiring the adapter — within the same resetModules
// "epoch" — Jest's module cache guarantees we get the exact same mock
// instance the adapter's internal `import * as SecureStore` resolves to.
jest.mock('expo-secure-store');

type SecureStoreMock = {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

function loadAdapter(os: 'ios' | 'android' | 'web') {
  jest.resetModules();

  // `react-native`'s index.js lazily requires this exact submodule (as a
  // getter) to produce its `Platform` export. Mocking it directly — instead
  // of mocking the whole `react-native` package — lets the rest of
  // react-native's index load normally (avoiding TurboModule lookups like
  // `DevMenu` that only resolve inside jest-expo's own patched module
  // registration, which a `jest.requireActual('react-native')` bypasses).
  jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
    __esModule: true,
    default: { OS: os, select: (obj: Record<string, unknown>) => obj[os] },
  }));

  const SecureStore = require('expo-secure-store') as SecureStoreMock;
  const { authStorage } = require('../secure-store-adapter') as
    typeof import('../secure-store-adapter');

  return { SecureStore, authStorage };
}

afterEach(() => {
  jest.dontMock('react-native/Libraries/Utilities/Platform');
  jest.resetModules();
});

describe('authStorage on a native platform', () => {
  it.each(['ios', 'android'] as const)(
    'delegates getItem to SecureStore.getItemAsync on %s',
    async (os) => {
      const { SecureStore, authStorage } = loadAdapter(os);
      SecureStore.getItemAsync.mockResolvedValueOnce('stored-value');

      const value = await authStorage?.getItem('session-key');

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('session-key');
      expect(value).toBe('stored-value');
    }
  );

  it.each(['ios', 'android'] as const)(
    'delegates setItem to SecureStore.setItemAsync on %s',
    async (os) => {
      const { SecureStore, authStorage } = loadAdapter(os);

      await authStorage?.setItem('session-key', 'session-value');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'session-key',
        'session-value'
      );
    }
  );

  it.each(['ios', 'android'] as const)(
    'delegates removeItem to SecureStore.deleteItemAsync on %s',
    async (os) => {
      const { SecureStore, authStorage } = loadAdapter(os);

      await authStorage?.removeItem('session-key');

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session-key');
    }
  );
});

describe('authStorage on web', () => {
  it('is undefined so supabase-js falls back to its default storage', () => {
    const { authStorage } = loadAdapter('web');

    expect(authStorage).toBeUndefined();
  });
});
