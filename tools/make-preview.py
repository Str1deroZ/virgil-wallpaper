"""Render Lively's library thumbnail and hover preview for Virgil.

Runs tools/preview.html in headless Edge, then writes thumbnail.jpg and
preview.gif next to LivelyInfo.json. Re-run after changing how Virgil looks.

    python tools/make-preview.py
"""
import base64
import io
import json
import re
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
FRAME_MS = 100


def render_frames():
    page = (ROOT / "tools" / "preview.html").as_uri()
    dom = subprocess.run(
        [str(EDGE), "--headless=new", "--disable-gpu", "--allow-file-access-from-files",
         "--virtual-time-budget=10000", "--dump-dom", page],
        capture_output=True, text=True, encoding="utf-8", check=True,
    ).stdout
    match = re.search(r'<pre id="out">(.*?)</pre>', dom, re.S)
    if not match or not match.group(1).strip():
        raise SystemExit("preview.html produced no frames")
    urls = json.loads(match.group(1).replace("&quot;", '"').replace("&amp;", "&"))
    return [Image.open(io.BytesIO(base64.b64decode(u.split(",", 1)[1]))).convert("RGB") for u in urls]


def main():
    frames = render_frames()
    frames[0].save(ROOT / "thumbnail.jpg", quality=92)
    frames[0].save(
        ROOT / "preview.gif", save_all=True, append_images=frames[1:],
        duration=FRAME_MS, loop=0, optimize=True,
    )
    print(f"wrote thumbnail.jpg and preview.gif ({len(frames)} frames)")


if __name__ == "__main__":
    main()
