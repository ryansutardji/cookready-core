# Build Commands

## EAS Cloud Builds

### Android

| Profile | Command | Output |
|---|---|---|
| Development | `eas build --platform android --profile development` | APK with dev client |
| Preview | `eas build --platform android --profile preview` | APK for internal testing |
| Production | `eas build --platform android --profile production` | AAB for Play Store |

### iOS

| Profile | Command | Output |
|---|---|---|
| Development | `eas build --platform ios --profile development` | IPA with dev client |
| Preview | `eas build --platform ios --profile preview` | IPA for internal testing |
| Production | `eas build --platform ios --profile production` | IPA for App Store |

### Both Platforms at Once

```bash
eas build --platform all --profile preview
eas build --platform all --profile production
```

---

## Local Builds (device/emulator)

```bash
# Android
expo run:android

# iOS
expo run:ios
```

---

## Submit to Stores

```bash
# Android (Play Store)
eas submit --platform android

# iOS (App Store)
eas submit --platform ios
```
