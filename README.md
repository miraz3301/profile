# miraz3301 profile site

## 1. Add your video and music (required)
Your exported file only linked to guns.lol's servers, so download them and save here:

- Video  -> `assets/background.mp4`  (https://r2.guns.lol/fa9f3ac0-8830-4fe2-bf0f-2b38bbe5c1ba.mp4)
- Music  -> `assets/music.mp3`       (https://r2.guns.lol/edc222df-c7bf-4634-b9ef-36622e69f07a.mp3)

Keep each file under ~25 MB (GitHub hard limit is 100 MB). Compress the video if needed:
`ffmpeg -i in.mp4 -vf scale=1280:-2 -crf 28 -an assets/background.mp4`

## 2. Discord live status
Join https://discord.gg/lanyard with your Discord account (once). Lanyard only tracks
accounts that are in that server. Your ID is already set in `script.js` (CONFIG.discordId).

## 3. Deploy on GitHub Pages
1. Create a repo (e.g. `miraz3301.github.io` for a root URL, or any name).
2. Upload all files (index.html, style.css, script.js, assets/, .nojekyll).
3. Repo -> Settings -> Pages -> Source: "Deploy from a branch" -> `main` / `/ (root)` -> Save.
4. Open https://miraz3301.github.io (or /repo-name/) after ~1 minute.

Test locally with `python3 -m http.server` (opening index.html directly also works).
