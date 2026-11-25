# miraz3301 profile site

## 1. Add your video and music (required)
Your exported file only linked to guns.lol's servers, so download them and save here:

- Video  -> `assets/background.mp4`  (https://r2.guns.lol/fa9f3ac0-8830-4fe2-bf0f-2b38bbe5c1ba.mp4)
- Music  -> `assets/music.mp3`       (https://r2.guns.lol/edc222df-c7bf-4634-b9ef-36622e69f07a.mp3)

Keep each file under ~25 MB (GitHub hard limit is 100 MB). Compress the video if needed:
`ffmpeg -i in.mp4 -vf scale=1280:-2 -crf 28 -an assets/background.mp4`

## 1b. Font (to match guns.lol exactly)
Open https://assets.guns.lol/fonts/X6XYTKIVDUW7GZTZPZNN4EUM5KH54KHF.woff2 in your browser,
save the file as `assets/font.woff2`. style.css already points to it.

## 2. Discord live status
Join https://discord.gg/lanyard with your Discord account (once). Lanyard only tracks
accounts that are in that server. Your ID is already set in `script.js` (CONFIG.discordId).

## 3. Deploy on GitHub Pages
1. Create a repo (e.g. `miraz3301.github.io` for a root URL, or any name).
2. Upload all files (index.html, style.css, script.js, assets/, .nojekyll).
3. Repo -> Settings -> Pages -> Source: "Deploy from a branch" -> `main` / `/ (root)` -> Save.
4. Open https://miraz3301.github.io (or /repo-name/) after ~1 minute.

Test locally with `python3 -m http.server` (opening index.html directly also works).

## 4. Last seen "x minutes ago" (optional but needed for exact match)
Lanyard doesn't provide it, so a tiny free Cloudflare Worker remembers it:
1. dash.cloudflare.com -> Workers & Pages -> Create -> "Hello World" -> Deploy -> Edit code.
2. Paste `worker/last-seen-worker.js`, Deploy.
3. Worker -> Settings -> Bindings -> Add -> KV namespace (create one), variable name `KV`.
4. Settings -> Variables -> add `DISCORD_ID` = 865475390561320980.
5. Settings -> Triggers -> Cron -> add `*/2 * * * *`.
6. Copy the worker URL (https://NAME.USER.workers.dev) into `lastSeenUrl` in script.js CONFIG.
