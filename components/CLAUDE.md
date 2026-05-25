# Components — React Native Primitives

## No UI Library
- No shadcn, Radix, or similar — React Native primitives only.
- Icons: `lucide-react-native` only.

## Styling
- Mix `StyleSheet.create()` (layouts, shadows) with NativeWind `className` (flex, color, spacing) — both are used.
- Custom color palette: terracotta, sage, cream, stone, espresso — defined in `tailwind.config.js`.
- Fonts: `NotoSerif_700Bold` for headings, `Inter_400Regular` for body via `fontFamily` in StyleSheet.

## State
- No global state library — local `useState` only throughout.
- Async UI states: explicit `'idle' | 'loading' | 'success' | 'error'` string literals.
