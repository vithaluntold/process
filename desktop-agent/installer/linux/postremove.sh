#!/bin/bash
set -e

APP_NAME="epi-q-agent"
AUTOSTART_FILE="/etc/xdg/autostart/${APP_NAME}.desktop"
CONFIG_DIR="$HOME/.config/epi-q-agent"

echo "Running post-removal script for EPI-Q Agent..."

if [ -f "$AUTOSTART_FILE" ]; then
    rm -f "$AUTOSTART_FILE"
    echo "Removed autostart entry."
fi

update-desktop-database /usr/share/applications 2>/dev/null || true

echo "EPI-Q Agent removal completed."
echo "Note: User configuration files in $CONFIG_DIR were preserved."
echo "To remove all data, manually delete: $CONFIG_DIR"
