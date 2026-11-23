#!/usr/bin/env python3
"""Tests for feed.py against a mock Instagram API (no real token needed).  Run:  python3 test_feed.py"""
import io, json, os, subprocess, sys, tempfile, threading, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = {}


def jpeg(size, content_box=None, color=(200, 90, 40)):
    """A frame; if content_box is given, everything outside it is black (a letterboxed clip)."""
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
        u = urlparse(self.path); q = parse_qs(u.query); STATE.setdefault("calls", []).append(u.path)
        if u.path.startswith("/img/"):
            return self.send(200, STATE["images"][u.path[5:]], "image/jpeg")
        if u.path == "/refresh_access_token":
            STATE["refreshed_with"] = q["access_token"][0]
            return self.send(200, {"access_token": "NEWTOKEN", "token_type": "bearer", "expires_in": 5184000})
        if u.path == "/me":
            return self.send(200, {"user_id": "1", "username": "therockgarden.tv"})
        if u.path == "/me/media":
            if STATE.get("fail"): return self.send(500, {"error": {"message": "boom", "code": 2}})
            if STATE.get("reject_shortcode") and "shortcode" in q["fields"][0]:
                return self.send(400, {"error": {"message": "nonexisting field (shortcode)", "code": 100}})
            items, port = STATE["items"], self.server.server_port
            page = int(q.get("after", ["0"])[0]); per = 2
            chunk = items[page * per:(page + 1) * per]
            out = {"data": [dict(i, **({"thumbnail_url": f"http://127.0.0.1:{port}/img/{i['thumb']}"} if i.get("thumb") else {})) for i in chunk]}
            for d in out["data"]: d.pop("thumb", None)
            if (page + 1) * per < len(items):
                out["paging"] = {"next": f"http://127.0.0.1:{port}/me/media?fields={q['fields'][0]}&after={page + 1}&access_token={q['access_token'][0]}"}
            return self.send(200, out)
        self.send(404, {"error": {"message": "nope"}})


def item(i, kind="reel", thumb=None, ts=None):
    return {"id": str(i), "media_type": "VIDEO" if kind != "photo" else "IMAGE", "media_product_type": "REELS" if kind == "reel" else "FEED",
            "permalink": f"https://www.instagram.com/{'reel' if kind == 'reel' else 'p'}/CODE{i}/", "shortcode": f"CODE{i}",
            "timestamp": ts or f"2026-11-{i:02d}T12:00:00+0000", "thumb": thumb}


def run(args, **kw):
    return subprocess.run([sys.executable, os.path.join(HERE, "feed.py"), *args], capture_output=True, text=True, **kw)


