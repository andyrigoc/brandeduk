#!/usr/bin/env python3
"""Audit customization-config position imageUrl mappings (read-only)."""

import csv
import json
import os
import re
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import unquote, urlparse

API = "https://api.brandeduk.com"
OUT_DIR = Path(__file__).resolve().parent
CSV_PATH = OUT_DIR / "customization-position-image-audit.csv"
MD_PATH = OUT_DIR / "customization-position-image-audit.md"

# From order.js: customizationConfigTarget + P4_CATEGORY_METHODS + P4_PRODUCT_ASSET_FOLDER
SLUGS = [
    "tshirts",
    "shirts",
    "polos",
    "hoodies",
    "sweatshirts",
    "fleece",
    "softshells",
    "jackets",
    "gilets-body-warmers",
    "safety-vests",
    "aprons",
    "bags",
    "caps",
    "hats",
    "beanies",
    "trousers",
    "shorts",
    "sweatpants",
]

SIDE_TOKENS = {
    "left": {"left", "lft", "lh"},
    "right": {"right", "rgt", "rh"},
}
PART_TOKENS = {
    "chest": {"chest", "breast"},
    "sleeve": {"sleeve", "arm", "cuff"},
    "back": {"back", "nape"},
    "front": {"front"},
    "side": {"side"},
}


def normalize(s):
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")


def tokens_from(text):
    t = normalize(text)
    parts = set(t.split("-")) if t else set()
    return parts, t


def detect_side(parts, raw):
    for side, toks in SIDE_TOKENS.items():
        if parts & toks:
            return side
    for side, toks in SIDE_TOKENS.items():
        for tok in toks:
            if re.search(rf"(^|-){re.escape(tok)}(-|$)", raw):
                return side
    return None


def detect_parts(parts, raw):
    found = set()
    for part, toks in PART_TOKENS.items():
        if parts & toks:
            found.add(part)
            continue
        for tok in toks:
            if re.search(rf"(^|-){re.escape(tok)}(-|$)", raw):
                found.add(part)
                break
    return found


def filename_from_url(url):
    if not url:
        return ""
    path = unquote(urlparse(url).path)
    return os.path.basename(path).lower()


# Garment/product descriptors commonly embedded in upload names (not position labels).
GARMENT_NOISE = re.compile(
    r"(^|-)("
    r"short-sleeve|long-sleeve|crew-?neck|crewneck|pullover|full-zip|half-zip|"
    r"softshell(?:-jacket)?|workwear|waistcoat|baseball|bucket|cuffed|bobble|"
    r"bib|tote|gym-bag|joggers|work-trousers|shorts|standard|"
    r"tshirts?|shirts?|polos?|hoodies?|sweatshirts?|fleece|softshells?|"
    r"jackets?|gilets?(?:-body-warmers)?|safety-vests?|aprons?|bags?|"
    r"caps?|hats?|beanies?|trousers?|sweatpants?"
    r")(?=-|$)",
    re.I,
)


def positionish_filename(file_name):
    """Strip extension + garment/category noise so only position tokens remain."""
    if not file_name:
        return ""
    stem = re.sub(r"\.[a-z0-9]+$", "", file_name.lower())
    # Drop trailing opaque id chunks: -<digits>-<alnum>
    stem = re.sub(r"-\d{10,}-[a-z0-9]+$", "", stem)
    cleaned = stem
    prev = None
    while prev != cleaned:
        prev = cleaned
        cleaned = GARMENT_NOISE.sub(r"\1", cleaned)
    cleaned = re.sub(r"-{2,}", "-", cleaned).strip("-")
    return cleaned


