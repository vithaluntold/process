#!/bin/bash
set -e

APP_NAME="epi-q-agent"
DESKTOP_FILE="/usr/share/applications/${APP_NAME}.desktop"
AUTOSTART_DIR="/etc/xdg/autostart"

echo "Running post-installation script for EPI-Q Agent..."

if [ ! -d "$AUTOSTART_DIR" ]; then
    mkdir -p "$AUTOSTART_DIR"
fi

cat > "${AUTOSTART_DIR}/${APP_NAME}.desktop" << EOF
[Desktop Entry]
Type=Application
Name=EPI-Q Agent
Exec=/opt/EPI-Q Agent/epi-q-agent --hidden
Icon=epi-q-agent
Terminal=false
Categories=Utility;
StartupNotify=false
X-GNOME-Autostart-enabled=true
EOF

chmod 644 "${AUTOSTART_DIR}/${APP_NAME}.desktop"

update-desktop-database /usr/share/applications 2>/dev/null || true

if command -v gtk-update-icon-cache &> /dev/null; then
    gtk-update-icon-cache -f /usr/share/icons/hicolor 2>/dev/null || true
fi

echo "EPI-Q Agent installation completed successfully."
