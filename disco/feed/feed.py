#!/usr/bin/env python3
"""Rock Garden Disco — feed sync (YouTube playlist -> reels.json + covers).

Every tile on the ball is one video from a public/unlisted YouTube playlist. This script keeps
<data-dir>/reels.json and <data-dir>/covers/<id>.jpg in step with that playlist. Cron runs it every ~15 minutes on the
VPS. Needs Python 3 + Pillow (apt: python3-pil).

Reads the playlist with a YouTube Data API key (feed.py --set-key). A key is REQUIRED: it returns the whole playlist at any
size and records each video's length so the page can start playback at a random point. (The playlist's public RSS feed was
tried and is NOT used: it returned 14 of a 71-video playlist, so it can't be trusted to be complete.)

Rules that matter:
  * A video that can't be embedded (or is deleted / private / live / still processing) is SKIPPED — never a blank tile. The
    ball is cut to however many playable videos there are.
  * Covers come from YouTube's thumbnail CDN, are cached on our own origin (WebGL needs same-origin images), and any black
    letterbox bars are trimmed.
  * reels.json is written atomically, newest-added first. On ANY error the last good reels.json is left untouched, and an
    empty or suspiciously shrunken list is never published.

Usage:
  feed.py --playlist PLxxxx          sync once (this is what cron runs)
  feed.py --set-key                  read a YouTube Data API key from stdin and store it (mode 600, outside the web root)
  feed.py --status                   print what's published, then exit
"""
import argparse, fcntl, io, json, os, re, sys, tempfile, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone

COVER_LONG_SIDE = 512
BAR_LUMA = 22                     # a row/column counts as a letterbox bar if (almost) every pixel is darker than this
BAR_STRAY = 0.01                  # ...allowing 1% stray pixels (compression noise, a watermark)
MIN_KEEP = 0.25                   # never trim to less than this fraction of the frame (a black intro frame stays whole)
SHRINK_GUARD = 0.5                # refuse to publish a list < 50% the size of the last good one (partial result)


def log(msg):
    print(f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} {msg}", flush=True)


class ApiError(Exception):
    def __init__(self, msg, status=None):
        super().__init__(msg); self.status = status


def redact(text, secret):
    return text.replace(secret, "<key>") if secret else text


def http_get(url, secret=None, timeout=30, retries=3, binary=False):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "wjrn-disco-feed/2"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            try: msg = json.loads(body).get("error", {}).get("message", body[:200])
            except ValueError: msg = body[:200]
            last = ApiError(redact(f"HTTP {e.code}: {msg}", secret), e.code)
            if e.code < 500 and e.code != 429:     # a 4xx is a real answer, not a blip: don't hammer
                break
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as e:
            last = ApiError(redact(str(e), secret))
        time.sleep(2 ** attempt)
    raise last or ApiError("request failed")


def atomic_write(path, data, mode=0o644):
    d = os.path.dirname(path)
    os.makedirs(d, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=d, prefix=".tmp-")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data); f.flush(); os.fsync(f.fileno())
        os.chmod(tmp, mode)
        os.replace(tmp, path)               # atomic: readers see the old file or the new one, never half
    except BaseException:
        if os.path.exists(tmp): os.unlink(tmp)
        raise


# ---------------------------------------------------------------- API key
def load_key(a):
    try:
        with open(a.key_file) as f: return f.read().strip() or None
    except FileNotFoundError:
        return None


def set_key(a):
    key = sys.stdin.read().strip()
    if not key: raise SystemExit("No key on stdin.")
    if not a.playlist: raise SystemExit("Pass --playlist too, so the key can be checked against it.")
    http_get(yt_api(a, "playlistItems", key, part="id", playlistId=a.playlist, maxResults=1), key)
    atomic_write(a.key_file, (key + "\n").encode(), mode=0o600)
    log(f"key OK for playlist {a.playlist}; saved to {a.key_file}")


def yt_api(a, path, key, **params):
    return f"{a.api_base.rstrip('/')}/{path}?" + urllib.parse.urlencode(dict(params, key=key))


# ---------------------------------------------------------------- reading the playlist
def parse_duration(iso):
    """ISO-8601 duration (PT1H2M3S) -> seconds."""
    m = re.fullmatch(r"P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?", iso or "")
    if not m: return 0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


