/* ============================================================
   CONFIG - edit these
   ============================================================ */
const CONFIG = {
  discordId: "865475390561320980",
  useDisplayName: false,                 // false = show @username, true = show display name
  fallbackTag: { text: "ASPH", icon: "assets/guild-tag.png" },
  audioVolume: 0.5,                      // 0 to 1
  shuffle: { duration: 450, stagger: 35, scramble: false, hoverReplay: true },
  views: { enabled: true, namespace: "miraz3301-profile", key: "views", start: 49 },
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
  audio.volume = CONFIG.audioVolume;
  video.play().catch(() => {});
  audio.play().catch(() => {});
  runShuffle(nameEl);
}
enter.addEventListener("click", start);
enter.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") start(); });

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
    if (wi < arr.length - 1) {
      const sp = document.createElement("span");
      sp.className = "space";
      el.append(sp);
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

function runShuffle(el) {
  if (!el.cells) return;
  el.classList.add("ready");
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
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
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

function activityLine(d) {
  if (d.listening_to_spotify && d.spotify) {
    return `Listening to ${d.spotify.song} - ${d.spotify.artist}`;
  }
  const acts = d.activities || [];
  const custom = acts.find((a) => a.type === 4);
  if (custom && (custom.state || custom.emoji)) {
    const emoji = custom.emoji && custom.emoji.name && !custom.emoji.id ? custom.emoji.name + " " : "";
    return (emoji + (custom.state || "")).trim();
  }
  const game = acts.find((a) => a.type === 0);
  if (game) return `Playing ${game.name}`;
  const other = acts.find((a) => a.type !== 4);
  if (other) return other.name;
  return STATUS_LABEL[d.discord_status] || "offline";
}

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
  els.sub.textContent = activityLine(d);

  const g = u.primary_guild;
  if (g && g.tag) {
    els.tagText.textContent = g.tag;
    if (g.badge && g.identity_guild_id) {
      els.tagImg.src = `https://cdn.discordapp.com/guild-tag-badges/${g.identity_guild_id}/${g.badge}.png?size=32`;
    }
  }
}

function showNotMonitored() {
  els.sub.textContent = "offline";
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

/* ============================================================
   Profile views (free counter API, counts once per browser session)
   ============================================================ */
(function views() {
  const v = CONFIG.views;
  if (!v.enabled) return;
  const box = $("views"), out = $("views-count");
  const seen = sessionStorage.getItem("viewed");
  const url = `https://api.counterapi.dev/v1/${v.namespace}/${v.key}/${seen ? "" : "up"}`;
  fetch(url)
    .then((r) => r.json())
    .then((j) => {
      out.textContent = (j.count || 0) + v.start;
      box.hidden = false;
      sessionStorage.setItem("viewed", "1");
    })
    .catch(() => {});
})();
