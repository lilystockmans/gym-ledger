# Gym Ledger

A calisthenics tracker for Android that plans the week, logs every set, and tells you when to move up or when you are stuck.

## What it does

- **Plan** the week: place Full Body A, B or C on days. The app opens on today's workout.
- **Log per set**: every set starts with last time's numbers. One tap per set when nothing changed.
- **Signals**: "Ready to move up" after two sessions at target. "Stuck" after 14 days with no rep gain, with a concrete next step.
- **Period-aware**: on the first days of a period the app plans one set fewer and shows a take-it-easy note. You can always override it.
- **Rest timer** that vibrates, plus warm-up and cool-down checklists.
- **Export** one JSON file as backup and as input for a coaching tool.

Everything works offline. Your data stays on your phone. There is no account and no server.

## Stack

Expo SDK 54, React Native, expo-router, expo-sqlite, zustand, react-native-svg. Free tools only.

## Build the APK

Needs JDK 17 and the Android SDK (`~/Library/Android/sdk`).

```bash
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
cd android && ./gradlew assembleRelease
```

The APK is at `android/app/build/outputs/apk/release/app-release.apk`. Do not run `./gradlew clean`.

## Preview in a browser

```bash
npx expo start --web
```

The web preview uses an in-memory store with example data.

## Personal data

`seed/personal.json` holds personal history and dates. It is gitignored. Without it the app uses `seed/personal.example.json`, which has made-up values.
