#!/usr/bin/env python3
"""Tests for feed.py against a mock YouTube (Data API + RSS + oEmbed + thumbnails). No real key needed.  Run:  python3 test_feed.py"""
import io, json, os, subprocess, sys, tempfile, threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
S = {}


def jpeg(size, content_box=None, color=(200, 90, 40)):
    im = Image.new("RGB", size, (0, 0, 0))
    box = content_box or (0, 0, size[0], size[1])
    im.paste(Image.new("RGB", (box[2] - box[0], box[3] - box[1]), color), box[:2])
    b = io.BytesIO(); im.save(b, "JPEG", quality=85); return b.getvalue()


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, body, ctype="application/json"):
        if not isinstance(body, bytes): body = json.dumps(body).encode()
        self.send_response(code); self.send_header("Content-Type", ctype); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        u = urlparse(self.path); q = {k: v[0] for k, v in parse_qs(u.query).items()}; S.setdefault("log", []).append(self.path)
        if S.get("fail"): return self.send(500, {"error": {"message": "boom"}})
        if u.path == "/yt/playlistItems":
            if q.get("key") != S.get("key"): return self.send(403, {"error": {"message": "API key not valid"}})
            items = S["playlist"]; per = 2; page = int(q.get("pageToken", "0"))
            chunk = items[page * per:(page + 1) * per]
            out = {"items": [{"contentDetails": {"videoId": i["id"]}, "snippet": {"publishedAt": i["added"]}, "status": {"privacyStatus": i.get("priv", "public")}} for i in chunk]}
            if (page + 1) * per < len(items): out["nextPageToken"] = str(page + 1)
            return self.send(200, out)
        if u.path == "/yt/videos":
            ids = q["id"].split(","); S["videos_calls"] = S.get("videos_calls", 0) + 1
            return self.send(200, {"items": [S["videos"][i] for i in ids if i in S["videos"]]})
        if u.path == "/feeds/videos.xml":
            ents = "".join(f"<entry><yt:videoId>{v}</yt:videoId><title>t</title></entry>" for v in S["rss"])
            return self.send(200, f'<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">{ents}</feed>'.encode(), "application/xml")
        if u.path == "/oembed":
            vid = q["url"].split("v=")[1]
            if vid in S.get("blocked", ()): return self.send(401, b"Unauthorized", "text/plain")
            if vid in S.get("flaky", ()): return self.send(503, b"nope", "text/plain")
            return self.send(200, {"title": "x"})
        m = u.path.split("/")
        if len(m) == 4 and m[1] == "vi":
            img = S["thumbs"].get((m[2], m[3]))
            return self.send(200, img, "image/jpeg") if img else self.send(404, b"", "text/plain")
        self.send(404, {"error": {"message": "nope"}})


def video(vid, dur="PT3M30S", embeddable=True, priv="public", live="none", upload="processed"):
    return {"id": vid, "snippet": {"liveBroadcastContent": live}, "contentDetails": {"duration": dur},
            "status": {"embeddable": embeddable, "privacyStatus": priv, "uploadStatus": upload}}


def run(args, **kw):
    return subprocess.run([sys.executable, os.path.join(HERE, "feed.py"), *args], capture_output=True, text=True, **kw)


