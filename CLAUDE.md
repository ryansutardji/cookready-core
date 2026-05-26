# CookReady Core — Claude Guidelines

## Subagents

**ALWAYS check this list before starting any task. Deploy the matching specialist agent — do not attempt the work inline. ALWAYS include the agents you plan to deploy for each task/part of your plan, or mention none will be dployed**

| Agent | Deploy when the task involves… |
|---|---|
| `supabase-expert` | Schema changes, tables/columns, RLS policies, migrations, Edge Functions, Auth config, Storage, Realtime, or any SQL |
| `supabase-mobile-client` | Client-side Supabase: auth session, AsyncStorage, typed client config, Edge Function calls from the app, SDK usage in RN |
| `react-native-ui` | Screens/components, NativeWind styling, Expo Router navigation, Reanimated/Gesture Handler, any visual/interactive UI |
| `state-architect` | State management, data fetching, custom hooks, Context refactors, loading/error states, caching, cross-screen data |
| `react-native-testing` | Jest setup, unit/integration/snapshot tests, Maestro E2E, Supabase mocking |
| `app-performance` | Performance audits, jank, slow transitions, FlatList optimization, re-renders, launch time, memory leaks |

### Multi-agent tasks

Tasks spanning domains — deploy in sequence:
- New screen with data fetching → `react-native-ui` + `state-architect`
- New Supabase table used in the app → `supabase-expert` + `supabase-mobile-client`
- Feature touching DB and UI → `supabase-expert` → `react-native-ui` → `state-architect`
