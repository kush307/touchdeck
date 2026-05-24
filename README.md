# TouchDeck

Turn your iPhone into a wireless trackpad, keyboard, and air mouse for your Mac.

A lightweight web app that runs on your Mac and serves a touch-friendly control surface to your iPhone over Wi-Fi. No app install needed on the iPhone — just open a URL in Safari.

## Features

- **Trackpad** — drag to move the cursor with acceleration and smooth movement
- **Air Mouse** — tilt your iPhone like a TV remote to control the cursor using the built-in gyroscope
- **Clicks** — left click, right click, double click (tap, two-finger tap, or buttons)
- **Scroll** — two-finger scroll on the trackpad or use the side scroll bar
- **Keyboard** — arrow keys, Escape, Tab, and other special keys
- **Text Input** — live text entry sent directly to your Mac
- **Low Latency** — native Core Graphics helper for smooth cursor movement (no process spawn per move)
- **Screen Centering** — cursor automatically moves to screen center when air mouse activates

## How It Works

TouchDeck communicates over your local Wi-Fi network — no Bluetooth required. The Mac runs a web server that your iPhone connects to via Safari using HTTP/HTTPS and WebSocket. Both devices must be on the same Wi-Fi network.

## Requirements

- macOS
- Node.js 18+
- Xcode Command Line Tools (`xcode-select --install`)
- [cliclick](https://github.com/BlueM/cliclick) — `brew install cliclick`

## Setup

```bash
git clone https://github.com/kush307/touchdeck.git
cd touchdeck
npm install
```

The native mouse helper compiles automatically during `npm install`. If you need to rebuild it manually:

```bash
cc -O2 -o mousemove mousemove.c -framework ApplicationServices
```

### Generate HTTPS certificate (required for Air Mouse)

iOS requires HTTPS for gyroscope access. Generate a self-signed certificate:

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=touchdeck"
```

### Grant permissions

Go to **System Settings → Privacy & Security → Accessibility** and enable your terminal app (Terminal.app or iTerm).

### Firewall

If your iPhone can't connect, go to **System Settings → Network → Firewall → Options** and add an exception for Node.js (`which node` to find the path).

## Usage

```bash
npm start
```

The server starts on two ports:

- **HTTP** `http://<your-mac-ip>:8765` — trackpad, keyboard, clicks, scroll
- **HTTPS** `https://<your-mac-ip>:8766` — all features including air mouse

Open the HTTPS URL in Safari on your iPhone (both devices must be on the same Wi-Fi network). Safari will show a certificate warning for the self-signed cert — tap **Show Details → Visit this website** to proceed.

### Air Mouse

Tap the **Air** button to toggle air mouse mode. On first use, iOS will ask for motion permission — allow it. Hold your iPhone and tilt your wrist to move the cursor. The trackpad still works for tapping/clicking while air mouse is active.

## License

MIT
