# Rock Garden Disco — Instagram feed

`feed.py` keeps `reels.json` + `covers/` on the VPS in sync with the Instagram account. Cron runs it every 15 minutes.
Tests (no real token needed): `python3 test_feed.py`.

## Setting up the Meta app (one-time, ~15 min, you do this part)

Meta moves these screens around, so labels may differ slightly. The goal is one thing: **a long-lived Instagram User access token with the `instagram_business_basic` permission for @therockgarden.tv.**
Because it only reads *your own* account, the app can stay in **Development mode** — no App Review needed.

1. **Account type.** @therockgarden.tv must be a **Professional** account (Business or Creator). Instagram app → Settings → Account type and tools.
2. **Create the app.** <https://developers.facebook.com> → My Apps → Create App → pick the use case about managing **messaging & content on Instagram** (anything that lets you add *Instagram API with Instagram login*). Name it e.g. "WJRN Disco".
3. **Add yourself as a tester.** App Dashboard → App roles → Roles → **Instagram Testers** → add `therockgarden.tv`. Then accept the invite **inside Instagram**: Settings → Apps and websites → Tester invites.
4. **Generate the token.** App Dashboard → Instagram → **API setup with Instagram login** → "Generate access tokens" → add the account → **Generate token** → sign in as that account → copy the token. (This one is already long-lived: 60 days.)
5. **Put it on the server.** Don't paste it into chat. On the VPS (type it in, it won't echo):
   ```bash
   ssh -i /Users/jacebrown/Dropbox/Jacewon/Radio/newradiokey.pem ubuntu@208.113.165.231
   read -rs T && echo "$T" | python3 /opt/wjrn-disco-feed/feed.py --set-token ; unset T
   ```
   It checks the token against Instagram and stores it at `/var/lib/wjrn-disco/the-rock-garden/token.json` (mode 600, outside the web root).
6. **First run + check:**
   ```bash
   python3 /opt/wjrn-disco-feed/feed.py --station the-rock-garden && python3 /opt/wjrn-disco-feed/feed.py --status
   ```

After that the script refreshes the token itself once a week (Meta allows it once the token is ≥24 h old and not yet expired), so it never reaches the 60-day cliff. If a refresh ever fails it logs `WARNING` lines in `/var/lib/wjrn-disco/the-rock-garden/feed.log`.

## Where things live on the VPS

| What | Where |
|---|---|
| script | `/opt/wjrn-disco-feed/feed.py` |
| token + lock + log | `/var/lib/wjrn-disco/<station>/` (700) |
| `reels.json`, `covers/` | `/var/www/wjrn-disco-data/<station>/` — **outside** `/var/www/wjrn-landing`, because `deploy.sh` rsyncs that folder with `--delete` and would wipe them |
| served at | `/<station>/disco/data/reels.json`, `/<station>/disco/data/covers/<id>.jpg` |

## Safety rules the script enforces
- On any API error, the last good `reels.json` stays. Nothing is half-written (atomic replace).
- Never publishes an empty list, or one under half the size of the current list (looks partial). `--force` overrides the second.
- Never uses `media_url`. Covers come from `thumbnail_url`, are downloaded to our own origin, and black letterbox bars are trimmed.
- The token never appears in logs.
