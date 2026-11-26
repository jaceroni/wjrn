#!/usr/bin/env python3
"""Relays the audio of the Twitch broadcast into a local Icecast mount (92.3 FM LIVE).

Loop: ask streamlink whether the channel is live; if so, pipe its audio_only
stream through ffmpeg into Icecast until it ends. status.json says live=true only
while Icecast actually has audio, so players never tune to dead air.
"""
import json, os, signal, subprocess, sys, time, urllib.request

CHANNEL = "twitch.tv/jacewonmusic"
STREAMLINK = "/opt/wjrn-live/venv/bin/streamlink"
STATUS = "/var/www/wjrn-live-data/status.json"
ICECAST = "127.0.0.1:18000"
OFFLINE_POLL = 20
procs = []
since = None


def write_status(live):
    global since
    since = (since or int(time.time())) if live else None
    tmp = STATUS + ".tmp"
    with open(tmp, "w") as f:
        json.dump({"live": live, "since": since, "updated": int(time.time())}, f)
    os.chmod(tmp, 0o644)
    os.replace(tmp, STATUS)


def on_air():
    try:
        with urllib.request.urlopen(f"http://{ICECAST}/status-json.xsl", timeout=5) as r:
            return "/live.mp3" in r.read().decode("utf-8", "replace")
    except OSError:
        return False


def channel_live():
    try:
        r = subprocess.run([STREAMLINK, "--stream-url", CHANNEL, "audio_only"],
                           capture_output=True, timeout=40)
        return r.returncode == 0
    except subprocess.TimeoutExpired:
        return False


def stop():
    for p in procs:
        if p.poll() is None:
            p.terminate()
    for p in procs:
        try:
            p.wait(10)
        except subprocess.TimeoutExpired:
            p.kill()
    procs.clear()


def relay():
    password = os.environ["SOURCE_PASSWORD"]
    src = subprocess.Popen([STREAMLINK, "--twitch-low-latency", "--stream-timeout", "40",
                            "--stdout", CHANNEL, "audio_only"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-i", "pipe:0",
                            "-vn", "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "2",
                            "-content_type", "audio/mpeg", "-ice_name", "WJRN LIVE 92.3", "-f", "mp3",
                            f"icecast://source:{password}@{ICECAST}/live.mp3"], stdin=src.stdout)
    src.stdout.close()
    procs.extend([src, enc])
    while src.poll() is None and enc.poll() is None:
        time.sleep(3)
        write_status(on_air())
    write_status(False)
    stop()


def shutdown(*_):
    stop()
    write_status(False)
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)
    write_status(False)
    while True:
        if channel_live():
            print("channel is live, starting relay", flush=True)
            relay()
            print("relay ended", flush=True)
            time.sleep(5)
        else:
            write_status(False)
            time.sleep(OFFLINE_POLL)
