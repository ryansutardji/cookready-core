// Global Jest setup — runs after the test framework is installed in each suite.
//
// @testing-library/react-native v12.4+ automatically extends Jest's `expect` with
// RNTL matchers (toBeVisible, toHaveTextContent, toBeDisabled, etc.) the moment
// any test imports from '@testing-library/react-native'. No manual extend-expect
// call is needed.
//
// Add global mock setup here that every test file should inherit, for example:
//   jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

// The mock module ships as a default export (`export default {...}`), so a
// bare `require(...)` here would return `{ default: {...} }` with no
// top-level `SafeAreaView`/etc — breaking every component that does
// `import { SafeAreaView } from 'react-native-safe-area-context'` (they'd
// receive `undefined`). Unwrap `.default` so named exports resolve correctly.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, []),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  ...jest.requireActual('@react-navigation/bottom-tabs'),
  useBottomTabBarHeight: () => 0,
}));
