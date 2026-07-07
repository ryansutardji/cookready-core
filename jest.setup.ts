// Global Jest setup — runs after the test framework is installed in each suite.
//
// @testing-library/react-native v12.4+ automatically extends Jest's `expect` with
// RNTL matchers (toBeVisible, toHaveTextContent, toBeDisabled, etc.) the moment
// any test imports from '@testing-library/react-native'. No manual extend-expect
// call is needed.
//
// Add global mock setup here that every test file should inherit, for example:
//   jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
