# Minted

**Start with $0. Build an empire.**

Minted is an idle financial tycoon game built with React Native + Expo for iOS.

## Minted v2 gameplay

The game now revolves around one connected loop:

**earn → invest → build → automate → grow net worth → unlock bigger things**

### Empire
- Live net worth and cash
- Passive-income breakdown
- Rank progression from Starter through Empire
- Daily cash streaks
- Claimable achievements
- Taxes
- Recent activity feed
- Up to 8 hours of offline earnings

### Markets
- Live fictional stock market
- Live fictional crypto market
- Random market-news shocks
- Buy/sell 1, 10 or Max
- Position value and P/L
- Stock dividends

### Business
- Nine business tiers
- Multiple locations
- Operational upgrades
- Management-team upgrades
- Revenue, expenses and profit
- Employee count and reputation
- Passive business income

### Assets
- Rental property across multiple locations
- Repeat property purchases
- Lifestyle collection and prestige
- High-end late-game assets

### Earn
- Tap-to-earn early game
- Tap upgrades
- Career ladder
- Lifetime stats

## Saving

Game state is stored locally using AsyncStorage. Minted automatically migrates the previous `minted-save-v1` and `minted-save-v2` saves into the current save format.

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

Minted uses `.github/workflows/testflight.yml` to build and upload directly to App Store Connect from GitHub Actions.

Required GitHub Actions secrets:

- `APPLE_TEAM_ID`
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_API_KEY_P8`

A push to `main` starts a new TestFlight build automatically.
