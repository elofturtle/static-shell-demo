const output = document.getElementById("output");
const form = document.getElementById("prompt-form");
const input = document.getElementById("command-input");
const clock = document.getElementById("clock");
const quickButtons = document.querySelectorAll("[data-command]");
const history = [];
let historyIndex = -1;
let outputQueue = Promise.resolve();

const projects = [
  {
    index: 1,
    title: "SIGNAL TRACE",
    slug: "signal-trace",
    summary: "Timeline visualizer for suspicious network events.",
    file: "projects/signal-trace.md",
  },
  {
    index: 2,
    title: "GLASS VAULT",
    slug: "glass-vault",
    summary: "Minimal secure file drop with one-time retrieval links.",
    file: "projects/glass-vault.md",
  },
  {
    index: 3,
    title: "NIGHT SHIFT",
    slug: "night-shift",
    summary: "Ops dashboard for late-hour incident handoffs and acknowledgements.",
    file: "projects/night-shift.md",
  },
];

const projectCache = new Map();

const sections = {
  help: `AVAILABLE COMMANDS

help                 Show this command index
about                Load mission briefing
projects             List current demo payloads
project <index> || <title     Open project article by index or title
system               Show stack and runtime details
contact              Print outbound channel details
clear                Flush terminal output

EXAMPLES
project 1
project signal
open glass vault

ALIASES: ls dir whoami info stack mail cls cat man open`,
  about: `MISSION BRIEFING

NEON//SHELL is a static single-page demo app built for show-and-tell.
It leans into 90s cyberpunk terminal language without turning into parody.
The interface is intentionally narrow: type commands, get focused responses,
and keep the experience feeling like a console rather than a landing page.`,
  system: `SYSTEM SNAPSHOT

Runtime: Vanilla HTML + CSS + JavaScript
Routing: In-memory command parser plus markdown file loader
State: Lightweight command history, output queue, project cache
Visuals: CRT scanlines, phosphor glow, tactical grid
Mode: Static deployment ready with external project content`,
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
  cat: "project",
  cls: "clear",
  dir: "projects",
  info: "about",
  ls: "projects",
  mail: "contact",
  man: "project",
  open: "project",
  stack: "system",
  whoami: "about",
};

const bootSequence = [
  "BOOTING NEON//SHELL...",
  "PHOSPHOR GRID CALIBRATED",
  "PROJECT INDEX MOUNTED",
  "Type 'help' to begin",
];

function stamp() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function scrollToLatest() {
  output.scrollTop = output.scrollHeight;
  window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
  scrollToLatest();
}

async function typeEntry(content, type = "system", command = "", speed = 10) {
  const entry = document.createElement("article");
  entry.className = `entry entry--${type}`;

  const meta = document.createElement("div");
  meta.className = "entry__meta";
  meta.textContent = `${stamp()} ${type === "user" ? "INPUT" : "OUTPUT"}${command ? ` :: ${command}` : ""}`;

  const body = document.createElement("div");
  body.className = "entry__content entry__content--typing";

  entry.append(meta, body);
  output.appendChild(entry);
  scrollToLatest();

  for (const character of content) {
    body.textContent += character;
    scrollToLatest();
    await wait(character === "\n" ? speed * 0.7 : speed);
  }

  body.classList.remove("entry__content--typing");
  scrollToLatest();
}

function queueTypedEntry(content, type = "system", command = "", speed = 10) {
  outputQueue = outputQueue.then(() => typeEntry(content, type, command, speed));
  return outputQueue;
}

function buildProjectIndex() {
  return `PROJECT PAYLOADS

${projects.map((project) => `[${String(project.index).padStart(2, "0")}] ${project.title}
${project.summary}`).join("\n\n")}

Open by number or title:
project 1
project night shift`;
}

function sanitizeQuery(value) {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function findProjects(query) {
  const normalized = sanitizeQuery(query);
  if (!normalized) {
    return [];
  }

  if (/^\d+$/.test(normalized)) {
    const byIndex = projects.find((project) => project.index === Number(normalized));
    return byIndex ? [byIndex] : [];
  }

  return projects.filter((project) => {
    const title = sanitizeQuery(project.title);
    const slug = sanitizeQuery(project.slug);
    return title.includes(normalized) || slug.includes(normalized);
  });
}

function formatMarkdownAsManPage(markdown) {
  const lines = markdown.split(/\r?\n/);
  const outputLines = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      outputLines.push(line.slice(2).toUpperCase());
      continue;
    }

    if (line.startsWith("## ")) {
      outputLines.push("");
      outputLines.push(line.slice(3).toUpperCase());
      outputLines.push("");
      continue;
    }

    outputLines.push(line.replace(/`([^`]+)`/g, "$1"));
  }

  return outputLines.join("\n").trim();
}

async function loadProjectArticle(project) {
  if (projectCache.has(project.file)) {
    return projectCache.get(project.file);
  }

  const response = await fetch(project.file);
  if (!response.ok) {
    throw new Error(`Unable to load ${project.file}`);
  }

  const markdown = await response.text();
  const article = formatMarkdownAsManPage(markdown);
  projectCache.set(project.file, article);
  return article;
}

async function openProject(query, command) {
  const matches = findProjects(query);

  if (matches.length === 0) {
    queueTypedEntry(`NO PROJECT MATCH FOR: ${query}

Use 'projects' to inspect the index.`, "system", command);
    return;
  }

  if (matches.length > 1) {
    queueTypedEntry(`MULTIPLE MATCHES

${matches.map((project) => `[${String(project.index).padStart(2, "0")}] ${project.title}`).join("\n")}

Refine the title or use the numeric index.`, "system", command);
    return;
  }

  const project = matches[0];

  queueTypedEntry(`RESOLVED PROJECT :: [${String(project.index).padStart(2, "0")}] ${project.title}
LOADING ARTICLE FROM ${project.file}`, "system", command, 8);

  outputQueue = outputQueue
    .then(() => loadProjectArticle(project))
    .then((article) => typeEntry(article, "system", command, 6))
    .catch(() => typeEntry(`ARTICLE LOAD FAILURE

The markdown file could not be loaded. If you opened this page directly via file://,
serve the folder over a local HTTP server so fetch() can read project content.`, "system", command, 10));
}

function boot() {
  bootSequence.forEach((line) => {
    queueTypedEntry(line, "system", "", 10);
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

  const [rawCommand, ...rest] = normalized.split(/\s+/);
  const resolvedCommand = aliases[rawCommand] || rawCommand;
  const args = rest.join(" ").trim();

  if (resolvedCommand === "clear") {
    output.innerHTML = "";
    queueTypedEntry("TERMINAL BUFFER CLEARED", "system", normalized, 10);
    return;
  }

  if (resolvedCommand === "projects") {
    queueTypedEntry(buildProjectIndex(), "system", normalized);
    return;
  }

  if (resolvedCommand === "project") {
    if (!args) {
      queueTypedEntry(`PROJECT TARGET REQUIRED

Use an index or title:
project 2
project glass vault`, "system", normalized);
      return;
    }

    openProject(args, normalized);
    return;
  }

  const response = sections[resolvedCommand];
  if (response) {
    queueTypedEntry(response, "system", normalized);
    return;
  }

  queueTypedEntry(`UNKNOWN COMMAND: ${normalized}

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
