#!/usr/bin/env python3
"""Split 3-panel hoodie mockup into position card assets (pullover / no zip).

Rules for all position assets:
- Pure white (#FFFFFF) background (no black studio backdrop)
- Garment centered in a square canvas with consistent padding
"""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "brandedukv15-child/assets/images/customization/positions/adult-tops/hoodies"

# Optional full 3-panel source; falls back to _split-*.png in OUT
SRC_CANDIDATES = [
    ROOT
    / "assets"
    / "vecteezy_stylish-gray-hoodie-3panel.png",
    Path(
        r"C:\Users\Anderson\.cursor\projects\c-Users-Anderson-Desktop-VS-CODE-Brandeduk\assets"
        r"\c__Users_Anderson_AppData_Roaming_Cursor_User_workspaceStorage_62e0ea8d3021629a290966732d188b3f_images"
        r"_vecteezy_stylish-gray-hoodie-with-front-pocket-and-adjustable_57981642-1833070e-c040-42a9-8de7-28df70fe37e6.png"
    ),
]

CANVAS = (480, 480)
PADDING = 0.1  # fraction of canvas
BG_LUM_THRESHOLD = 52


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def remove_dark_background(img: Image.Image) -> Image.Image:
    """Turn dark studio backdrop transparent, then flatten on white."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                px[x, y] = (255, 255, 255, 0)
                continue
            if luminance(r, g, b) < BG_LUM_THRESHOLD:
                px[x, y] = (255, 255, 255, 0)
    return flatten_on_white(rgba)


def flood_remove_edge_background(img: Image.Image) -> Image.Image:
    """Remove dark regions connected to image edges (catches leftover black bars)."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def is_bg(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        if a < 12:
            return True
        return luminance(r, g, b) < BG_LUM_THRESHOLD

    for x in range(w):
        for y in (0, h - 1):
            if is_bg(x, y) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(x, y) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and is_bg(nx, ny):
                bg[ny][nx] = True
                q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                px[x, y] = (255, 255, 255, 0)

    return flatten_on_white(rgba)


def flatten_on_white(img: Image.Image) -> Image.Image:
    base = Image.new("RGB", img.size, (255, 255, 255))
    if img.mode == "RGBA":
        base.paste(img, mask=img.split()[3])
    else:
        base.paste(img)
    return base


def content_bbox(img: Image.Image) -> tuple[int, int, int, int] | None:
    rgb = img.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    min_x, min_y = w, h
    max_x, max_y = -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r > 250 and g > 250 and b > 250:
                continue
            if luminance(r, g, b) < 8:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    if max_x < min_x:
        return None
    return (min_x, min_y, max_x + 1, max_y + 1)


def center_on_canvas(img: Image.Image, canvas: tuple[int, int] = CANVAS) -> Image.Image:
    bbox = content_bbox(img)
    if not bbox:
        return Image.new("RGB", canvas, (255, 255, 255))
    cropped = img.crop(bbox)
    cw, ch = canvas
    pad = int(min(cw, ch) * PADDING)
    target_w = cw - pad * 2
    target_h = ch - pad * 2
    iw, ih = cropped.size
    scale = min(target_w / iw, target_h / ih)
    nw = max(1, int(iw * scale))
    nh = max(1, int(ih * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGB", canvas, (255, 255, 255))
    ox = (cw - nw) // 2
    oy = (ch - nh) // 2
    out.paste(resized, (ox, oy))
    return out


def process_panel(img: Image.Image) -> Image.Image:
    cleaned = remove_dark_background(img)
    cleaned = flood_remove_edge_background(cleaned)
    return center_on_canvas(cleaned)


def crop_rel(panel: Image.Image, box_rel) -> Image.Image:
    w, h = panel.size
    l = int(box_rel[0] * w)
    t = int(box_rel[1] * h)
    r = int(box_rel[2] * w)
    b = int(box_rel[3] * h)
    return panel.crop((l, t, r, b))


def save_asset(img: Image.Image, name: str) -> None:
    out = process_panel(img)
    out.save(OUT / name, "PNG", optimize=True)


def load_panels_from_src() -> tuple[Image.Image, Image.Image, Image.Image] | None:
    for candidate in SRC_CANDIDATES:
        if not candidate.is_file():
            continue
        src = load_rgba(candidate)
        w, h = src.size
        third = w // 3
        front = src.crop((0, 0, third, h))
        side = src.crop((third, 0, third * 2, h))
        back = src.crop((third * 2, 0, w, h))
        return front, side, back
    return None


def load_panels_from_splits() -> tuple[Image.Image, Image.Image, Image.Image]:
    front = load_rgba(OUT / "_split-front.png")
    side = load_rgba(OUT / "_split-side.png")
    back = load_rgba(OUT / "_split-back.png")
    return front, side, back


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    panels = load_panels_from_src()
    if panels:
        front, side, back = panels
        process_panel(front).save(OUT / "_split-front.png", "PNG", optimize=True)
        process_panel(side).save(OUT / "_split-side.png", "PNG", optimize=True)
        process_panel(back).save(OUT / "_split-back.png", "PNG", optimize=True)
    else:
        front, side, back = load_panels_from_splits()

    save_asset(front, "front.png")
    save_asset(back, "back.png")
    save_asset(crop_rel(front, (0.52, 0.22, 0.88, 0.58)), "left-chest.png")
    save_asset(crop_rel(front, (0.12, 0.22, 0.48, 0.58)), "right-chest.png")

    left_sleeve = crop_rel(side, (0.08, 0.12, 0.92, 0.88))
    save_asset(left_sleeve, "left-sleeve.png")
    save_asset(left_sleeve.transpose(Image.Transpose.FLIP_LEFT_RIGHT), "right-sleeve.png")

    # Remove legacy JPGs (black-background versions)
    for legacy in OUT.glob("*.jpg"):
        legacy.unlink(missing_ok=True)

    print("Saved to", OUT)
    for p in sorted(OUT.glob("*.png")):
        if p.name.startswith("_"):
            continue
        print(" ", p.name, p.stat().st_size)


if __name__ == "__main__":
    main()
