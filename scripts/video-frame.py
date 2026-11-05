#!/usr/bin/env python3
"""Extract one frame of a rendered MP4 as PNG (optionally scaled and cropped).

Usage:
  python3 scripts/video-frame.py VIDEO --frame N --out PNG [--scale 3] [--crop X,Y,W,H]

Frame N is the 0-based decoded frame index (equals time*fps for the constant-frame-rate
MP4s Remotion renders; not for VFR or edited files). --crop is in pixels of the original frame and
is applied before --scale. Uses the system ffmpeg (/usr/bin/ffmpeg, 2026-11-05), not the
Remotion bundled one (which lacks the select filter). To render a composition frame that
is not in an MP4 yet, use `npx remotion still ... --frame=N --scale=3 --gl=swangle`.
"""
import argparse
import os
import shutil
import subprocess
import sys

FFMPEG = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--frame", type=int, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--crop", help="X,Y,W,H in original pixels")
    a = ap.parse_args()

    filters = [f"select=eq(n\\,{a.frame})"]
    if a.crop:
        try:
            x, y, w, h = (int(v) for v in a.crop.split(","))
        except ValueError:
            ap.error("--crop needs four integers X,Y,W,H")
        filters.append(f"crop={w}:{h}:{x}:{y}")
    if a.scale != 1.0:
        filters.append(f"scale=iw*{a.scale}:ih*{a.scale}:flags=lanczos")
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", a.video,
           "-vf", ",".join(filters), "-frames:v", "1", "-fps_mode", "passthrough", a.out]
    if os.path.exists(a.out):
        os.remove(a.out)
    rc = subprocess.run(cmd).returncode
    # ffmpeg exits 0 even when the frame index is past the end and nothing is written.
    if rc == 0 and not os.path.exists(a.out):
        print(f"video-frame: no frame {a.frame} in {a.video} (past the end?)", file=sys.stderr)
        return 1
    if rc != 0:
        print(f"video-frame: ffmpeg failed (rc={rc})", file=sys.stderr)
        return rc
    print(f"video-frame: frame {a.frame} -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
