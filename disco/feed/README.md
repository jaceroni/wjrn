# Rock Garden Disco — YouTube playlist feed

Every tile is one video from a YouTube playlist (Rock Garden: `PLUSeDm1idbX0`, "TRG"). `feed.py` keeps `reels.json` + `covers/`
on the VPS in sync with it; cron runs it every 15 minutes. Tests (no real key needed): `python3 test_feed.py`.

## One-time setup: a free YouTube Data API key (you, ~5 min)

A key is **required** — the playlist's public RSS feed was tried and returned 14 of a 71-video playlist, so it isn't used.

1. <https://console.cloud.google.com> → create a project (e.g. "WJRN Disco").
2. **APIs & Services → Library** → search **YouTube Data API v3** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Click the key → **API restrictions → Restrict key → YouTube Data API v3** only. (Optional but good: **Application restrictions → IP addresses → `208.113.165.231`**, the VPS.)
5. Save the key in a text file on your computer and tell Claude the path (it's sent to the server without being printed — don't paste it in chat), or on the VPS:
   ```bash
   read -rs K && echo "$K" | python3 /opt/wjrn-disco-feed/feed.py --set-key --playlist PLUSeDm1idbX0 ; unset K
   ```
6. First run + check:
   ```bash
   python3 /opt/wjrn-disco-feed/feed.py --station the-rock-garden --playlist PLUSeDm1idbX0 && python3 /opt/wjrn-disco-feed/feed.py --station the-rock-garden --status
   ```

Quota is 10,000 units/day free; a run costs about 6 units for 71 videos (≈ 600/day at every-15-minutes).

## What it does
- Reads the whole playlist, then each video's details. **Skips** anything that can't be embedded, or is deleted / private / live / still processing — never a blank tile. The ball is cut to however many playable videos there are.
- Records each video's length so the page can start playback at a random point.
- Downloads each cover to our own origin (WebGL needs same-origin images), trims black letterbox bars (4:3 thumbnails have them), caps the long side at 512px.
- Newest-added first. Adding a video to the playlist adds a shard on the next page refresh after the next 15-minute check; removing one drops it.
- Logs `playlist lists N items: X playable, Y skipped` every run — compare that N with the playlist's real size.

## Safety rules
- On any API error the last good `reels.json` stays. Writes are atomic.
- Never publishes an empty list, or one under half the size of the current list (looks partial). `--force` overrides the second.
- The key never appears in logs.

## Where things live on the VPS
| What | Where |
|---|---|
| script | `/opt/wjrn-disco-feed/feed.py` |
| key + lock + log | `/var/lib/wjrn-disco/<station>/` (700; key is 600) |
| `reels.json`, `covers/` | `/var/www/wjrn-disco-data/<station>/` — **outside** `/var/www/wjrn-landing`, because `deploy.sh` rsyncs that folder with `--delete` |
| served at | `/<station>/disco/data/reels.json`, `/<station>/disco/data/covers/<id>.jpg` |

`install.sh [station] [playlist-id]` installs Pillow, the folders and the cron line (it will stop at the first sync until a key is set — expected).
