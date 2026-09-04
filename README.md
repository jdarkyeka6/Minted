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

## iOS identity
- App name: Minted
- Bundle identifier: `com.jdarkyeka6.minted`
- Build number starts at `1` and EAS production builds auto-increment

## Run locally
```bash
npm install
npx expo start
```

## First-time EAS setup
```bash
npm install -g eas-cli
eas login
eas init
```

`eas init` links this GitHub project to your Expo account and writes the EAS project ID into the Expo config.

## Build + upload to TestFlight
The production profile in `eas.json` is configured for App Store/TestFlight distribution.

```bash
eas build --platform ios --profile production --auto-submit
```

On the first run, EAS will guide you through Apple Developer signing credentials and App Store Connect authentication. If you prefer to build and submit separately:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

After Apple finishes processing the upload, open **App Store Connect → Minted → TestFlight** and enable the build for internal testing.

### Optional: pin the App Store Connect app ID
Once you know Minted's numeric Apple ID from **App Store Connect → Minted → App Information**, add it to the `submit.production.ios.ascAppId` field in `eas.json`. This removes an app-selection prompt during submission.

An active Apple Developer membership and App Store Connect access are required for the iOS/TestFlight submission.
