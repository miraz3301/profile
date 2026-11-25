/* ============================================================
   CONFIG - edit these
   ============================================================ */
const CONFIG = {
  discordId: "865475390561320980",
  useDisplayName: false,                 // false = show @username, true = show display name
  fallbackTag: { text: "ASPH", icon: "assets/guild-tag.png" },
  // Optional: URL of the little Cloudflare Worker that remembers when you were last online
  // (see README / chat). Leave "" to use the fallback (only remembers within a visitor's browser).
  lastSeenUrl: "",
  audioVolume: 0.5,                      // 0 to 1
  shuffle: { duration: 450, stagger: 35, scramble: false, hoverReplay: true, loop: true, loopDelay: 1200 },
};

/* ============================================================
   Click to enter -> start video + music
   ============================================================ */
const enter = document.getElementById("enter");
const video = document.getElementById("bg-video");
const audio = document.getElementById("bg-audio");
let entered = false;

function start() {
  if (entered) return;
  entered = true;
  enter.classList.add("hide");
  video.play().catch(() => {});
  audio.play().catch(() => {});
  runShuffle(nameEl);
}
enter.addEventListener("click", start);
enter.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") start(); });

/* ============================================================
   Volume control (hover to open, drag to change, click icon to mute)
   ============================================================ */
const volBox = document.getElementById("volume");
const volBtn = document.getElementById("vol-btn");
const volRange = document.getElementById("vol-range");
let lastVol = CONFIG.audioVolume || 0.5;

function setVolume(v) {
  v = Math.min(1, Math.max(0, v));
  audio.volume = v;
  volRange.value = Math.round(v * 100);
  volRange.style.setProperty("--v", volRange.value + "%");
  volBox.classList.toggle("muted", v === 0);
  if (v > 0) lastVol = v;
}
volRange.addEventListener("input", () => setVolume(volRange.value / 100));
volBtn.addEventListener("click", () => setVolume(audio.volume > 0 ? 0 : lastVol));
setVolume(CONFIG.audioVolume);

/* ============================================================
   Username "shuffle" effect (slides each letter in from the left)
   ============================================================ */
const nameEl = document.getElementById("name");
const SCRAMBLE = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function buildShuffle(el) {
  const text = el.getAttribute("aria-label") || el.textContent;
  el.textContent = "";
  el.cells = [];
  text.split(" ").forEach((word, wi, arr) => {
    const w = document.createElement("span");
    w.className = "word";
    w.setAttribute("aria-hidden", "true");
    [...word].forEach((c) => {
      const cell = document.createElement("span");
      cell.className = "cell";
      const strip = document.createElement("span");
      strip.className = "strip";
      const make = (ch) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        return s;
      };
      const rnd = () => SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      const mid = CONFIG.shuffle.scramble ? rnd : () => c;
      // [final char][filler][start char] - slides right, ending on the first one
      strip.append(make(c), make(mid()), make(mid()));
      cell.append(strip);
      w.append(cell);
      el.cells.push({ cell, strip });
    });
    el.append(w);
     if (wi === 1) {                       // line break after "Miraz"
      const br = document.createElement("span");
      br.className = "line-break";
      el.append(br);
    }
  });
}

function measureShuffle(el) {
  el.cells.forEach(({ cell, strip }) => {
    const w = strip.children[0].getBoundingClientRect().width;
    Array.from(strip.children).forEach((c) => (c.style.width = w + "px"));
    cell.style.width = w + "px";
    strip.dataset.w = w;
  });
}

let loopTimer;
function runShuffle(el) {
  if (!el.cells) return;
  el.classList.add("ready");
  clearTimeout(loopTimer);
  if (CONFIG.shuffle.loop) {
    const total = CONFIG.shuffle.duration + el.cells.length * CONFIG.shuffle.stagger;
    loopTimer = setTimeout(() => runShuffle(el), total + CONFIG.shuffle.loopDelay);
  }
  el.cells.forEach(({ strip }, i) => {
    const w = parseFloat(strip.dataset.w);
    strip.animate(
      [{ transform: `translateX(${-2 * w}px)` }, { transform: "translateX(0)" }],
      {
        duration: CONFIG.shuffle.duration,
        delay: i * CONFIG.shuffle.stagger,
        easing: "cubic-bezier(.215,.61,.355,1)",
        fill: "both",
      }
    );
  });
}

buildShuffle(nameEl);
// wait for assets/font.woff2 before measuring the letters
Promise.resolve(document.fonts && document.fonts.load("400 39.5px Satoshi"))
  .catch(() => {})
  .then(() => document.fonts && document.fonts.ready)
  .then(() => {
  measureShuffle(nameEl);
  nameEl.classList.add("ready");       // visible (at final position) behind the overlay
  if (CONFIG.shuffle.hoverReplay) {
    nameEl.addEventListener("mouseenter", () => entered && runShuffle(nameEl));
  }
});
window.addEventListener("resize", () => measureShuffle(nameEl));

/* ============================================================
   Live Discord status via Lanyard
   IMPORTANT: join https://discord.gg/lanyard once, with the same
   Discord account, or the API returns "user not monitored".
   ============================================================ */
