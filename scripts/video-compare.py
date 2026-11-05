#!/usr/bin/env python3
"""Check whether two rendered MP4s have identical video frames and/or audio.

Usage:
  python3 scripts/video-compare.py A.mp4 B.mp4 [--video] [--audio] [--start N --end M]

Hashes decoded frames with the system ffmpeg's framemd5 muxer (/usr/bin/ffmpeg,
2026-11-05) and reports, per stream, whether they match, how many frames differ, and the
first and last differing frame. --start/--end limit the video comparison to a frame range
(0-based, inclusive). With neither --video nor
--audio, both are compared. Exit 0 when every compared stream matches, 1 otherwise.
Caveat (measured 2026-11-05): two separate renders of MP4 differ in almost every decoded
video frame even where the scene did not change (r9c vs r9d: 811/825), because the lossy
encode differs. Use --video only to prove two files are the same render; to show an
unchanged scene across renders, compare `npx remotion still` PNGs instead. Audio hashes
are exact for files from the same encoder. Hashes ignore timestamps, so a pure timing
shift with identical frames is not detected. --start/--end apply to video only.
"""
import argparse
import shutil
import subprocess
import sys

FFMPEG = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"


def hashes(path, stream):
    # One md5 per decoded frame (video) or audio packet-sized chunk (audio).
    sel = ["-map", "0:v:0", "-an"] if stream == "video" else ["-map", "0:a:0", "-vn"]
    out = subprocess.run([FFMPEG, "-hide_banner", "-loglevel", "error", "-i", path, *sel,
                          "-f", "framemd5", "-"], capture_output=True, text=True)
    if out.returncode != 0:
        raise SystemExit(f"video-compare: ffmpeg failed on {path} ({stream}): {out.stderr.strip()[:200]}")
    return [ln.rsplit(",", 1)[1].strip() for ln in out.stdout.splitlines() if ln and not ln.startswith("#")]


def compare(a, b, stream, start=None, end=None):
    ha, hb = hashes(a, stream), hashes(b, stream)
    if stream == "video" and (start is not None or end is not None):
        lo, hi = start or 0, (end + 1) if end is not None else None
        ha, hb = ha[lo:hi], hb[lo:hi]
        offset = lo
        if not ha and not hb:
            print(f"{stream}: range {lo}-{end} is outside both files")
            return False
    else:
        offset = 0
    diff = [i + offset for i, (x, y) in enumerate(zip(ha, hb)) if x != y]
    same = not diff and len(ha) == len(hb)
    detail = f"{len(ha)} vs {len(hb)} frames"
    if diff:
        detail += f", {len(diff)} differ (first {diff[0]}, last {diff[-1]})"
    print(f"{stream}: {'identical' if same else 'DIFFERENT'} ({detail})")
    return same


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("a")
    ap.add_argument("b")
    ap.add_argument("--video", action="store_true")
    ap.add_argument("--audio", action="store_true")
    ap.add_argument("--start", type=int)
    ap.add_argument("--end", type=int)
    x = ap.parse_args()
    streams = [s for s in ("video", "audio") if getattr(x, s)] or ["video", "audio"]
    if x.start is not None or x.end is not None:
        if (x.start is not None and x.start < 0) or (x.end is not None and x.end < 0) or \
                (x.start is not None and x.end is not None and x.end < x.start):
            ap.error("--start/--end must be >= 0 and start <= end")
        if "video" not in streams:
            ap.error("--start/--end apply to video only")
    ok = all([compare(x.a, x.b, s, x.start, x.end) for s in streams])
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
