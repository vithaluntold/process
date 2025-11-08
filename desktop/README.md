# EPI X-Ray Desktop App

## Quick Start

### For Development
```bash
# Terminal 1: Start the web app
pnpm dev

# Terminal 2: Run the desktop app
pnpm desktop:dev
```

### Building Installers

**Prerequisites:**
```bash
# Install desktop dependencies first
pnpm desktop:install
```

**Build for your platform:**
```bash
# Windows (creates .exe installer)
pnpm desktop:build:win

# macOS (creates .dmg)
pnpm desktop:build:mac

# Linux (creates .AppImage, .deb, .rpm)
pnpm desktop:build:linux

# All platforms
pnpm desktop:build
```

**Output location:** `desktop/dist/`

## What You Get

### Windows
- **EPI X-Ray-Setup-1.0.0.exe** - Full installer with uninstaller
- **EPI X-Ray-1.0.0.exe** - Portable version (no installation required)

### macOS
- **EPI X-Ray-1.0.0-arm64.dmg** - Drag-and-drop installer
- **EPI X-Ray-1.0.0-arm64-mac.zip** - Zipped app bundle

### Linux
- **EPI X-Ray-1.0.0-x64.AppImage** - Universal Linux app (no installation)
- **epi-xray_1.0.0_amd64.deb** - Debian/Ubuntu package
- **epi-xray-1.0.0.x86_64.rpm** - Fedora/RHEL package

## Features

✅ **Native Desktop App** - Runs like any desktop application  
✅ **Cross-Platform** - Windows, macOS, Linux support  
✅ **Menu Bar** - Native menus with keyboard shortcuts  
✅ **About Dialog** - Branded about dialog with FinACEverse branding  
✅ **External Links** - Opens links in system browser  
✅ **Security** - Sandboxed with context isolation  
✅ **Auto-Updates Ready** - Can be configured for auto-updates  

## Technical Details

- **Framework**: Electron 28
- **Bundler**: Electron Builder
- **Security**: Context isolation enabled, node integration disabled
- **Window Size**: 1400x900 (min: 1024x768)

## Documentation

See [DESKTOP_BUILD.md](../DESKTOP_BUILD.md) for complete documentation.
