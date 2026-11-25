// Cloudflare Worker: remembers when your Discord was last online.
// Setup: see README.md ("Last seen")
export default {
  // runs on a schedule (cron) - checks Lanyard and saves the time if you're online
  async scheduled(event, env) {
    const r = await fetch(`https://api.lanyard.rest/v1/users/${env.DISCORD_ID}`);
    const j = await r.json();
    if (j.success && j.data.discord_status !== "offline") {
      await env.KV.put("last_online", String(Date.now()));
    }
  },
  // your website calls this to read the saved time
  async fetch(request, env) {
    const v = await env.KV.get("last_online");
    return new Response(JSON.stringify({ lastOnline: v ? Number(v) : null }), {
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
      },
    });
  },
};
