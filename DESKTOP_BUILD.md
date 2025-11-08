# EPI X-Ray Desktop Application

## Overview
EPI X-Ray is available as an installable desktop application for Windows, macOS, and Linux using Electron. The desktop version provides a native application experience with enhanced performance and offline capabilities.

## Features
- **Native Desktop Experience**: Full-screen app with native menus and shortcuts
- **Cross-Platform**: Windows, macOS, and Linux support
- **Offline Capable**: Run the application without an internet connection (after initial setup)
- **Auto-Updates**: Seamless updates (when configured)
- **System Integration**: Desktop shortcuts, taskbar integration, and file associations

## Building the Desktop App

### Prerequisites
1. Node.js 18+ installed
2. pnpm package manager
3. Platform-specific build tools:
   - **Windows**: Windows 10+ (for NSIS installer)
   - **macOS**: macOS 10.13+ with Xcode Command Line Tools
   - **Linux**: Standard build tools (gcc, make, etc.)

### Build Steps

#### 1. Build the Web Application
First, build the Next.js application for production:

```bash
# Install dependencies
pnpm install

# Build Next.js for static export
pnpm build
pnpm export
```

#### 2. Install Desktop Dependencies
Navigate to the desktop folder and install Electron dependencies:

```bash
cd desktop
npm install
```

#### 3. Build Desktop Installers

**Build for Windows:**
```bash
cd desktop
npm run build:win
```
Output: `desktop/dist/EPI X-Ray-Setup-1.0.0.exe` (installer) and portable version

**Build for macOS:**
```bash
cd desktop
npm run build:mac
```
Output: `desktop/dist/EPI X-Ray-1.0.0-arm64.dmg` and `.zip` file

**Build for Linux:**
```bash
cd desktop
npm run build:linux
```
Output: `desktop/dist/EPI X-Ray-1.0.0-x64.AppImage`, `.deb`, and `.rpm` packages

**Build for All Platforms:**
```bash
cd desktop
npm run build
```

### Development Mode
To run the desktop app in development mode:

```bash
# Terminal 1: Start Next.js dev server
pnpm dev

# Terminal 2: Start Electron
cd desktop
npm start
```

## Installation

### Windows
1. Download `EPI X-Ray-Setup-1.0.0.exe`
2. Double-click the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### macOS
1. Download `EPI X-Ray-1.0.0-arm64.dmg`
2. Open the DMG file
3. Drag EPI X-Ray to Applications folder
4. Launch from Applications or Spotlight

### Linux

**AppImage (Universal):**
```bash
chmod +x EPI-X-Ray-1.0.0-x64.AppImage
./EPI-X-Ray-1.0.0-x64.AppImage
```

**Debian/Ubuntu (.deb):**
```bash
sudo dpkg -i epi-xray-1.0.0-amd64.deb
```

**Fedora/RHEL (.rpm):**
```bash
sudo rpm -i epi-xray-1.0.0-x86_64.rpm
```

## Architecture

### Technology Stack
- **Electron 28**: Desktop application framework
- **Next.js 15**: Web application framework
- **Electron Builder**: Cross-platform installer generation

### Application Structure
```
desktop/
├── main.js           # Electron main process
├── preload.js        # Preload script for secure IPC
├── package.json      # Desktop app configuration
└── assets/           # Application icons and resources
```

### Security Features
- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Web Security**: Enforced for all content
- **External Links**: Automatically open in system browser

## Configuration

### Window Settings
- Default size: 1400x900px
- Minimum size: 1024x768px
- Background color: #0a1929 (matches app theme)
- Auto-hide menu bar: Disabled (visible by default)

### Menu Structure
- **File**: Reload, Exit
- **Edit**: Undo, Redo, Cut, Copy, Paste, Select All
- **View**: Zoom controls, Full-screen toggle
- **Help**: Documentation, About dialog
- **Developer** (dev mode only): DevTools, Force Reload

## Keyboard Shortcuts
- `Ctrl/Cmd + R` - Reload application
- `Ctrl/Cmd + Q` - Quit application
- `Ctrl/Cmd + Plus` - Zoom in
- `Ctrl/Cmd + Minus` - Zoom out
- `Ctrl/Cmd + 0` - Reset zoom
- `F11` - Toggle full-screen

## Distribution

### File Sizes (Approximate)
- **Windows**: ~150MB (installer)
- **macOS**: ~180MB (DMG)
- **Linux**: ~160MB (AppImage)

### Distribution Channels
1. **Direct Download**: Host installers on your website
2. **GitHub Releases**: Attach to GitHub releases
3. **Microsoft Store**: (Requires additional setup)
4. **Mac App Store**: (Requires Apple Developer account)
5. **Snap Store**: (Linux package manager)

## Auto-Update Configuration

To enable auto-updates, configure a release server in `desktop/main.js`:

```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

Then add to `desktop/package.json`:

```json
{
  "publish": [
    {
      "provider": "github",
      "owner": "finaceverse",
      "repo": "epi-xray"
    }
  ]
}
```

## Troubleshooting

### Windows Installation Issues
- **Error: App won't install**: Right-click installer → "Run as Administrator"
- **SmartScreen Warning**: Click "More info" → "Run anyway"

### macOS Installation Issues
- **"App is damaged"**: Run `xattr -cr /Applications/EPI\ X-Ray.app`
- **"Unidentified developer"**: System Preferences → Security → "Open Anyway"

### Linux Installation Issues
- **AppImage won't run**: Make it executable: `chmod +x file.AppImage`
- **Missing dependencies**: Install `libgtk-3-0` and `libnotify4`

## Development Notes

### Adding New Features
1. Implement feature in Next.js web app
2. Test in browser first
3. Rebuild web app: `pnpm build && pnpm export`
4. Rebuild desktop app: `cd desktop && npm run build`

### Icon Requirements
- **Windows**: 256x256px ICO file
- **macOS**: 512x512px ICNS file
- **Linux**: 512x512px PNG file

Place icons in `desktop/assets/` folder before building.

## License
MIT License - See LICENSE file for details

## Support
For issues, questions, or feature requests:
- GitHub Issues: https://github.com/finaceverse/epi-xray/issues
- Email: support@finaceverse.com
- Documentation: https://docs.finaceverse.com/epi-xray

---

**Powered by FinACEverse** 🚀
