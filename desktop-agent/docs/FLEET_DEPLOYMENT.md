# EPI-Q Agent Fleet Deployment Guide

This document provides comprehensive instructions for deploying the EPI-Q Desktop Agent across enterprise environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Windows Deployment](#windows-deployment)
3. [macOS Deployment](#macos-deployment)
4. [Linux Deployment](#linux-deployment)
5. [Configuration Management](#configuration-management)
6. [Auto-Update Infrastructure](#auto-update-infrastructure)
7. [Monitoring & Telemetry](#monitoring--telemetry)

## Prerequisites

### Build Environment
- Node.js 18+ LTS
- npm or pnpm
- Platform-specific requirements:
  - **Windows**: Windows 10/11, Visual Studio Build Tools
  - **macOS**: macOS 12+, Xcode Command Line Tools
  - **Linux**: Ubuntu 20.04+ or equivalent

### Code Signing Certificates

#### Windows
- EV Code Signing Certificate (recommended for enterprise)
- Standard Code Signing Certificate (minimum)
- Hardware Security Module (HSM) for EV certificates

#### macOS
- Apple Developer ID Application certificate
- Apple Developer ID Installer certificate
- Notarization credentials (App Store Connect API key)

## Windows Deployment

### Building MSI Packages

```bash
# Build MSI installer for enterprise deployment
npm run package:msi
```

The MSI installer supports:
- Per-machine installation (requires admin)
- Per-user installation
- Silent installation
- Group Policy deployment

### Silent Installation

```powershell
# Silent install
msiexec /i "EPI-Q-Agent-1.0.0-win-x64.msi" /qn

# Silent install with logging
msiexec /i "EPI-Q-Agent-1.0.0-win-x64.msi" /qn /l*v install.log

# Silent install with custom config
msiexec /i "EPI-Q-Agent-1.0.0-win-x64.msi" /qn PLATFORM_URL="https://epiq.example.com" API_KEY="xxx"
```

### Group Policy Deployment (GPO)

1. Copy MSI to network share accessible by target machines
2. Create new GPO or edit existing
3. Navigate to: Computer Configuration > Policies > Software Settings > Software Installation
4. Right-click and select "New > Package"
5. Select MSI file and choose "Assigned" deployment

### SCCM/Intune Deployment

#### Microsoft Intune
1. Navigate to Devices > Windows > Apps
2. Add new Windows app (MSI line-of-business)
3. Upload MSI file
4. Configure:
   - Install command: `msiexec /i "EPI-Q-Agent-1.0.0-win-x64.msi" /qn`
   - Uninstall command: `msiexec /x {PRODUCT-GUID} /qn`
5. Assign to device groups

#### SCCM
1. Create new Application
2. Add MSI deployment type
3. Configure detection method using registry key:
   - Path: `HKLM\SOFTWARE\EPI-Q\Agent`
   - Key: `Version`
4. Deploy to collection

### Registry Configuration

Pre-configure agent settings via registry:

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\EPI-Q\Agent]
"PlatformUrl"="https://epiq.example.com"
"ApiKey"="enterprise-api-key"
"AutoStart"=dword:00000001
"CaptureScreenshots"=dword:00000000
"CaptureKeystrokes"=dword:00000000
"SyncInterval"=dword:0000003c
```

## macOS Deployment

### Building PKG Packages

```bash
# Build PKG installer for enterprise deployment
npm run package:pkg
```

### Notarization

PKG packages are automatically notarized during the build process when the following environment variables are set:

```bash
export APPLE_TEAM_ID="XXXXXXXXXX"
export APPLE_ID="developer@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
```

### MDM Deployment (Jamf Pro)

1. Upload PKG to Jamf Admin
2. Create new Policy
3. Add Package payload
4. Configure execution frequency
5. Scope to computer groups

### Silent Installation

```bash
# Silent install
sudo installer -pkg "EPI-Q-Agent-1.0.0-mac-x64.pkg" -target /

# With verbose logging
sudo installer -pkg "EPI-Q-Agent-1.0.0-mac-x64.pkg" -target / -verboseR
```

### Configuration Profile

Create a `.mobileconfig` file for MDM distribution:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.epiq.agent</string>
            <key>PlatformUrl</key>
            <string>https://epiq.example.com</string>
            <key>ApiKey</key>
            <string>enterprise-api-key</string>
            <key>AutoStart</key>
            <true/>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>EPI-Q Agent Configuration</string>
    <key>PayloadIdentifier</key>
    <string>com.epiq.agent.config</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
```

## Linux Deployment

### Building DEB/RPM Packages

```bash
# Build DEB for Debian/Ubuntu
npm run package:linux

# Build RPM for RHEL/Fedora
npm run package:linux
```

### Debian/Ubuntu Installation

```bash
# Install DEB package
sudo dpkg -i epi-q-agent_1.0.0_amd64.deb
sudo apt-get install -f  # Install dependencies

# Or using apt directly
sudo apt install ./epi-q-agent_1.0.0_amd64.deb
```

### RHEL/Fedora Installation

```bash
# Install RPM package
sudo dnf install epi-q-agent-1.0.0.x86_64.rpm

# Or using rpm
sudo rpm -i epi-q-agent-1.0.0.x86_64.rpm
```

### Ansible Deployment

```yaml
---
- name: Deploy EPI-Q Agent
  hosts: workstations
  become: yes
  tasks:
    - name: Copy DEB package
      copy:
        src: files/epi-q-agent_1.0.0_amd64.deb
        dest: /tmp/epi-q-agent.deb

    - name: Install EPI-Q Agent
      apt:
        deb: /tmp/epi-q-agent.deb
      when: ansible_os_family == "Debian"

    - name: Configure EPI-Q Agent
      template:
        src: templates/config.json.j2
        dest: /etc/epi-q-agent/config.json
        mode: '0644'

    - name: Enable autostart
      copy:
        src: files/epi-q-agent.desktop
        dest: /etc/xdg/autostart/epi-q-agent.desktop
```

## Configuration Management

### Configuration File Locations

| Platform | User Config | System Config |
|----------|-------------|---------------|
| Windows | `%APPDATA%\epi-q-agent\config.json` | `%PROGRAMDATA%\EPI-Q\Agent\config.json` |
| macOS | `~/Library/Application Support/epi-q-agent/config.json` | `/Library/Application Support/EPI-Q/Agent/config.json` |
| Linux | `~/.config/epi-q-agent/config.json` | `/etc/epi-q-agent/config.json` |

### Configuration Schema

```json
{
  "platformUrl": "https://epiq.example.com",
  "apiKey": "enterprise-api-key",
  "tenantId": "tenant-uuid",
  "autoStart": true,
  "privacyConsent": true,
  "captureSettings": {
    "screenshots": false,
    "keystrokes": false,
    "mouseClicks": true,
    "applicationUsage": true,
    "windowTitles": true,
    "urlTracking": false
  },
  "syncSettings": {
    "intervalSeconds": 60,
    "batchSize": 100,
    "retryAttempts": 3,
    "offlineQueueSize": 10000
  },
  "privacySettings": {
    "excludedApps": ["1password", "keychain"],
    "excludedUrls": ["bank.*", "*.healthcare.gov"],
    "excludedTitles": ["password", "private"]
  }
}
```

## Auto-Update Infrastructure

### Update Server Setup

Host update files on your infrastructure:

```
/updates/
  ├── latest.yml           # Windows update manifest
  ├── latest-mac.yml       # macOS update manifest
  ├── latest-linux.yml     # Linux update manifest
  ├── EPI-Q-Agent-1.0.1-win-x64.exe
  ├── EPI-Q-Agent-1.0.1-mac-x64.dmg
  └── EPI-Q-Agent-1.0.1-linux-x64.AppImage
```

### Update Manifest Example (latest.yml)

```yaml
version: 1.0.1
files:
  - url: EPI-Q-Agent-1.0.1-win-x64.exe
    sha512: <sha512-hash>
    size: 75000000
path: EPI-Q-Agent-1.0.1-win-x64.exe
sha512: <sha512-hash>
releaseDate: '2024-01-15T10:00:00.000Z'
releaseNotes: |
  - Bug fixes and performance improvements
  - Enhanced activity capture accuracy
```

### Environment Variables

Configure update server via environment:

```bash
# Set custom update server
UPDATE_SERVER_URL=https://updates.example.com/agent
```

### Staged Rollout

Implement staged rollout by:
1. Deploying to test group first
2. Using separate update channels (stable, beta, canary)
3. Implementing percentage-based rollout

## Monitoring & Telemetry

### Health Check Endpoint

The agent exposes a local health check:

```bash
curl http://localhost:47321/health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "tracking": true,
  "lastSync": "2024-01-15T10:30:00Z",
  "pendingEvents": 42
}
```

### Log Locations

| Platform | Log Path |
|----------|----------|
| Windows | `%APPDATA%\epi-q-agent\logs\main.log` |
| macOS | `~/Library/Logs/epi-q-agent/main.log` |
| Linux | `~/.config/epi-q-agent/logs/main.log` |

### Metrics Collection

The agent reports the following metrics to the platform:
- Agent version and platform info
- Capture statistics (events/minute)
- Sync success/failure rates
- Error counts and types

## Security Considerations

### Data Protection
- All data is encrypted in transit (TLS 1.3)
- Local cache is encrypted at rest
- Sensitive data is never logged

### Network Requirements
- Outbound HTTPS (443) to platform URL
- No inbound connections required
- Supports HTTP proxy configuration

### Privacy Controls
- User consent required before tracking
- Configurable exclusion lists
- Optional screenshot/keystroke capture (disabled by default)

## Troubleshooting

### Common Issues

1. **Agent not starting**
   - Check logs for errors
   - Verify platform URL and API key
   - Ensure proper permissions

2. **Updates failing**
   - Verify network connectivity to update server
   - Check code signing on downloaded update
   - Review update logs

3. **High CPU usage**
   - Increase sync interval
   - Reduce capture frequency
   - Check for conflicting software

### Support

For enterprise support, contact:
- Email: enterprise-support@epiq.com
- Portal: https://support.epiq.com
