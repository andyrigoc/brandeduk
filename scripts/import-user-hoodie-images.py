#!/usr/bin/env python3
"""Copy user hoodie PNGs as-is: only replace black studio bg with white. No crop, no re-center."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(
    r"C:\Users\Anderson\.cursor\projects\c-Users-Anderson-Desktop-VS-CODE-Brandeduk\assets"
)
OUT = ROOT / "brandedukv15-child/assets/images/customization/positions/adult-tops/hoodies"

BG_LUM_THRESHOLD = 52

# User-supplied files only (no synthetic chest crops)
USER_FILES = {
    "front.png": "Hoodie_Front",
    "back.png": "Hoodie_back",
    "left-sleeve.png": "Hoodie_Sleeve_Left",
    "right-sleeve.png": "Hoodie_Sleeve_Right",
}


def find_asset(stem: str) -> Path:
    matches = sorted(ASSETS.glob(f"*{stem}*.png"))
    if not matches:
        raise FileNotFoundError(f"No file matching *{stem}* in {ASSETS}")
    return matches[-1]


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def black_to_white_only(img: Image.Image) -> Image.Image:
    """Keep composition; remove black studio backdrop."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8 or luminance(r, g, b) < BG_LUM_THRESHOLD:
                px[x, y] = (255, 255, 255, 0)

    # Flood from edges for leftover black bars
    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def edge_bg(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        if a < 12:
            return True
        return luminance(r, g, b) < BG_LUM_THRESHOLD

    for x in range(w):
        for y in (0, h - 1):
            if edge_bg(x, y) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if edge_bg(x, y) and not bg[y][x]:
                bg[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx] and edge_bg(nx, ny):
                bg[ny][nx] = True
                q.append((nx, ny))

    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                px[x, y] = (255, 255, 255, 0)

    out = Image.new("RGB", rgba.size, (255, 255, 255))
    out.paste(rgba, mask=rgba.split()[3])
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    for out_name, stem in USER_FILES.items():
        if out_name == "right-sleeve.png":
            continue
        src = find_asset(stem)
        result = black_to_white_only(Image.open(src))
        result.save(OUT / out_name, "PNG", optimize=True)
        print("OK", out_name, result.size, "<-", src.name)

    left_path = OUT / "left-sleeve.png"
    left_sleeve = Image.open(left_path)
    right_sleeve = left_sleeve.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    right_sleeve.save(OUT / "right-sleeve.png", "PNG", optimize=True)
    print("OK right-sleeve.png", right_sleeve.size, "<- mirrored from left-sleeve.png")

    # Chest cards: use full front until user provides dedicated chest PNGs
    front = OUT / "front.png"
    for chest in ("left-chest.png", "right-chest.png"):
        chest_path = OUT / chest
        chest_path.write_bytes(front.read_bytes())
        print("OK", chest, "(same as front.png — send dedicated chest files to replace)")

    print("\nDone. Original framing preserved; only black -> white.")


if __name__ == "__main__":
    main()