def main():
    srv = HTTPServer(("127.0.0.1", 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_port}"
    tmp = tempfile.mkdtemp(); data, st = os.path.join(tmp, "data"), os.path.join(tmp, "state")
    common = ["--station", "t", "--data-dir", data, "--state-dir", st, "--api-base", base]
    STATE["images"] = {
        "letterboxed.jpg": jpeg((1080, 1920), (0, 656, 1080, 1264)),     # 16:9 clip in a 9:16 frame
        "plain.jpg": jpeg((1080, 1920)),
        "dark.jpg": jpeg((1080, 1920), (500, 900, 520, 920), (5, 5, 5)),  # almost entirely black: must NOT be trimmed to a sliver
    }
    STATE["items"] = [item(9, thumb="letterboxed.jpg"), item(8, "photo", thumb="plain.jpg"), item(7, thumb="plain.jpg"),
                      item(6, "feedvideo", thumb="plain.jpg"), item(5, thumb=None), item(4, thumb="dark.jpg")]
    ok = True
    def check(name, cond, extra=""):
        nonlocal ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ") + name + (f"  [{extra}]" if extra and not cond else ""))
    def reels(): return json.load(open(os.path.join(data, "reels.json")))

    # token set + status
    r = subprocess.run([sys.executable, os.path.join(HERE, "feed.py"), *common, "--set-token"], input="TOKEN123", capture_output=True, text=True)
    check("set-token validates against /me and saves", r.returncode == 0 and os.path.exists(os.path.join(st, "token.json")), r.stdout + r.stderr)
    check("token file is 0600", oct(os.stat(os.path.join(st, "token.json")).st_mode & 0o777) == "0o600")

    # first sync: photo dropped, paginated across 3 pages, newest first, feed video kept
    r = run(common); out = reels() if os.path.exists(os.path.join(data, "reels.json")) else {}
    check("first sync succeeds", r.returncode == 0, r.stdout + r.stderr)
    ids = [x["id"] for x in out.get("reels", [])]
    check("photo excluded, videos kept, paginated, newest first", ids == ["9", "7", "6", "5", "4"], ids)
    check("permalink for a non-reel video is /p/", any("/p/CODE6/" in x["permalink"] for x in out["reels"]))
    by = {x["id"]: x for x in out["reels"]}
    im = Image.open(os.path.join(data, "covers", "9.jpg"))
    check("letterbox bars trimmed (16:9 out of 9:16)", abs(im.width / im.height - 1080 / 608) < 0.03 and max(im.size) == 512, im.size)
    w7, h7 = Image.open(os.path.join(data, "covers", "7.jpg")).size
    check("full 9:16 frame left whole (nothing to trim)", abs(w7 / h7 - 9 / 16) < 0.01 and h7 == 512, (w7, h7))
    check("mostly-black frame not trimmed to a sliver", min(Image.open(os.path.join(data, "covers", "4.jpg")).size) > 100, Image.open(os.path.join(data, "covers", "4.jpg")).size)
    check("missing thumbnail -> reel kept with cover null", by["5"]["cover"] is None)
    check("reels.json is world-readable (nginx)", oct(os.stat(os.path.join(data, "reels.json")).st_mode & 0o777) == "0o644")
    check("no temp files left behind", not [f for f in os.listdir(data) if f.startswith(".tmp-")])
    good = open(os.path.join(data, "reels.json"), "rb").read()

    # API down: keep last good
    STATE["fail"] = True; r = run(common)
    check("API 500 -> nonzero exit, reels.json untouched", r.returncode == 1 and open(os.path.join(data, "reels.json"), "rb").read() == good, r.stdout)
    STATE["fail"] = False

    # API returns nothing: keep last good
    saved = STATE["items"]; STATE["items"] = []; r = run(common)
    check("empty list never published", r.returncode == 1 and open(os.path.join(data, "reels.json"), "rb").read() == good, r.stdout)
    STATE["items"] = saved

    # partial result guard
    big = json.loads(good); big["reels"] = big["reels"] * 4; open(os.path.join(data, "reels.json"), "w").write(json.dumps(big))
    big_bytes = open(os.path.join(data, "reels.json"), "rb").read()
    r = run(common)
    check("shrunken-by-half list refused", r.returncode == 1 and open(os.path.join(data, "reels.json"), "rb").read() == big_bytes, r.stdout)
    r = run(common + ["--force"])
    check("--force publishes it", r.returncode == 0 and reels()["count"] == 5, r.stdout)

    # an archived reel drops out, cover pruned
    STATE["items"] = [i for i in STATE["items"] if i["id"] != "9"]; r = run(common)
    check("archived reel gone from json and cover pruned", "9" not in [x["id"] for x in reels()["reels"]] and not os.path.exists(os.path.join(data, "covers", "9.jpg")), r.stdout)

    # token refresh when old
    tf = os.path.join(st, "token.json"); t = json.load(open(tf)); t["refreshed_at"] = int(time.time()) - 8 * 86400; json.dump(t, open(tf, "w"))
    r = run(common)
    check("weekly refresh uses the old token and stores the new one", STATE.get("refreshed_with") == "TOKEN123" and json.load(open(tf))["access_token"] == "NEWTOKEN", r.stdout)
    # token too young: no refresh
    STATE["refreshed_with"] = None; r = run(common)
    check("no refresh when token is fresh", STATE["refreshed_with"] is None)
    # expired token
    t = json.load(open(tf)); t["expires_at"] = int(time.time()) - 10; json.dump(t, open(tf, "w")); r = run(common)
    check("expired token fails loudly", r.returncode == 1 and "EXPIRED" in r.stdout, r.stdout)
    t["expires_at"] = int(time.time()) + 60 * 86400; json.dump(t, open(tf, "w"))

    # Meta rejecting a field on this login type
    STATE["reject_shortcode"] = True; r = run(common)
    check("falls back to minimal fields when a field is rejected (shortcode parsed from permalink)", r.returncode == 0 and "CODE7" in [x["shortcode"] for x in reels()["reels"]], r.stdout)

    # token never appears in logs
    check("token never printed", "NEWTOKEN" not in r.stdout + r.stderr and "TOKEN123" not in r.stdout + r.stderr)
    print("\nALL PASSED" if ok else "\nFAILURES"); sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
