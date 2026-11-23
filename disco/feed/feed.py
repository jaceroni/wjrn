#!/usr/bin/env python3
"""Rock Garden Disco — feed sync.

Keeps <data-dir>/reels.json (and <data-dir>/covers/<id>.jpg) in step with the station's Instagram account.
Runs from cron on the VPS every ~15 minutes. Needs Python 3 + Pillow (apt: python3-pil).

Rules that matter (see the handoff doc):
  * Playback uses permalink/shortcode and covers use thumbnail_url. Never depend on `media_url`: since 2026-07-30
    Meta omits it for videos with licensed audio, even on your own account.
  * Covers are downloaded and served from our own origin (WebGL needs same-origin images, and Instagram's thumbnail
    URLs expire). ~3/4 of the reels are 16:9 clips letterboxed inside a 9:16 frame, so black bars are trimmed.
  * reels.json is written atomically, newest first. On ANY error the last good reels.json is left untouched, and
    an empty or suspiciously shrunken list is never published.
  * The access token lives outside the web root and is refreshed here, well before its 60 days run out.

Usage:
  feed.py --set-token            read a long-lived token from stdin and store it (first-time setup)
  feed.py                        sync once (this is what cron runs)
  feed.py --status               print token age/expiry and the current reels.json summary, then exit
"""
import argparse, fcntl, io, json, os, re, sys, tempfile, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone

FIELDS_FULL = "id,media_type,media_product_type,permalink,shortcode,thumbnail_url,timestamp"
FIELDS_MIN = "id,media_type,permalink,thumbnail_url,timestamp"     # fallback if Meta rejects a field on this login type
REFRESH_AFTER_DAYS = 7            # refresh weekly: eligibility starts at 24h old, expiry is 60 days
WARN_EXPIRY_DAYS = 14
COVER_LONG_SIDE = 512
BAR_LUMA = 22                     # a row/column counts as a letterbox bar if (almost) every pixel is darker than this
BAR_STRAY = 0.01                  # ...allowing 1% stray pixels (compression noise, a watermark)
MIN_KEEP = 0.25                   # never trim to less than this fraction of the frame (a black intro frame stays whole)
SHRINK_GUARD = 0.5                # refuse to publish a list < 50% the size of the last good one (partial result)


def log(msg):
    print(f"{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} {msg}", flush=True)


class ApiError(Exception):
    def __init__(self, msg, code=None):
        super().__init__(msg); self.code = code


def redact(text, token):
    return text.replace(token, "<token>") if token else text


def http_get(url, token=None, timeout=30, retries=3, binary=False):
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "wjrn-disco-feed/1"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            try:
                err = json.loads(body).get("error", {})
                last = ApiError(f"HTTP {e.code}: {err.get('message', body[:200])}", err.get("code"))
            except ValueError:
                last = ApiError(f"HTTP {e.code}: {body[:200]}")
            if e.code < 500 and e.code != 429:     # a 4xx is our problem, not a blip: don't hammer
                break
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as e:
            last = ApiError(redact(str(e), token))
        time.sleep(2 ** attempt)
    raise last


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


# ---------------------------------------------------------------- token
def now_ts(): return int(time.time())


def load_token(path):
    try:
        with open(path) as f: return json.load(f)
    except FileNotFoundError:
        raise SystemExit(f"No token at {path}. Run: feed.py --set-token  (and paste the long-lived token)")


def save_token(path, tok):
    atomic_write(path, json.dumps(tok, indent=2).encode(), mode=0o600)


def api_url(a, path, **params):
    base = a.api_base.rstrip("/") + (f"/{a.api_version}" if a.api_version else "")
    return f"{base}/{path}?" + urllib.parse.urlencode(params)


def set_token(a):
    token = sys.stdin.read().strip()
    if not token: raise SystemExit("No token on stdin.")
    me = http_get(api_url(a, "me", fields="user_id,username", access_token=token), token)
    log(f"token OK for @{me.get('username')} ({me.get('user_id') or me.get('id')})")
    # A token generated in the Meta dashboard is already long-lived (60 days) — treat today as its start.
    save_token(a.token_file, {"access_token": token, "refreshed_at": now_ts(), "expires_at": now_ts() + 60 * 86400})
    log(f"saved to {a.token_file}")


def ensure_fresh_token(a):
    tok = load_token(a.token_file)
    age_days = (now_ts() - tok["refreshed_at"]) / 86400
    if now_ts() >= tok["expires_at"]:
        raise ApiError("Token has EXPIRED. Generate a new one in the Meta dashboard and run feed.py --set-token.")
    if age_days >= REFRESH_AFTER_DAYS:
        try:
            r = http_get(api_url(a, "refresh_access_token", grant_type="ig_refresh_token", access_token=tok["access_token"]), tok["access_token"])
            tok = {"access_token": r["access_token"], "refreshed_at": now_ts(), "expires_at": now_ts() + int(r.get("expires_in", 60 * 86400))}
            save_token(a.token_file, tok)
            log(f"token refreshed (valid {int(r.get('expires_in', 0)) // 86400} more days)")
        except ApiError as e:
            log(f"WARNING token refresh failed: {e}")
    left = (tok["expires_at"] - now_ts()) / 86400
    if left < WARN_EXPIRY_DAYS:
        log(f"WARNING token expires in {left:.1f} days and is not refreshing — fix this before it dies")
    return tok["access_token"]