def fetch_via_api(a, key):
    entries, token = [], None
    while True:
        params = dict(part="snippet,contentDetails,status", playlistId=a.playlist, maxResults=50)
        if token: params["pageToken"] = token
        page = http_get(yt_api(a, "playlistItems", key, **params), key)
        for it in page.get("items", []):
            vid = (it.get("contentDetails") or {}).get("videoId")
            if vid and (it.get("status") or {}).get("privacyStatus", "public") in ("public", "unlisted"):
                entries.append({"id": vid, "added": (it.get("snippet") or {}).get("publishedAt") or ""})
        token = page.get("nextPageToken")
        if not token: break
    ids = [e["id"] for e in entries]
    playable = {}
    for i in range(0, len(ids), 50):                      # deleted/private videos simply don't come back from videos.list
        det = http_get(yt_api(a, "videos", key, part="snippet,contentDetails,status", id=",".join(ids[i:i + 50])), key)
        for v in det.get("items", []):
            st, sn = v.get("status", {}), v.get("snippet", {})
            dur = parse_duration(v.get("contentDetails", {}).get("duration"))
            ok = (st.get("embeddable") is True and st.get("privacyStatus") in ("public", "unlisted")
                  and st.get("uploadStatus", "processed") == "processed" and sn.get("liveBroadcastContent", "none") == "none" and dur > 0)
            if ok: playable[v["id"]] = dur
            else: log(f"skipping {v['id']}: not playable (embeddable={st.get('embeddable')}, privacy={st.get('privacyStatus')}, live={sn.get('liveBroadcastContent')})")
    skipped = [i for i in ids if i not in playable]
    out = [{"id": e["id"], "added": e["added"], "duration": playable[e["id"]]} for e in entries if e["id"] in playable]
    out.sort(key=lambda r: r["added"], reverse=True)       # newest added first
    return out, len(skipped), len(entries)


# ---------------------------------------------------------------- covers
def trim_bars(im):
    """Crop black letterbox/pillarbox bars. Returns the (possibly) cropped image."""
    g = im.convert("L"); w, h = g.size

    def dark(box):
        hist = g.crop(box).histogram()
        n = sum(hist)
        return n > 0 and sum(hist[BAR_LUMA + 1:]) / n <= BAR_STRAY

    top = 0
    while top < h - 1 and dark((0, top, w, top + 1)): top += 1
    bot = h
    while bot > top + 1 and dark((0, bot - 1, w, bot)): bot -= 1
    left = 0
    while left < w - 1 and dark((left, top, left + 1, bot)): left += 1
    right = w
    while right > left + 1 and dark((right - 1, top, right, bot)): right -= 1
    if (right - left) * (bot - top) < MIN_KEEP * w * h:
        return im                                   # mostly black frame: leave it whole rather than trim to a sliver
    return im.crop((left, top, right, bot))


def make_cover(raw):
    from PIL import Image
    im = Image.open(io.BytesIO(raw)); im.load()
    im = trim_bars(im.convert("RGB"))
    s = COVER_LONG_SIDE / max(im.size)
    if s < 1: im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    out = io.BytesIO(); im.save(out, "JPEG", quality=82, optimize=True, progressive=True)
    return out.getvalue(), im.size


def fetch_cover(a, vid):
    """maxres is clean 16:9 but missing on older/low-res videos; hqdefault always exists (4:3 with bars, which get trimmed)."""
    last = None
    for name in ("maxresdefault", "hqdefault"):
        try: return make_cover(http_get(f"{a.img_base.rstrip('/')}/vi/{vid}/{name}.jpg", binary=True, timeout=30, retries=2))
        except (ApiError, OSError, ValueError) as e: last = e
    raise last or ApiError("no cover")


