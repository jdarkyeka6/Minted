# Minted

**Start with $0. Build an empire.**

Minted is an idle financial tycoon game built with React Native + Expo modules for iOS.

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
- GitHub Actions run number is used as the iOS build number

## Run locally
```bash
npm install
npx expo start
```

## TestFlight delivery
Minted uses a direct GitHub Actions pipeline. No Expo/EAS account or EAS cloud build is required.

The manual workflow at `.github/workflows/testflight.yml` runs on a GitHub-hosted macOS machine and:

1. Installs the JavaScript dependencies.
2. Generates the native iOS project locally with Expo prebuild.
3. Installs CocoaPods.
4. Uses Xcode automatic signing with an App Store Connect API key.
5. Archives and exports the signed `.ipa`.
6. Uploads it directly to App Store Connect/TestFlight with Apple's `altool`.

### Required GitHub Actions secrets
Add these under **Settings → Secrets and variables → Actions**:

- `APPLE_TEAM_ID`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_API_KEY_P8`

`ASC_API_KEY_P8` must contain the complete text contents of the App Store Connect API key `.p8` file.

After the secrets are configured, open **Actions → Ship Minted to TestFlight → Run workflow**.

Apple still needs to process the uploaded build before it appears in TestFlight.
