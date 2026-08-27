# MindGarden

A tiny local-first app for capturing learning topics, terms, and ideas without losing them.

## Run it once

1. Open `index.html` directly in your browser, or
2. Start a tiny local server:

```bash
python3 serve.py
```

Then open `http://127.0.0.1:8123`.

## Keep it always available after restart

This repo stays free of personal names and machine-specific paths. For macOS auto-start, it includes a local installer script that generates your LaunchAgent on your machine instead of storing your personal path in GitHub.

Install it locally:

```bash
./scripts/install-launch-agent.sh
```

Useful commands:

```bash
launchctl load ~/Library/LaunchAgents/com.mindgarden.app.plist
launchctl unload ~/Library/LaunchAgents/com.mindgarden.app.plist
launchctl kickstart -k gui/$(id -u)/com.mindgarden.app
./scripts/uninstall-launch-agent.sh
```

Permanent local link:

`http://127.0.0.1:8123`

## What it does

- Add items with a title, optional notes, and a type:
  - Learning topic
  - Term / jargon
  - Idea
- Drag items between:
  - Inbox
  - Focus Now
  - Explore Soon
  - Later
- Save everything in `localStorage` so refreshes keep your data
- Resurface stale items in a **Review today** section
- Mark review items as **Reviewed** or push them to **Tomorrow**

## Opinionated MVP choices

- New items start in **Inbox**
- Review cadence defaults by type:
  - Term / jargon: every 2 days
  - Idea: every 5 days
  - Learning topic: every 7 days
- Moving cards changes their priority/state but does not change review cadence

## Files

- `index.html` – structure
- `styles.css` – calming local-first UI
- `app.js` – drag/drop, persistence, and review logic
- `serve.py` – tiny local server for browser access and autostart
- `scripts/install-launch-agent.sh` – creates a local macOS LaunchAgent without committing personal paths
- `scripts/uninstall-launch-agent.sh` – removes the local macOS LaunchAgent
