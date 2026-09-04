# Minted

**Start with $0. Build an empire.**

Minted is an idle financial tycoon game built with Expo + React Native for iOS.

## Current navigation
- Invest
- Business
- Home, including the Shop
- Job
- Profile, with Profile / Assets / Achievements / Stats

## Current MVP
- Tap to earn money
- Click upgrades
- Passive income
- Businesses, units and upgrades
- Shop unlocks
- Basic stock market with changing prices
- Jobs
- Achievements and lifetime stats
- Local save with AsyncStorage

## Run locally
```bash
npm install
npx expo start
```

## TestFlight
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
eas submit --platform ios
```

An Apple Developer account and App Store Connect access are required for the iOS/TestFlight submission.
