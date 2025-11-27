# EPI-Q Agent Code Signing Guide

This document outlines the code signing process for building trusted, enterprise-ready installers.

## Overview

Code signing is essential for:
- Establishing trust with users and IT departments
- Preventing security warnings during installation
- Enabling auto-update functionality
- Meeting enterprise security requirements

## Windows Code Signing

### Certificate Requirements

For enterprise deployment, we recommend:
- **EV (Extended Validation) Code Signing Certificate**
  - Immediate reputation with SmartScreen
  - Required for kernel-mode drivers
  - Requires hardware token (HSM)

- **Standard Code Signing Certificate**
  - Lower cost
  - Builds reputation over time
  - Can be stored in software

### Obtaining Certificates

Recommended Certificate Authorities:
- DigiCert
- Sectigo (formerly Comodo)
- GlobalSign
- SSL.com

### Environment Variables

Set these before building:

```bash
# For certificate in Windows Certificate Store
export WIN_CSC_LINK="path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"

# For EV certificate with HSM
export WIN_CSC_SUBJECT_NAME="Your Company Name"

# Optional: Certificate SHA1 thumbprint
export WIN_CSC_SHA1="CERTIFICATE_THUMBPRINT"
```

### Signing Process

The electron-builder automatically signs during build:

```bash
npm run package:win
```

### Manual Signing (if needed)

```powershell
# Using signtool
signtool sign /tr http://timestamp.digicert.com /td sha256 /fd sha256 /a "path\to\app.exe"

# Verify signature
signtool verify /pa /v "path\to\app.exe"
```

## macOS Code Signing

### Certificate Requirements

Required certificates from Apple Developer Program ($99/year):
1. **Developer ID Application** - Signs the app
2. **Developer ID Installer** - Signs PKG installers

### Obtaining Certificates

1. Enroll in Apple Developer Program
2. Create certificates in Certificates, Identifiers & Profiles
3. Download and install in Keychain

### Environment Variables

```bash
# Developer ID identity
export APPLE_IDENTITY="Developer ID Application: Your Company (TEAMID)"

# Notarization credentials
export APPLE_ID="developer@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

# Optional: Provisioning profile for distribution
export APPLE_PROVISIONING_PROFILE="path/to/profile.provisionprofile"
```

### Signing and Notarization

electron-builder handles both automatically:

```bash
npm run package:mac
```

### Manual Signing

```bash
# Sign app bundle
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Company (TEAMID)" \
  --options runtime \
  --entitlements entitlements.mac.plist \
  "EPI-Q Agent.app"

# Create and sign DMG
hdiutil create -volname "EPI-Q Agent" -srcfolder "EPI-Q Agent.app" -ov -format UDZO "EPI-Q-Agent.dmg"
codesign --sign "Developer ID Application: Your Company (TEAMID)" "EPI-Q-Agent.dmg"
```

### Notarization

```bash
# Submit for notarization
xcrun notarytool submit "EPI-Q-Agent.dmg" \
  --apple-id "developer@example.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "XXXXXXXXXX" \
  --wait

# Staple the ticket
xcrun stapler staple "EPI-Q-Agent.dmg"
```

### Verifying Signatures

```bash
# Verify code signature
codesign --verify --deep --strict --verbose=2 "EPI-Q Agent.app"

# Check notarization status
spctl -a -vvv -t install "EPI-Q Agent.app"

# Verify Gatekeeper acceptance
spctl --assess --type execute "EPI-Q Agent.app"
```

## Linux Code Signing

Linux packages are typically not code-signed in the traditional sense, but you can:

### GPG Signing for DEB Packages

```bash
# Generate GPG key
gpg --full-generate-key

# Export public key
gpg --armor --export "Your Name" > public.key

# Sign the package
dpkg-sig --sign builder epi-q-agent_1.0.0_amd64.deb
```

### RPM Signing

```bash
# Create GPG key and add to RPM macros
echo "%_signature gpg" >> ~/.rpmmacros
echo "%_gpg_name Your Name" >> ~/.rpmmacros

# Sign the package
rpm --addsign epi-q-agent-1.0.0.x86_64.rpm

# Verify signature
rpm --checksig epi-q-agent-1.0.0.x86_64.rpm
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Build and Sign

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: desktop-agent
      
      - name: Build and Sign
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npm run package:win
        working-directory: desktop-agent

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: desktop-agent
      
      - name: Import certificates
        env:
          MACOS_CERTIFICATE: ${{ secrets.MACOS_CERTIFICATE }}
          MACOS_CERTIFICATE_PWD: ${{ secrets.MACOS_CERTIFICATE_PWD }}
        run: |
          echo $MACOS_CERTIFICATE | base64 --decode > certificate.p12
          security create-keychain -p actions build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p actions build.keychain
          security import certificate.p12 -k build.keychain -P $MACOS_CERTIFICATE_PWD -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k actions build.keychain
      
      - name: Build, Sign, and Notarize
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run package:mac
        working-directory: desktop-agent
```

## Security Best Practices

### Certificate Storage
- Never commit certificates to version control
- Use CI/CD secrets for automated builds
- Store EV certificates on HSM as required
- Rotate certificates before expiration

### Key Management
- Use separate certificates for development and production
- Implement certificate pinning for update verification
- Monitor for certificate compromise

### Audit Trail
- Log all signing operations
- Maintain records of what was signed and when
- Use timestamping to prove when signatures were made

## Troubleshooting

### Windows Issues

**"Windows SmartScreen prevented an unrecognized app"**
- Normal for new certificates without reputation
- Use EV certificate for immediate reputation
- Submit to Microsoft for analysis

**Timestamp server failures**
- Try alternative servers:
  - http://timestamp.digicert.com
  - http://timestamp.comodoca.com
  - http://timestamp.globalsign.com

### macOS Issues

**"App is damaged and can't be opened"**
- Verify entitlements file is correct
- Ensure hardened runtime is enabled
- Check notarization status

**Notarization failures**
- Review notarization log for specific issues
- Ensure all binaries are signed
- Check for unsigned third-party libraries

## Resources

- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Microsoft Authenticode Guide](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [Electron Builder Code Signing](https://www.electron.build/code-signing)
