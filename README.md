# Izon Beeli Mobile 📱

A React Native mobile application for language learning, built with Expo. Learn the Izon language through interactive lessons, audio exercises, and daily progress tracking.

## Features

- **Authentication**: Secure sign-in and sign-up with Clerk
- **Interactive Lessons**: Learn vocabulary with audio pronunciation and interactive transcripts
- **Audio Player**: High-quality audio playback with lesson content
- **Progress Tracking**: Monitor your learning progress over time
- **Daily Feed**: Stay motivated with daily learning content and contributions
- **Journal**: Keep track of your learning journey
- **Language Selection**: Support for multiple languages
- **Contribution System**: Contribute to the language learning community

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Styling**: Tailwind CSS with NativeWind
- **Authentication**: Clerk
- **Data Fetching**: TanStack React Query
- **Audio**: Expo AV

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create a `.env.local` file with the required environment variables:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
   CLERK_SECRET_KEY=your_secret_here
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

   Then select an option to open the app:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web
   - Press `e` to exit

## Project Structure

```
app/                    # App screens and layouts
├── (auth)/             # Authentication screens
├── (tabs)/             # Tab-based navigation
└── lesson/             # Lesson details screen
components/             # Reusable components
├── audio/              # Audio player and transcript
└── ui/                 # UI components
lib/                    # Utility libraries
├── api.ts              # API client
├── auth.ts             # Authentication helpers
└── ...
store/                  # Zustand stores
types/                  # TypeScript type definitions
public/                 # Assets and audio files
```

## Available Scripts

- `npm start` - Start development server
- `npm run android` - Open Android emulator
- `npm run ios` - Open iOS simulator
- `npm run web` - Open in web browser
- `npm run lint` - Run ESLint

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Clerk Authentication](https://clerk.com/docs)
- [NativeWind Documentation](https://www.nativewind.dev/)