const $ = (id) => document.getElementById(id);
const els = {
  avatar: $("p-avatar-img"), deco: $("p-deco"), status: $("p-status"),
  name: $("p-name"), sub: $("p-sub"), tag: $("p-tag"),
  tagImg: $("p-tag-img"), tagText: $("p-tag-text"),
};
const STATUS_LABEL = { online: "online", idle: "idle", dnd: "do not disturb", offline: "offline" };

/* ---- the line under your name: note (custom status) / activity / last seen ---- */
let lastData = null;       // latest presence from Lanyard
let lastOnline = Number(localStorage.getItem("lastOnline")) || null;  // ms timestamp

function ago(ms) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const d = Math.floor(h / 24);
  return d + (d === 1 ? " day ago" : " days ago");
}

function addEmoji(box, e) {
  if (!e) return;
  if (e.id) {
    const img = document.createElement("img");
    img.className = "emoji";
    img.alt = e.name || "";
    img.src = `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "webp"}?size=48&quality=lossless`;
    box.append(img);
  } else if (e.name) {
    const s = document.createElement("span");
    s.className = "txt";
    s.textContent = e.name + " ";
    box.append(s);
  }
}

function renderSub() {
  const d = lastData;
  const box = els.sub;
  box.textContent = "";
  if (!d) return;
  const status = d.discord_status || "offline";

  if (status === "offline") {
    const s = document.createElement("span");
    s.className = "italic txt";
    s.textContent = lastOnline ? "last seen " + ago(lastOnline) : "offline";
    box.append(s);
    return;
  }

  const acts = d.activities || [];
  const custom = acts.find((a) => a.type === 4);
  let line = "";
  if (d.listening_to_spotify && d.spotify) line = `Listening to ${d.spotify.song} - ${d.spotify.artist}`;
  else {
    const game = acts.find((a) => a.type === 0);
    if (game) line = `Playing ${game.name}`;
  }

  if (line) {                      // activity wins over the note
    const s = document.createElement("span");
    s.className = "txt";
    s.textContent = line;
    box.append(s);
  } else if (custom && (custom.state || custom.emoji)) {   // your note, e.g. the cat emoji
    addEmoji(box, custom.emoji);
    if (custom.state) {
      const s = document.createElement("span");
      s.className = "txt";
      s.textContent = custom.state;
      box.append(s);
    }
  } else {
    const s = document.createElement("span");
    s.className = "txt";
    s.textContent = STATUS_LABEL[status] || status;
    box.append(s);
  }
}

// keep "x minutes ago" fresh
setInterval(renderSub, 30000);

// ask the optional Worker when you were last online
function loadLastSeen() {
  if (!CONFIG.lastSeenUrl) return;
  fetch(CONFIG.lastSeenUrl)
    .then((r) => r.json())
    .then((j) => {
      if (j && j.lastOnline) {
        lastOnline = Math.max(lastOnline || 0, j.lastOnline);
        renderSub();
      }
    })
    .catch(() => {});
}
loadLastSeen();
setInterval(loadLastSeen, 120000);

function renderPresence(d) {
  const u = d.discord_user || {};
  const status = d.discord_status || "offline";

  els.name.textContent = CONFIG.useDisplayName ? (u.global_name || u.username) : u.username || els.name.textContent;

  if (u.avatar) {
    const ext = u.avatar.startsWith("a_") ? "gif" : "png";
    els.avatar.src = `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=128`;
  }
  els.avatar.onerror = () => { els.avatar.src = "assets/discord-avatar.webp"; };

  const deco = u.avatar_decoration_data && u.avatar_decoration_data.asset;
  if (deco) {
    els.deco.src = `https://cdn.discordapp.com/avatar-decoration-presets/${deco}.png?size=128`;
    els.deco.hidden = false;
    els.avatar.parentElement.classList.add("round");
  } else {
    els.deco.hidden = true;
    els.avatar.parentElement.classList.remove("round");
  }

  els.status.className = "status " + status;
  els.status.title = STATUS_LABEL[status] || status;

  lastData = d;
  if (status !== "offline") {          // seen online right now
    lastOnline = Date.now();
    localStorage.setItem("lastOnline", String(lastOnline));
  }
  renderSub();

  const g = u.primary_guild;
  if (g && g.tag) {
    els.tagText.textContent = g.tag;
    if (g.badge && g.identity_guild_id) {
      els.tagImg.src = `https://cdn.discordapp.com/guild-tag-badges/${g.identity_guild_id}/${g.badge}.png?size=32`;
    }
  }
}

function showNotMonitored() {
  lastData = { discord_status: "offline" };
  renderSub();
}

// initial paint via REST
fetch(`https://api.lanyard.rest/v1/users/${CONFIG.discordId}`)
  .then((r) => r.json())
  .then((j) => (j.success ? renderPresence(j.data) : showNotMonitored()))
  .catch(showNotMonitored);

// realtime via WebSocket
function connectLanyard() {
  let hb;
  const ws = new WebSocket("wss://api.lanyard.rest/socket");
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.op === 1) {
      ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: CONFIG.discordId } }));
      hb = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
    } else if (msg.op === 0 && msg.d) {
      renderPresence(msg.d);
    }
  };
  ws.onclose = () => { clearInterval(hb); setTimeout(connectLanyard, 5000); };
  ws.onerror = () => ws.close();
}
connectLanyard();
