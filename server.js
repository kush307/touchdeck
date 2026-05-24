// iPhone-as-trackpad server.
// Run on Mac:  npm install && npm start
// Then open the printed URL in Safari on your iPhone (same Wi-Fi).
//
// Requires:
//   brew install cliclick
//   System Settings → Privacy & Security → Accessibility → enable Terminal/iTerm
//   (so cliclick + osascript can synthesize input)

import express from "express";
import { WebSocketServer } from "ws";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { networkInterfaces } from "node:os";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8765;
const HTTPS_PORT = 8766;

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = createServer(app);

let httpsServer;
try {
  const opts = {
    key: readFileSync(path.join(__dirname, "key.pem")),
    cert: readFileSync(path.join(__dirname, "cert.pem")),
  };
  httpsServer = createHttpsServer(opts, app);
} catch {}
const wss = new WebSocketServer({ noServer: true });

function handleUpgrade(srv) {
  srv.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });
}
handleUpgrade(server);
if (httpsServer) handleUpgrade(httpsServer);

// ---------- input helpers ----------

function run(cmd, args) {
  return new Promise((resolve) => {
    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) console.error(cmd, args.join(" "), stderr || err.message);
      resolve();
    });
  });
}

// Persistent mouse-move helper using Core Graphics (no process spawn per move).
const mouseProc = spawn(path.join(__dirname, "mousemove"), [], { stdio: ["pipe", "pipe", "inherit"] });
mouseProc.on("exit", () => console.error("mousemove helper exited"));

let screenW = 1920, screenH = 1080;
let lineBuffer = "";
mouseProc.stdout.on("data", (chunk) => {
  lineBuffer += chunk.toString();
  let nl;
  while ((nl = lineBuffer.indexOf("\n")) !== -1) {
    const line = lineBuffer.slice(0, nl);
    lineBuffer = lineBuffer.slice(nl + 1);
    const m = line.match(/^s (\d+) (\d+)$/);
    if (m) { screenW = +m[1]; screenH = +m[2]; }
  }
});
mouseProc.stdin.write("s\n");

function moveRelative(dx, dy) {
  mouseProc.stdin.write(`m ${dx} ${dy}\n`);
  return Promise.resolve();
}

function moveAbsolute(x, y) {
  mouseProc.stdin.write(`a ${x} ${y}\n`);
  return Promise.resolve();
}

function click(button = "left") {
  // c: = left click at current pos, rc: = right click
  return run("cliclick", [button === "right" ? "rc:." : "c:."]);
}

function doubleClick() {
  return run("cliclick", ["dc:."]);
}

function scroll(dx, dy) {
  // cliclick doesn't scroll; use AppleScript via System Events
  // Negative dy = scroll up. We send a few discrete ticks.
  const ticks = Math.max(-10, Math.min(10, Math.round(dy / 20)));
  if (ticks === 0) return Promise.resolve();
  const direction = ticks > 0 ? "down" : "up";
  const n = Math.abs(ticks);
  const script = `tell application "System Events" to repeat ${n} times
    scroll ${direction}
  end repeat`;
  // Most macOS versions don't support `scroll` in System Events.
  // Fall back to key code arrows for predictable behavior.
  const keyCode = ticks > 0 ? 125 : 126; // down / up arrow
  const arrowScript = `tell application "System Events" to repeat ${n} times
    key code ${keyCode}
  end repeat`;
  return run("osascript", ["-e", arrowScript]);
}

// AppleScript-escape a string for a double-quoted literal.
function asEscape(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function typeText(text) {
  if (!text) return Promise.resolve();
  const script = `tell application "System Events" to keystroke "${asEscape(text)}"`;
  return run("osascript", ["-e", script]);
}

// Special keys by AppleScript key code.
const KEY_CODES = {
  Backspace: 51,
  Enter: 36,
  Tab: 48,
  Escape: 53,
  Space: 49,
  ArrowLeft: 123,
  ArrowRight: 124,
  ArrowDown: 125,
  ArrowUp: 126,
  Delete: 117,
  Home: 115,
  End: 119,
  PageUp: 116,
  PageDown: 121,
};

function pressKey(name, modifiers = []) {
  const code = KEY_CODES[name];
  if (code === undefined) return Promise.resolve();
  const mods = modifiers
    .map((m) => {
      if (m === "cmd") return "command down";
      if (m === "shift") return "shift down";
      if (m === "alt" || m === "option") return "option down";
      if (m === "ctrl" || m === "control") return "control down";
      return null;
    })
    .filter(Boolean);
  const using = mods.length
    ? ` using {${mods.join(", ")}}`
    : "";
  const script = `tell application "System Events" to key code ${code}${using}`;
  return run("osascript", ["-e", script]);
}

// ---------- websocket protocol ----------

wss.on("connection", (ws) => {
  console.log("client connected");
  ws.send(JSON.stringify({ type: "screen", w: screenW, h: screenH }));

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (msg.type) {
      case "move":
        moveRelative(msg.dx, msg.dy);
        break;
      case "moveto":
        moveAbsolute(msg.x, msg.y);
        break;
      case "click":
        await click(msg.button || "left");
        break;
      case "doubleclick":
        await doubleClick();
        break;
      case "scroll":
        await scroll(msg.dx || 0, msg.dy || 0);
        break;
      case "text":
        await typeText(msg.value);
        break;
      case "key":
        await pressKey(msg.name, msg.modifiers || []);
        break;
    }
  });
});

// ---------- start ----------

function localIPs() {
  const out = [];
  for (const [, ifs] of Object.entries(networkInterfaces())) {
    for (const i of ifs || []) {
      if (i.family === "IPv4" && !i.internal) out.push(i.address);
    }
  }
  return out;
}

server.listen(PORT, "0.0.0.0", () => {
  const ips = localIPs();
  console.log("\nTouchDeck listening on:");
  for (const ip of ips) console.log(`  http://${ip}:${PORT}`);
  console.log(`  http://localhost:${PORT}`);
  if (httpsServer) {
    httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
      console.log("\nFor Air Mouse (requires HTTPS):");
      for (const ip of ips) console.log(`  https://${ip}:${HTTPS_PORT}`);
      console.log(`\nUse the HTTPS URL on your iPhone for air mouse support.`);
    });
  }
});