def check_url(url, timeout=8):
    if not url:
        return "missing"
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(
                url, method=method, headers={"User-Agent": "BrandedUK-Audit/1.0"}
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                code = getattr(resp, "status", 200) or 200
                if 200 <= code < 400:
                    return "ok"
                return f"http_{code}"
        except urllib.error.HTTPError as e:
            if e.code in (405, 501) and method == "HEAD":
                continue
            if e.code == 403 and method == "HEAD":
                continue
            return f"http_{e.code}"
        except Exception:
            if method == "HEAD":
                continue
            return "error"
    return "error"


def fetch_config(slug):
    url = f"{API}/api/customization-config/{slug}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "BrandedUK-Audit/1.0", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    return body.get("data", body)


def main():
    rows = []
    category_meta = {}
    url_cache = {}

    for slug in SLUGS:
        try:
            data = fetch_config(slug)
            positions = data.get("positions") or []
            category_meta[slug] = {
                "ok": True,
                "productType": (data.get("productType") or {}).get("name") or slug,
                "count": len(positions),
                "error": None,
            }
        except Exception as e:
            category_meta[slug] = {
                "ok": False,
                "productType": slug,
                "count": 0,
                "error": str(e),
            }
            rows.append(
                {
                    "category_slug": slug,
                    "position_slug": "",
                    "label": "",
                    "imageUrl": "",
                    "flags": f"config_fetch_error:{type(e).__name__}",
                    "notes": str(e)[:200],
                }
            )
            continue

        by_url = defaultdict(list)
        for p in positions:
            u = (p.get("imageUrl") or p.get("image_url") or "").strip()
            if u:
                by_url[u].append(p)

        for p in positions:
            pos_slug = p.get("slug") or ""
            label = p.get("label") or ""
            image_url = (p.get("imageUrl") or p.get("image_url") or "").strip()
            flags = []
            notes = []

            if not image_url:
                flags.append("missing_url")

            if image_url:
                if image_url not in url_cache:
                    url_cache[image_url] = check_url(image_url)
                    time.sleep(0.05)
                status = url_cache[image_url]
                if status != "ok":
                    flags.append(f"dead_url:{status}")

            slug_parts, slug_raw = tokens_from(pos_slug)
            label_parts, label_raw = tokens_from(label)
            file_name = filename_from_url(image_url)
            pos_file = positionish_filename(file_name)
            file_parts, file_raw = tokens_from(pos_file.replace(".", "-"))

            expected_side = detect_side(
                slug_parts | label_parts, slug_raw + "-" + label_raw
            )
            file_side = detect_side(file_parts, file_raw) if pos_file else None
            expected_parts = detect_parts(
                slug_parts | label_parts, slug_raw + "-" + label_raw
            )
            file_parts_set = detect_parts(file_parts, file_raw) if pos_file else set()

            if expected_side and file_side and expected_side != file_side:
                flags.append("filename_mismatch_left_right")
                notes.append(
                    f"expected_side={expected_side} file_side={file_side} "
                    f"file={file_name} pos_tokens={pos_file or '(none)'}"
                )

            conflicting = []
            for part in ("chest", "sleeve", "back", "front", "side"):
                if part in expected_parts and file_parts_set and part not in file_parts_set:
                    other = file_parts_set - {part}
                    if other & {"chest", "sleeve", "back", "front", "side"}:
                        conflicting.append(f"{part} vs {sorted(other)}")
            if conflicting:
                flags.append("filename_mismatch_part")
                notes.append(
                    "part_conflict:"
                    + ";".join(conflicting)
                    + f" file={file_name} pos_tokens={pos_file or '(none)'}"
                )

            # Informative: opaque upload name (no left/right/chest/sleeve after noise strip)
            if image_url and not file_side and not file_parts_set:
                # not a hard failure flag — recorded in notes only when other flags exist;
                # also as soft flag for transparency in CSV
                flags.append("opaque_filename")
                notes.append(f"no_position_tokens_in_filename file={file_name}")

            if image_url and len(by_url[image_url]) > 1:
                siblings = by_url[image_url]
                sides = set()
                for sib in siblings:
                    sp, sr = tokens_from(sib.get("slug") or "")
                    lp, lr = tokens_from(sib.get("label") or "")
                    sides.add(detect_side(sp | lp, sr + "-" + lr))
                if "left" in sides and "right" in sides:
                    flags.append("duplicate_url_lr")
                    other = [
                        normalize(sib.get("slug"))
                        for sib in siblings
                        if normalize(sib.get("slug")) != normalize(pos_slug)
                    ]
                    notes.append("same_url_as=" + ",".join(other))
                else:
                    others = [
                        normalize(sib.get("slug"))
                        for sib in siblings
                        if normalize(sib.get("slug")) != normalize(pos_slug)
                    ]
                    if others:
                        flags.append("duplicate_url_other")
                        notes.append("same_url_as=" + ",".join(others))

            rows.append(
                {
                    "category_slug": slug,
                    "position_slug": pos_slug,
                    "label": label,
                    "imageUrl": image_url,
                    "flags": "|".join(flags) if flags else "",
                    "notes": " | ".join(notes),
                }
            )

    fieldnames = [
        "category_slug",
        "position_slug",
        "label",
        "imageUrl",
        "flags",
        "notes",
    ]
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    flagged = [r for r in rows if r["flags"] and r["position_slug"]]
    hard_flagged = [
        r
        for r in flagged
        if any(
            f.split(":")[0]
            in {
                "filename_mismatch_left_right",
                "filename_mismatch_part",
                "duplicate_url_lr",
                "duplicate_url_other",
                "missing_url",
                "dead_url",
                "config_fetch_error",
            }
            for f in r["flags"].split("|")
        )
    ]
    flag_counts = Counter()
    for r in flagged:
        for fl in r["flags"].split("|"):
            if fl:
                flag_counts[fl.split(":")[0]] += 1

    by_cat = {}
    for slug in SLUGS:
        cat_rows = [r for r in rows if r["category_slug"] == slug and r["position_slug"]]
        cat_hard = [
            r
            for r in cat_rows
            if any(
                f.split(":")[0]
                in {
                    "filename_mismatch_left_right",
                    "filename_mismatch_part",
                    "duplicate_url_lr",
                    "duplicate_url_other",
                    "missing_url",
                    "dead_url",
                }
                for f in (r["flags"] or "").split("|")
                if f
            )
        ]
        cat_opaque = [r for r in cat_rows if "opaque_filename" in (r["flags"] or "")]
        by_cat[slug] = {
            "positions": len(cat_rows),
            "flagged": len(cat_hard),
            "opaque": len(cat_opaque),
            "ok": category_meta[slug]["ok"],
            "name": category_meta[slug]["productType"],
            "error": category_meta[slug]["error"],
        }

    def sample(kind, n=8):
        return [r for r in flagged if kind in r["flags"]][:n]

    samples = {
        "filename_mismatch_left_right": sample("filename_mismatch_left_right"),
        "duplicate_url_lr": sample("duplicate_url_lr"),
        "missing_url": sample("missing_url"),
        "dead_url": sample("dead_url"),
        "filename_mismatch_part": sample("filename_mismatch_part"),
        "duplicate_url_other": sample("duplicate_url_other"),
    }

    total_positions = sum(1 for r in rows if r["position_slug"])
    lines = [
        "# Customization position-image audit",
        "",
        f"- API base: `{API}`",
        "- Source of slugs: `test-order-popup/order.js` "
        "(`customizationConfigTarget`, `P4_CATEGORY_METHODS`, `P4_PRODUCT_ASSET_FOLDER`)",
        f"- Categories probed: {len(SLUGS)}",
        f"- Total position rows: {total_positions}",
        f"- Hard-flagged rows: {len(hard_flagged)} "
        "(mismatch / duplicate / missing / dead)",
        f"- Opaque filenames (no position tokens after stripping garment prefix): "
        f"{flag_counts.get('opaque_filename', 0)}",
        f"- Unique image URLs checked: {len(url_cache)}",
        f"- CSV: `{CSV_PATH.name}`",
        "",
        "## Flag counts (row occurrences)",
        "",
    ]
    if flag_counts:
        for k, v in flag_counts.most_common():
            lines.append(f"- `{k}`: {v}")
    else:
        lines.append("- (none)")

    lines.extend(
        [
            "",
            "## By category",
            "",
            "| category_slug | productType | positions | hard_flagged | opaque_filename | fetch |",
            "|---|---|---:|---:|---:|---|",
        ]
    )
    for slug in SLUGS:
        c = by_cat[slug]
        fetch = "ok" if c["ok"] else f'ERR: {c["error"]}'
        lines.append(
            f"| {slug} | {c['name']} | {c['positions']} | {c['flagged']} | "
            f"{c['opaque']} | {fetch} |"
        )

    lines.extend(["", "## Sample mismatches", ""])
    for kind, items in samples.items():
        total_kind = len([r for r in flagged if kind in r["flags"]])
        lines.append(f"### {kind} ({total_kind} total)")
        if not items:
            lines.append("_none_")
            lines.append("")
            continue
        for r in items:
            lines.append(
                f"- **{r['category_slug']}** / `{r['position_slug']}` "
                f"({r['label']}): `{r['flags']}`"
            )
            if r["notes"]:
                lines.append(f"  - notes: {r['notes']}")
            if r["imageUrl"]:
                lines.append(f"  - url: `{r['imageUrl']}`")
        lines.append("")

    opaque = flag_counts.get("opaque_filename", 0)
    lines.extend(
        [
            "## Notes",
            "",
            f"- {opaque}/{total_positions} position image filenames are opaque "
            "(hashed uploads; garment prefix like `tshirts-short-sleeve-…` stripped "
            "before token checks). `filename_mismatch_*` only fires when remaining "
            "path tokens contradict the position label/slug.",
            "- `duplicate_url_lr` is the strongest automated signal for swapped/"
            "shared left vs right mockups. Content-level L/R swaps with distinct "
            "opaque hashes are not detectable from filenames alone.",
            "- No images were auto-fixed.",
            "",
        ]
    )

    MD_PATH.write_text("\n".join(lines), encoding="utf-8")

    print("CSV", CSV_PATH)
    print("MD", MD_PATH)
    print("TOTAL_POSITIONS", total_positions)
    print("HARD_FLAGGED", len(hard_flagged))
    print("OPAQUE", opaque)
    print("FLAGS", dict(flag_counts))
    print("---BY CAT---")
    for slug in SLUGS:
        c = by_cat[slug]
        print(
            f"{slug}: positions={c['positions']} hard={c['flagged']} opaque={c['opaque']}"
        )
    print("---SAMPLES DUP LR---")
    for r in samples["duplicate_url_lr"][:6]:
        print(
            f"{r['category_slug']}|{r['position_slug']}|{r['flags']}|{r['notes']}|{r['imageUrl'][:80]}"
        )
    print("---SAMPLES FILENAME LR---")
    for r in samples["filename_mismatch_left_right"][:6]:
        print(
            f"{r['category_slug']}|{r['position_slug']}|{r['flags']}|{r['notes']}|{r['imageUrl'][:80]}"
        )
    print("---SAMPLES MISSING---")
    for r in samples["missing_url"][:6]:
        print(f"{r['category_slug']}|{r['position_slug']}|{r['flags']}")
    print("---SAMPLES DEAD---")
    for r in samples["dead_url"][:6]:
        print(
            f"{r['category_slug']}|{r['position_slug']}|{r['flags']}|{r['imageUrl'][:80]}"
        )
    print("---SAMPLES PART---")
    for r in samples["filename_mismatch_part"][:6]:
        print(
            f"{r['category_slug']}|{r['position_slug']}|{r['flags']}|{r['notes']}|{r['imageUrl'][:80]}"
        )
    print("---SAMPLES DUP OTHER---")
    for r in samples["duplicate_url_other"][:6]:
        print(
            f"{r['category_slug']}|{r['position_slug']}|{r['flags']}|{r['notes']}|{r['imageUrl'][:80]}"
        )


if __name__ == "__main__":
    main()
