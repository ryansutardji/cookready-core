# App Directory — Expo Router Screens

## Project Conventions
- Screens query Supabase directly — no API layer or server actions.
- Use `useFocusEffect` (from `@react-navigation/native`) to re-fetch data when a screen regains focus.
- `router.replace()` for auth/onboarding redirects — not `router.push()`.
- `useSafeAreaInsets()` and `useBottomTabBarHeight()` used throughout for layout padding.
