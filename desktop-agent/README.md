# EPI-Q Desktop Agent

Desktop activity capture agent for the EPI-Q Process Mining platform.

## Features

- **Keyboard Activity Tracking** - Captures keyboard events and typing patterns
- **Application Usage Monitoring** - Tracks active applications and window switches  
- **Screenshot Capture** - Optional periodic screenshots (configurable interval)
- **AES-256 Encryption** - All data encrypted before transmission
- **Privacy Controls** - Blur sensitive data, consent management, pause/resume tracking
- **System Tray Integration** - Runs in background with quick access controls
- **Cross-Platform** - Windows, macOS, and Linux support

## Installation

### Build from Source

```bash
cd desktop-agent
npm install
npm run build
```

### Package Installers

```bash
# Windows
npm run package:win

# macOS  
npm run package:mac

# Linux
npm run package:linux
```

## Usage

1. **Install** the agent on your computer
2. **Configure** your EPI-Q platform URL and API key
3. **Grant consent** for activity tracking
4. **Start tracking** - Agent runs in system tray

## Configuration

- **Platform URL**: URL of your EPI-Q platform (default: http://localhost:5000)
- **API Key**: Your authentication key from the platform
- **Capture Settings**: Toggle keyboard, apps, screenshots
- **Privacy Settings**: Encryption, data blurring, consent

## Privacy & Security

- Optional AES-256 encryption (disabled by default for compatibility)
- Sensitive information can be automatically blurred
- User consent required before tracking begins
- Full control to pause/resume tracking anytime
- Data stored locally until successfully transmitted
- Screenshots properly stopped when pausing tracking

**Security Notice:** The current API key authentication uses email addresses for demo purposes. In production environments, implement proper API key generation with secure secrets storage and validation.

## System Requirements

- **Windows**: 10 or later
- **macOS**: 10.13 or later  
- **Linux**: Ubuntu 18.04+, Fedora 28+, or equivalent

## License

MIT License - FinACEverse
