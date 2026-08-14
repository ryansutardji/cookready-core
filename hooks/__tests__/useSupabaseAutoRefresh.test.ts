// hooks/useSupabaseAutoRefresh.ts imports the real Supabase client, which
// throws during construction unless EXPO_PUBLIC_SUPABASE_URL /
// EXPO_PUBLIC_SUPABASE_ANON_KEY are set. Those env vars aren't loaded in the
// Jest environment, so we mock the module boundary via the manual mock at
// lib/__mocks__/supabase.ts.
jest.mock('@/lib/supabase');

import { AppState, type AppStateStatus } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import * as mockedSupabaseModule from '@/lib/supabase';
import { useSupabaseAutoRefresh } from '../useSupabaseAutoRefresh';

// `jest.mock('@/lib/supabase')` (no factory) redirects every import of
// '@/lib/supabase' to the manual mock at lib/__mocks__/supabase.ts. Importing
// the mock's helpers from '@/lib/__mocks__/supabase' directly would instead
// evaluate that file as a *second*, unrelated module instance (a different
// module id), producing jest.fn()s that the hook's `supabase.auth.*` calls
// never touch. Casting the mocked '@/lib/supabase' import to the mock file's
// real shape (a type-only operation, erased at compile time — no second
// module evaluation) gives us the exact mock instances the hook actually uses.
const { mockAuthStartAutoRefresh, mockAuthStopAutoRefresh } =
  mockedSupabaseModule as unknown as typeof import('@/lib/__mocks__/supabase');

// AppState has no precedent for mocking elsewhere in this codebase.
// `addEventListener` is spied on so we can capture the 'change' callback the
// hook registers and invoke it manually to simulate foreground/background
// transitions, without relying on a real native AppState bridge.
function mockAppState(initialState: AppStateStatus) {
  (AppState as { currentState: AppStateStatus }).currentState = initialState;

  const remove = jest.fn();
  let changeListener: ((state: AppStateStatus) => void) | undefined;

  const addEventListenerSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((event, listener) => {
      if (event === 'change') {
        changeListener = listener as (state: AppStateStatus) => void;
      }
      return { remove } as ReturnType<typeof AppState.addEventListener>;
    });

  return {
    addEventListenerSpy,
    remove,
    fireChange: (state: AppStateStatus) => {
      (AppState as { currentState: AppStateStatus }).currentState = state;
      changeListener?.(state);
    },
  };
}

afterEach(() => {
  jest.restoreAllMocks();
  mockAuthStartAutoRefresh.mockClear();
  mockAuthStopAutoRefresh.mockClear();
});

describe('useSupabaseAutoRefresh', () => {
  it('starts auto refresh on mount when the app is already active', () => {
    mockAppState('active');

    renderHook(() => useSupabaseAutoRefresh());

    expect(mockAuthStartAutoRefresh).toHaveBeenCalledTimes(1);
    expect(mockAuthStopAutoRefresh).not.toHaveBeenCalled();
  });

  it('does not start auto refresh on mount when the app is not active', () => {
    mockAppState('background');

    renderHook(() => useSupabaseAutoRefresh());

    expect(mockAuthStartAutoRefresh).not.toHaveBeenCalled();
  });

  it('stops auto refresh when the app transitions to the background', () => {
    const { fireChange } = mockAppState('active');

    renderHook(() => useSupabaseAutoRefresh());
    mockAuthStartAutoRefresh.mockClear();

    fireChange('background');

    expect(mockAuthStopAutoRefresh).toHaveBeenCalledTimes(1);
    expect(mockAuthStartAutoRefresh).not.toHaveBeenCalled();
  });

  it('starts auto refresh again when the app returns to active', () => {
    const { fireChange } = mockAppState('active');

    renderHook(() => useSupabaseAutoRefresh());
    mockAuthStartAutoRefresh.mockClear();

    fireChange('background');
    mockAuthStopAutoRefresh.mockClear();
    fireChange('active');

    expect(mockAuthStartAutoRefresh).toHaveBeenCalledTimes(1);
  });

  it('removes the AppState subscription on unmount', () => {
    const { remove } = mockAppState('active');

    const { unmount } = renderHook(() => useSupabaseAutoRefresh());
    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
