# TouchDeck

Turn your iPhone into a wireless trackpad and keyboard for your Mac.

A lightweight web app that runs on your Mac and serves a touch-friendly control surface to your iPhone over Wi-Fi. No app install needed on the iPhone — just open a URL in Safari.

## Features

- Trackpad with acceleration and smooth cursor movement
- Left click, right click, double click
- Two-finger scroll
- Arrow keys, Escape, Tab, and other special keys
- Live text input with backspace support
- Low-latency mouse movement via native Core Graphics helper

## Requirements

- macOS
- Node.js 18+
- Xcode Command Line Tools (`xcode-select --install`)
- [cliclick](https://github.com/BlueM/cliclick) — `brew install cliclick`

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/touchdeck.git
cd touchdeck
npm install
cc -O2 -o mousemove mousemove.c -framework ApplicationServices
```

### Grant permissions

Go to **System Settings → Privacy & Security → Accessibility** and enable your terminal app (Terminal.app or iTerm).

## Usage

```bash
npm start
```

Open the printed URL (e.g. `http://192.168.x.x:8765`) in Safari on your iPhone. Both devices must be on the same Wi-Fi network.

## License

MIT