def sync_covers(a, reels, prev):
    cdir = os.path.join(a.data_dir, "covers"); os.makedirs(cdir, exist_ok=True)
    prev_by_id = {r["id"]: r for r in prev}
    fresh = failed = 0
    for r in reels:
        path = os.path.join(cdir, f"{r['id']}.jpg")
        old = prev_by_id.get(r["id"])
        if os.path.exists(path) and old and old.get("cover") and old.get("w"):
            r["cover"], r["w"], r["h"] = old["cover"], old["w"], old["h"]       # already cached: nothing to download
            continue
        try:
            data, (w, h) = fetch_cover(a, r["id"])
            atomic_write(path, data)
            r["cover"], r["w"], r["h"] = f"covers/{r['id']}.jpg", w, h
            fresh += 1
        except Exception as e:                                                 # one bad cover must not sink the run
            r["cover"], r["w"], r["h"] = None, None, None
            failed += 1
            log(f"cover failed for {r['id']}: {str(e)[:160]}")
    keep = {f"{r['id']}.jpg" for r in reels}
    for fn in os.listdir(cdir):                                                # removed videos: drop their covers
        if fn.endswith(".jpg") and fn not in keep: os.unlink(os.path.join(cdir, fn))
    log(f"covers: {fresh} new, {failed} failed, {len(reels) - fresh - failed} cached")


# ---------------------------------------------------------------- main
def current_reels(a):
    try:
        with open(os.path.join(a.data_dir, "reels.json")) as f: return json.load(f).get("reels", [])
    except (FileNotFoundError, ValueError): return []


def sync(a):
    if not a.playlist: raise ApiError("No playlist given (--playlist PLxxxx)")
    prev = current_reels(a)
    key = load_key(a)
    if not key: raise ApiError(f"No YouTube API key at {a.key_file}. Run: feed.py --set-key --playlist {a.playlist}  (key on stdin)")
    reels, skipped, total = fetch_via_api(a, key)
    log(f"playlist lists {total} items: {len(reels)} playable, {skipped} skipped")
    if not reels and prev:
        raise ApiError(f"0 playable videos but {len(prev)} are published — keeping the last good list")
    if len(prev) >= 10 and len(reels) < SHRINK_GUARD * len(prev) and not a.force:
        raise ApiError(f"{len(reels)} playable vs {len(prev)} published (looks partial) — keeping the last good list (use --force if real)")
    if not reels:
        raise ApiError("0 playable videos and nothing is published yet — not publishing an empty list")
    sync_covers(a, reels, prev)
    out = {"station": a.station, "playlist": a.playlist, "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "count": len(reels),
           "reels": [{k: r[k] for k in ("id", "duration", "cover", "w", "h")} for r in reels]}
    atomic_write(os.path.join(a.data_dir, "reels.json"), json.dumps(out, separators=(",", ":")).encode())
    log(f"published {len(reels)} videos (was {len(prev)})")


def status(a):
    log(f"API key: {'set' if load_key(a) else 'NOT SET (required)'}")
    r = current_reels(a); log(f"reels.json: {len(r)} videos in {a.data_dir}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--station", default="the-rock-garden")
    p.add_argument("--playlist", help="YouTube playlist id, e.g. PLUSeDm1idbX0")
    p.add_argument("--data-dir"); p.add_argument("--state-dir"); p.add_argument("--key-file")
    p.add_argument("--api-base", default="https://www.googleapis.com/youtube/v3")
    p.add_argument("--img-base", default="https://i.ytimg.com", help="thumbnail host")
    p.add_argument("--set-key", action="store_true"); p.add_argument("--status", action="store_true")
    p.add_argument("--force", action="store_true", help="publish even if the list shrank by more than half")
    a = p.parse_args()
    a.data_dir = a.data_dir or f"/var/www/wjrn-disco-data/{a.station}"
    a.state_dir = a.state_dir or f"/var/lib/wjrn-disco/{a.station}"
    a.key_file = a.key_file or os.path.join(a.state_dir, "youtube-api-key")
    os.makedirs(a.state_dir, exist_ok=True, mode=0o700); os.makedirs(a.data_dir, exist_ok=True)
    if a.set_key:
        try: return set_key(a)
        except ApiError as e: raise SystemExit(f"Key check failed: {e}")
    if a.status: return status(a)
    lock = open(os.path.join(a.state_dir, "feed.lock"), "w")
    try: fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError: log("another run is in progress; skipping"); return
    try: sync(a)
    except ApiError as e:
        log(f"ERROR {e} — last good reels.json left in place"); sys.exit(1)
    except Exception as e:
        log(f"ERROR unexpected: {type(e).__name__}: {e} — last good reels.json left in place"); sys.exit(1)


if __name__ == "__main__":
    main()
