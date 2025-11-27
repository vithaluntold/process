# EPI-Q Desktop Agent

Enterprise-grade desktop activity capture agent for the EPI-Q Process Mining platform.

## Features

### Activity Capture
- **Keyboard Activity Tracking** - Captures keyboard events and typing patterns
- **Application Usage Monitoring** - Tracks active applications and window switches  
- **Screenshot Capture** - Optional periodic screenshots (configurable interval)
- **Mouse Activity** - Click patterns and navigation tracking

### Security & Privacy
- **AES-256 Encryption** - All data encrypted before transmission
- **Privacy Controls** - Blur sensitive data, consent management, pause/resume tracking
- **Configurable Exclusions** - Exclude specific apps, URLs, or window titles
- **User Consent Required** - No tracking without explicit consent

### Enterprise Features
- **System Tray Integration** - Runs in background with quick access controls
- **Cross-Platform** - Windows, macOS, and Linux support
- **Auto-Update** - Automatic updates via electron-updater
- **Fleet Deployment** - MSI/PKG packages for enterprise distribution
- **Code Signing** - Signed packages for Windows and macOS

## Installation

### Download Pre-built Installers

Download the latest release for your platform:

| Platform | Download |
|----------|----------|
| Windows (x64) | `EPI-Q-Agent-x.x.x-win-x64.msi` |
| macOS (Intel) | `EPI-Q-Agent-x.x.x-mac-x64.pkg` |
| macOS (Apple Silicon) | `EPI-Q-Agent-x.x.x-mac-arm64.pkg` |
| Linux (DEB) | `epi-q-agent_x.x.x_amd64.deb` |
| Linux (RPM) | `epi-q-agent-x.x.x.x86_64.rpm` |

### Build from Source

```bash
cd desktop-agent
npm install
npm run build
```

### Package Installers

```bash
# All platforms
npm run package:all

# Windows (NSIS installer + MSI + Portable)
npm run package:win

# Windows MSI only (for enterprise deployment)
npm run package:msi

# macOS (DMG + PKG + ZIP)
npm run package:mac

# macOS PKG only (for enterprise deployment)
npm run package:pkg

# Linux (AppImage + DEB + RPM)
npm run package:linux
```

## Quick Start

1. **Install** the agent on your computer
2. **Configure** your EPI-Q platform URL and API key
3. **Grant consent** for activity tracking
4. **Start tracking** - Agent runs in system tray

## Configuration

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Platform URL | URL of your EPI-Q platform | - |
| API Key | Your authentication key | - |
| Auto Start | Start tracking on launch | false |
| Capture Keyboard | Track keyboard activity | true |
| Capture Apps | Track application usage | true |
| Capture Screenshots | Periodic screenshots | false |
| Sync Interval | Data sync frequency (seconds) | 60 |

### Configuration File Locations

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\epi-q-agent\config.json` |
| macOS | `~/Library/Application Support/epi-q-agent/config.json` |
| Linux | `~/.config/epi-q-agent/config.json` |

## Enterprise Deployment

### Fleet Deployment

See [FLEET_DEPLOYMENT.md](docs/FLEET_DEPLOYMENT.md) for comprehensive deployment guides:
- Windows GPO/SCCM/Intune deployment
- macOS Jamf/MDM deployment
- Linux Ansible/Puppet deployment

### Code Signing

See [CODE_SIGNING.md](docs/CODE_SIGNING.md) for code signing setup:
- Windows code signing certificates
- macOS Developer ID and notarization
- CI/CD integration

### Silent Installation

**Windows (MSI):**
```powershell
msiexec /i "EPI-Q-Agent-1.0.0-win-x64.msi" /qn PLATFORM_URL="https://epiq.example.com"
```

**macOS (PKG):**
```bash
sudo installer -pkg "EPI-Q-Agent-1.0.0-mac-x64.pkg" -target /
```

**Linux (DEB):**
```bash
sudo apt install ./epi-q-agent_1.0.0_amd64.deb
```

## Auto-Update

The agent automatically checks for updates every hour. Updates can also be triggered manually from the system tray menu.

### Update Channels

- **Stable** - Production-ready releases
- **Beta** - Pre-release testing
- **Canary** - Nightly builds (development only)

### Custom Update Server

Set the `UPDATE_SERVER_URL` environment variable to use a custom update server.

## Privacy & Security

- **Encryption**: All data is encrypted using AES-256 before transmission
- **TLS**: Communications use TLS 1.3
- **Consent**: User consent is required before any tracking begins
- **Control**: Full control to pause, resume, or stop tracking at any time
- **Exclusions**: Configure apps, URLs, and window titles to exclude from tracking
- **Local Storage**: Data is stored locally and encrypted until successfully transmitted
- **No Keylogging**: Keystroke content is never captured, only typing patterns

## System Requirements

| Platform | Minimum Version |
|----------|-----------------|
| Windows | Windows 10 (1809+) |
| macOS | macOS 12 (Monterey) |
| Linux | Ubuntu 20.04, Fedora 35, or equivalent |

### Hardware
- 100 MB disk space
- 256 MB RAM
- Network connectivity to EPI-Q platform

## Logging

Log files are stored at:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\epi-q-agent\logs\main.log` |
| macOS | `~/Library/Logs/epi-q-agent/main.log` |
| Linux | `~/.config/epi-q-agent/logs/main.log` |

## Troubleshooting

### Agent not starting
1. Check if another instance is already running
2. Verify platform URL and API key configuration
3. Check logs for detailed error messages

### Data not syncing
1. Verify network connectivity to platform
2. Check if API key is valid
3. Review sync logs for errors

### High resource usage
1. Increase sync interval
2. Disable screenshot capture
3. Check for conflicting software

## Development

### Project Structure

```
desktop-agent/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry point
│   │   ├── activity-capture.ts
│   │   ├── auto-updater.ts
│   │   ├── config-manager.ts
│   │   └── data-transmitter.ts
│   ├── preload/        # Preload scripts
│   └── renderer/       # UI
├── assets/             # Icons and resources
├── installer/          # Platform-specific installer scripts
├── docs/               # Documentation
└── package.json
```

### Development Commands

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Package for current platform
npm run package

# Create release with auto-update
npm run release
```

## License

MIT License - EPI-Q Inc.

## Support

- Email: support@epiq.com
- Documentation: https://docs.epiq.com/agent
- Issues: https://github.com/epiq/desktop-agent/issues