# ---------------------------------------------------------------- feed
def fetch_media(a, token):
    items = []
    fields = FIELDS_FULL
    url = api_url(a, "me/media", fields=fields, limit=100, access_token=token)
    while url:
        try:
            page = http_get(url, token)
        except ApiError as e:
            if fields == FIELDS_FULL and e.code == 100 and not items:       # "nonexisting field": retry with the basics
                log(f"fields rejected ({e}); retrying with the minimal set")
                fields = FIELDS_MIN
                url = api_url(a, "me/media", fields=fields, limit=100, access_token=token)
                continue
            raise
        items += page.get("data", [])
        url = page.get("paging", {}).get("next")
    return items


def parse_reel(it):
    """Reels and videos only. Returns None for photos/carousels."""
    if it.get("media_type") != "VIDEO" and it.get("media_product_type") != "REELS":
        return None
    permalink = it.get("permalink") or ""
    m = re.search(r"instagram\.com/(?:[^/]+/)?(reel|reels|p|tv)/([A-Za-z0-9_-]+)", permalink)
    shortcode = it.get("shortcode") or (m.group(2) if m else None)
    if not shortcode: return None
    return {"id": str(it["id"]), "shortcode": shortcode, "permalink": permalink,
            "timestamp": it.get("timestamp"), "thumb": it.get("thumbnail_url")}


# ---------------------------------------------------------------- covers
def trim_bars(im):
    """Crop black letterbox/pillarbox bars. Returns the (possibly) cropped image."""
    from PIL import Image
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
            if not r["thumb"]: raise ApiError("no thumbnail_url")
            data, (w, h) = make_cover(http_get(r["thumb"], binary=True, timeout=30))
            atomic_write(path, data)
            r["cover"], r["w"], r["h"] = f"covers/{r['id']}.jpg", w, h
            fresh += 1
        except Exception as e:                                                 # one bad cover must not sink the run
            r["cover"], r["w"], r["h"] = None, None, None
            failed += 1
            log(f"cover failed for {r['id']}: {redact(str(e), '')[:160]}")
    keep = {f"{r['id']}.jpg" for r in reels}
    for fn in os.listdir(cdir):                                                # archived/deleted reels: drop their covers
        if fn.endswith(".jpg") and fn not in keep: os.unlink(os.path.join(cdir, fn))
    log(f"covers: {fresh} new, {failed} failed, {len(reels) - fresh - failed} cached")


# ---------------------------------------------------------------- main
def current_reels(a):
    try:
        with open(os.path.join(a.data_dir, "reels.json")) as f: return json.load(f).get("reels", [])
    except (FileNotFoundError, ValueError): return []


def sync(a):
    prev = current_reels(a)
    token = ensure_fresh_token(a)
    reels = [r for r in map(parse_reel, fetch_media(a, token)) if r]
    reels.sort(key=lambda r: r["timestamp"] or "", reverse=True)               # newest first (ISO timestamps sort as text)
    if not reels and prev:
        raise ApiError(f"API returned 0 reels but {len(prev)} are published — keeping the last good list")
    if len(prev) >= 10 and len(reels) < SHRINK_GUARD * len(prev) and not a.force:
        raise ApiError(f"API returned {len(reels)} reels vs {len(prev)} published (looks partial) — keeping the last good list (use --force if real)")
    if not reels:
        raise ApiError("API returned 0 reels and nothing is published yet — not publishing an empty list")
    sync_covers(a, reels, prev)
    out = {"station": a.station, "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "count": len(reels),
           "reels": [{k: r[k] for k in ("id", "shortcode", "permalink", "cover", "w", "h", "timestamp")} for r in reels]}
    atomic_write(os.path.join(a.data_dir, "reels.json"), json.dumps(out, separators=(",", ":")).encode())
    log(f"published {len(reels)} reels (was {len(prev)})")


def status(a):
    try:
        tok = load_token(a.token_file)
        log(f"token: refreshed {(now_ts() - tok['refreshed_at']) / 86400:.1f}d ago, expires in {(tok['expires_at'] - now_ts()) / 86400:.1f}d")
    except SystemExit as e: log(str(e))
    r = current_reels(a); log(f"reels.json: {len(r)} reels in {a.data_dir}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--station", default="the-rock-garden")
    p.add_argument("--data-dir"); p.add_argument("--state-dir")
    p.add_argument("--token-file")
    p.add_argument("--api-base", default=os.environ.get("IG_API_BASE", "https://graph.instagram.com"))
    p.add_argument("--api-version", default=os.environ.get("IG_API_VERSION", ""), help="e.g. v24.0 (default: unversioned)")
    p.add_argument("--set-token", action="store_true"); p.add_argument("--status", action="store_true")
    p.add_argument("--force", action="store_true", help="publish even if the list shrank by more than half")
    a = p.parse_args()
    a.data_dir = a.data_dir or f"/var/www/wjrn-disco-data/{a.station}"
    a.state_dir = a.state_dir or f"/var/lib/wjrn-disco/{a.station}"
    a.token_file = a.token_file or os.path.join(a.state_dir, "token.json")
    os.makedirs(a.state_dir, exist_ok=True, mode=0o700); os.makedirs(a.data_dir, exist_ok=True)
    if a.set_token: return set_token(a)
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
