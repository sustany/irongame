# IronQ iOS (alpha)

Native SwiftUI + HealthKit app. Live heart rate (streamed from Apple Watch via HealthKit), workout session tracking with avg/max/min HR, and local workout history (SwiftData). Workouts are also written back to Apple Health.

No Mac required: the project is generated with XcodeGen and built on GitHub Actions macOS runners.

## Status

- `ios-build.yml` — compile check on every push touching `ios/`. No Apple account needed.
- `ios-testflight.yml` — signed build + TestFlight upload. Manual trigger. Requires the one-time Apple setup below.

## One-time Apple setup (needs active paid Apple Developer account)

1. **Enroll** (if not already): Apple Developer app on iPhone → Account → Enroll ($99/yr, individual). Activation is usually hours, worst case 48h.
2. **Team ID**: developer.apple.com/account → Membership details → copy the 10-character Team ID.
3. **Register the bundle ID**: developer.apple.com/account/resources/identifiers → `+` → App IDs → App → Bundle ID (explicit): `co.sustany.ironq`, description `IronQ` → check **HealthKit** capability → Register.
4. **Create the app record**: appstoreconnect.apple.com → My Apps → `+` → New App → iOS, name `IronQ`, primary language English (U.S.), bundle ID `co.sustany.ironq`, SKU `ironq-ios`.
5. **App Store Connect API key**: appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API → Team Keys → `+`. Name `github-ci`, role **App Manager**. Download the `.p8` (one shot — keep it). Note the **Key ID** and **Issuer ID**.
6. **GitHub secrets**: github.com/sustany/irongame → Settings → Secrets and variables → Actions → New repository secret:
   - `ASC_KEY_ID` — the Key ID
   - `ASC_ISSUER_ID` — the Issuer ID
   - `ASC_KEY_CONTENT` — the `.p8` file, base64-encoded. PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXX.p8")) | Set-Clipboard`
   - `APPLE_TEAM_ID` — the Team ID
   - `MATCH_PASSWORD` — any strong passphrase you invent (encrypts the signing certs stored on the `certs` branch)
   - `MATCH_GIT_TOKEN` — a GitHub PAT with push access to this repo (the existing one works)

## Ship a build

Actions → **iOS TestFlight** → Run workflow. First run creates the distribution cert + provisioning profile automatically (fastlane match, stored encrypted on the `certs` branch), builds, signs, and uploads. Build processing on Apple's side takes ~5–15 min, then it appears in TestFlight.

**Install on your iPhone**: TestFlight app → the build appears under IronQ (you're automatically an internal tester as account holder; no review needed for internal testing).

## Alpha scope and known limits

- Live HR requires a source writing to HealthKit in near-real-time — in practice, start a workout on your Apple Watch (any type) alongside the IronQ session on the phone. Without a Watch workout running, HR samples arrive sparsely or not at all.
- HR updates stream while the app is foregrounded; backgrounded sessions catch up on re-open.
- History is on-device (SwiftData). No sync with the IronGame web app yet — data model is deliberately simple so it can be mapped later.

## Local development (if a Mac ever materializes)

```sh
brew install xcodegen
cd ios && xcodegen generate && open IronQ.xcodeproj
```