def main():
    srv = HTTPServer(("127.0.0.1", 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_port}"
    tmp = tempfile.mkdtemp(); data, st = os.path.join(tmp, "data"), os.path.join(tmp, "state")
    common = ["--station", "t", "--playlist", "PLTEST", "--data-dir", data, "--state-dir", st, "--api-base", base + "/yt", "--img-base", base]
    S["key"] = "KEY123"
    S["thumbs"] = {
        ("a1", "maxresdefault.jpg"): jpeg((1280, 720)),                           # clean 16:9
        ("b2", "hqdefault.jpg"): jpeg((480, 360), (0, 45, 480, 315)),             # no maxres: 4:3 with black bars
        ("c3", "maxresdefault.jpg"): jpeg((1280, 720)),
        ("d4", "maxresdefault.jpg"): jpeg((1280, 720)),
    }
    ok = True
    def check(name, cond, extra=""):
        nonlocal ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra and not cond else ""))
    def reels(): return json.load(open(os.path.join(data, "reels.json")))
    def pub(): return open(os.path.join(data, "reels.json"), "rb").read()

    # ---------------- no key: refuses to publish anything (the public RSS feed was unreliable: 14 of a 71-video playlist)
    S["rss"] = ["a1", "b2"]
    r = run(common)
    check("no key: refuses, publishes nothing", r.returncode == 1 and "API key" in r.stdout and not os.path.exists(os.path.join(data, "reels.json")), r.stdout)

    # ---------------- KEY (Data API) mode
    S["playlist"] = [
        {"id": "a1", "added": "2026-11-20T00:00:00Z"}, {"id": "gone", "added": "2026-11-19T00:00:00Z"},        # page 1
        {"id": "b2", "added": "2026-11-18T00:00:00Z"}, {"id": "priv", "added": "2026-11-17T00:00:00Z", "priv": "private"},   # page 2
        {"id": "c3", "added": "2026-11-16T00:00:00Z"}, {"id": "noembed", "added": "2026-11-15T00:00:00Z"},     # page 3
        {"id": "live", "added": "2026-11-14T00:00:00Z"}, {"id": "d4", "added": "2026-11-21T00:00:00Z"}]        # page 4 (newest added is last)
    S["videos"] = {"a1": video("a1", "PT1H2M3S"), "b2": video("b2", "PT45S"), "c3": video("c3"), "d4": video("d4", "PT10M"),
                   "noembed": video("noembed", embeddable=False), "live": video("live", live="live"), "priv": video("priv", priv="private")}   # "gone" isn't returned at all
    r = subprocess.run([sys.executable, os.path.join(HERE, "feed.py"), *common, "--set-key"], input="BADKEY", capture_output=True, text=True)
    check("--set-key rejects an invalid key", r.returncode != 0 and not os.path.exists(os.path.join(st, "youtube-api-key")))
    r = subprocess.run([sys.executable, os.path.join(HERE, "feed.py"), *common, "--set-key"], input="KEY123", capture_output=True, text=True)
    check("--set-key stores a valid key, mode 600", r.returncode == 0 and oct(os.stat(os.path.join(st, "youtube-api-key")).st_mode & 0o777) == "0o600", r.stdout + r.stderr)

    r = run(common)
    check("key mode: sync succeeds", r.returncode == 0, r.stdout + r.stderr)
    out = reels(); by = {x["id"]: x for x in out["reels"]}
    check("key mode: deleted / private / non-embeddable / live all skipped; paginated", sorted(by) == ["a1", "b2", "c3", "d4"], sorted(by))
    check("key mode: newest ADDED first", [x["id"] for x in out["reels"]] == ["d4", "a1", "c3", "b2"] or [x["id"] for x in out["reels"]] == ["d4", "a1", "b2", "c3"], [x["id"] for x in out["reels"]])
    check("key mode: durations in seconds (1h2m3s=3723, 45s)", by["a1"]["duration"] == 3723 and by["b2"]["duration"] == 45 and by["d4"]["duration"] == 600, {k: v["duration"] for k, v in by.items()})
    check("key mode: new video's cover fetched (d4); cached ones reused", os.path.exists(os.path.join(data, "covers", "d4.jpg")) and os.path.exists(os.path.join(data, "covers", "a1.jpg")))
    im = Image.open(os.path.join(data, "covers", "b2.jpg"))
    check("hqdefault fallback used + letterbox bars trimmed (4:3 -> 16:9)", abs(im.width / im.height - 480 / 270) < 0.03, im.size)
    check("maxres cover used when present (16:9, long side 512)", Image.open(os.path.join(data, "covers", "a1.jpg")).size[0] == 512)
    check("reels.json world-readable, no temp files", oct(os.stat(os.path.join(data, "reels.json")).st_mode & 0o777) == "0o644" and not [f for f in os.listdir(data) if f.startswith(".tmp-")])
    check("no covers for skipped videos", not any(os.path.exists(os.path.join(data, "covers", f"{v}.jpg")) for v in ("gone", "priv", "noembed", "live")))
    check("log reports the playlist's own item count", "playlist lists 7 items: 4 playable, 3 skipped" in r.stdout, r.stdout)
    good = pub()

    # ---------------- guards
    S["fail"] = True; r = run(common)
    check("API 500 -> nonzero, reels.json untouched", r.returncode == 1 and pub() == good, r.stdout); S["fail"] = False
    saved = S["playlist"]; S["playlist"] = []; r = run(common)
    check("empty playlist never published over a good list", r.returncode == 1 and pub() == good, r.stdout); S["playlist"] = saved
    big = json.loads(good); big["reels"] = big["reels"] * 5; open(os.path.join(data, "reels.json"), "w").write(json.dumps(big)); bigb = pub()
    r = run(common)
    check("shrunken-by-half list refused", r.returncode == 1 and pub() == bigb, r.stdout)
    r = run(common + ["--force"])
    check("--force publishes it", r.returncode == 0 and reels()["count"] == 4, r.stdout)

    # ---------------- a new video appears
    S["playlist"] = [{"id": "e5", "added": "2026-11-22T00:00:00Z"}] + S["playlist"]; S["videos"]["e5"] = video("e5", "PT2M"); S["thumbs"][("e5", "maxresdefault.jpg")] = jpeg((1280, 720))
    r = run(common)
    check("new playlist video -> new shard on next sync", r.returncode == 0 and "e5" in [x["id"] for x in reels()["reels"]] and reels()["count"] == 5, r.stdout)
    S["playlist"] = [p for p in S["playlist"] if p["id"] != "a1"]; r = run(common)
    check("removed video -> shard gone, cover pruned", "a1" not in [x["id"] for x in reels()["reels"]] and not os.path.exists(os.path.join(data, "covers", "a1.jpg")), r.stdout)

    check("API key never printed", "KEY123" not in r.stdout + r.stderr)
    print("\nALL PASSED" if ok else "\nFAILURES"); sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
