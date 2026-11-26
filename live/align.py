#!/usr/bin/env python3
"""Starts every listener of the live stream on a clean MP3 frame.

Icecast 2.4 hands new listeners a burst that begins mid-frame; Chrome then probes
for ~4-5s before playing (measured: 4.7s vs 0.8s once aligned). This sits between
nginx and Icecast and trims the leading partial frame. Expects 128k 44.1kHz MP3.
"""
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def frame_start(buf):
    """Offset of the first frame header followed by another exactly one frame later, or -1."""
    for i in range(len(buf) - 422):
        if buf[i] == 0xFF and buf[i + 1] == 0xFB and buf[i + 2] & 0xFC == 0x90:
            j = i + 417 + (buf[i + 2] >> 1 & 1)
            if buf[j] == 0xFF and buf[j + 1] == 0xFB:
                return i
    return -1


class Handler(BaseHTTPRequestHandler):
    timeout = 60  # drop a listener whose socket stops accepting data

    def do_GET(self, body=True):
        upstream = http.client.HTTPConnection("127.0.0.1", 18000, timeout=70)
        try:
            upstream.request("GET", "/live.mp3")
            src = upstream.getresponse()
            if src.status != 200:
                return self.send_error(404, "Off air")
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Cache-Control", "no-cache, no-store")
            self.send_header("icy-name", "WJRN LIVE 92.3")
            self.send_header("icy-br", "128")
            self.end_headers()
            if not body:
                return
            head = b""
            while len(head) < 4096:
                chunk = src.read1(4096)
                if not chunk:
                    return
                head += chunk
            self.wfile.write(head[max(frame_start(head), 0):])
            while chunk := src.read1(8192):
                self.wfile.write(chunk)
        except (OSError, http.client.HTTPException):
            pass  # listener left, or the show ended
        finally:
            upstream.close()

    def do_HEAD(self):
        self.do_GET(body=False)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 18001), Handler).serve_forever()
