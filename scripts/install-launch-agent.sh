#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_DIR="$HOME/Library/LaunchAgents"
OLD_PLIST_PATH="$PLIST_DIR/com.learning-priority-app.plist"
PLIST_PATH="$PLIST_DIR/com.mindgarden.app.plist"
LABEL="com.mindgarden.app"

mkdir -p "$PLIST_DIR"

cat >"$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$LABEL</string>

    <key>ProgramArguments</key>
    <array>
      <string>/usr/bin/python3</string>
      <string>$APP_DIR/serve.py</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>WorkingDirectory</key>
    <string>$APP_DIR</string>

    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/mindgarden.log</string>

    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/mindgarden.error.log</string>
  </dict>
</plist>
PLIST

launchctl unload "$OLD_PLIST_PATH" >/dev/null 2>&1 || true
rm -f "$OLD_PLIST_PATH"
launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Installed LaunchAgent: $PLIST_PATH"
echo "MindGarden URL: http://127.0.0.1:8123"
