const output = document.getElementById("output");
const form = document.getElementById("prompt-form");
const input = document.getElementById("command-input");
const clock = document.getElementById("clock");
const quickButtons = document.querySelectorAll("[data-command]");
const history = [];
let historyIndex = -1;

const sections = {
  help: `AVAILABLE COMMANDS

help       Show this command index
about      Load mission briefing
projects   List current demo payloads
system     Show stack and runtime details
contact    Print outbound channel details
theme      Explain visual design intent
clear      Flush terminal output

ALIASES: ls dir whoami info stack mail cls`,
  about: `MISSION BRIEFING

NEON//SHELL is a static single-page demo app built for show-and-tell.
It leans into 90s cyberpunk terminal language without turning into parody.
The interface is intentionally narrow: type commands, get focused responses,
and keep the experience feeling like a console rather than a landing page.`,
  projects: `PROJECT PAYLOADS

[01] SIGNAL TRACE
Timeline visualizer for suspicious network events.

[02] GLASS VAULT
Minimal secure file drop with one-time retrieval links.

[03] NIGHT SHIFT
Ops dashboard for late-hour incident handoffs and acknowledgements.`,
  system: `SYSTEM SNAPSHOT

Runtime: Vanilla HTML + CSS + JavaScript
Routing: In-memory command parser
State: Lightweight command history and output log
Visuals: CRT scanlines, phosphor glow, tactical grid
Mode: Static deployment ready`,
  contact: `OUTBOUND CHANNEL

Operator: demo@neon-shell.local
Relay: +00 000 000 1999
Protocol: secure-handshake://terminal/contact

For a real demo, replace this block with actual team or project contact info.`,
  theme: `VISUAL INTENT

The palette stays inside green-phosphor territory, but the layout is cleaner
than a pure Matrix imitation. The result lands somewhere between BBS console,
CRT workstation, and stylized sci-fi terminal.`,
};

const aliases = {
  cls: "clear",
  dir: "projects",
  info: "about",
  ls: "projects",
  mail: "contact",
  stack: "system",
  whoami: "about",
};

const bootSequence = [
  "BOOTING NEON//SHELL...",
  "PHOSPHOR GRID CALIBRATED",
  "COMMAND INDEX READY",
  "Type 'help' to begin",
];

function stamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function renderEntry(content, type = "user", command = "") {
  const entry = document.createElement("article");
  entry.className = `entry entry--${type}`;

  const meta = document.createElement("div");
  meta.className = "entry__meta";
  meta.textContent = `${stamp()} ${type === "user" ? "INPUT" : "OUTPUT"}${command ? ` :: ${command}` : ""}`;

  const body = document.createElement("div");
  body.className = "entry__content";
  body.textContent = content;

  entry.append(meta, body);
  output.appendChild(entry);
  output.scrollTop = output.scrollHeight;
}

function boot() {
  bootSequence.forEach((line, index) => {
    window.setTimeout(() => renderEntry(line, "system"), 140 * index);
  });
}

function execute(command) {
  const normalized = command.trim().toLowerCase();
  if (!normalized) {
    return;
  }

  history.push(normalized);
  historyIndex = history.length;

  renderEntry(`guest@neon-shell:~$ ${normalized}`, "user", normalized);

  const resolved = aliases[normalized] || normalized;

  if (resolved === "clear") {
    output.innerHTML = "";
    renderEntry("TERMINAL BUFFER CLEARED", "system", normalized);
    return;
  }

  const response = sections[resolved];
  if (response) {
    renderEntry(response, "system", normalized);
    return;
  }

  renderEntry(`UNKNOWN COMMAND: ${normalized}

Type 'help' to inspect available commands.`, "system", normalized);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  execute(input.value);
  input.value = "";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!history.length) {
      return;
    }
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = history[historyIndex];
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!history.length) {
      return;
    }
    historyIndex = Math.min(history.length, historyIndex + 1);
    input.value = historyIndex >= history.length ? "" : history[historyIndex];
  }
});

quickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    execute(button.dataset.command || "");
    input.focus();
  });
});

document.addEventListener("click", () => input.focus());

function syncClock() {
  clock.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false });
}

syncClock();
window.setInterval(syncClock, 1000);
boot();
