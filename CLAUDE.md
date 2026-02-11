# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Izon Beeli is a React Native/Expo (SDK 54) mobile learning platform with tabs for learning, listening to audio lessons, journaling, community feed, and user profile. It targets iOS, Android, and web.

## Development Commands

```bash
npx expo start           # Start Expo dev server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in browser
npm run lint             # ESLint check
```

## Architecture

### Routing (Expo Router v6 — file-based)
- `app/index.tsx` — Auth guard: redirects to `/(tabs)/learn` if signed in, `/(auth)/sign-in` if not
- `app/(auth)/` — Sign-in and sign-up screens using Clerk
- `app/(tabs)/` — Bottom tab navigation: learn, listen, journal, feed, profile
- `app/lesson/[id].tsx` — Dynamic lesson detail route

### Authentication (Clerk)
- `ClerkProvider` wraps the app in `app/_layout.tsx` with token caching via `expo-secure-store`
- Auth helpers in `lib/auth.ts` — platform-aware (skips secure store on web)
- Requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` env var

### Data Fetching (React Query)
- Query client configured in `lib/api.ts` (5min stale time, 2 retries)
- Generic `apiFetch<T>()` helper injects Clerk auth tokens
- API base URL from `EXPO_PUBLIC_API_URL` env var via `lib/constants.ts`

### State Management (Zustand)
- `store/audio-store.ts` — Audio playback state (play, pause, progress, duration)
- Access via `useAudioStore()` hook

### Styling (NativeWind + Tailwind CSS v3)
- Use `className` prop with Tailwind classes on React Native components
- Dark mode via React Navigation's `ThemeProvider` with system preference detection
- Theme colors defined in `constants/theme.ts`
- Tailwind config in `tailwind.config.ts`, directives in `global.css`

### Platform-Specific Code
- Use `.ios.tsx` and `.web.tsx` file extensions for platform overrides
- `components/ui/icon-symbol.tsx` (Material Icons for Android/Web) vs `icon-symbol.ios.tsx` (SF Symbols)
- Haptic feedback on iOS via `components/haptic-tab.tsx`

## Key Configuration

- **TypeScript strict mode** enabled; path alias `@/*` maps to project root
- **React Compiler** and **New Architecture** both enabled in `app.json`
- **Typed routes** enabled for Expo Router
- Babel: `babel-preset-expo` + `nativewind/babel` plugin
- Metro: wrapped with `withNativeWind` using `global.css`

## Type Definitions

Shared types in `types/index.ts`: `Lesson`, `JournalEntry`, `FeedItem`, `UserProfile`.

## Environment Variables

Required:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk authentication
- `EXPO_PUBLIC_API_URL` — Backend API base URL
