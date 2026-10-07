#!/usr/bin/env python3
"""Soft check: L/R position pairs with identical Content-Length or ETag."""

import json
import re
import urllib.request
from collections import defaultdict

API = "https://api.brandeduk.com"
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


def side(slug, label):
    t = (slug + " " + label).lower()
    if re.search(r"\bleft\b", t):
        return "left"
    if re.search(r"\bright\b", t):
        return "right"
    return None


def part_key(slug):
    s = re.sub(r"[^a-z0-9]+", "-", slug.lower()).strip("-")
    s = re.sub(r"^(left|right)-", "", s)
    s = re.sub(r"-(left|right)$", "", s)
    return s


def meta(url):
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(
                url, method=method, headers={"User-Agent": "BrandedUK-Audit/1.0"}
            )
            with urllib.request.urlopen(req, timeout=12) as r:
                cl = r.headers.get("Content-Length")
                et = r.headers.get("ETag")
                if method == "GET" and not cl:
                    cl = str(len(r.read()))
                return {"cl": cl, "etag": et}
        except Exception:
            if method == "HEAD":
                continue
            return {}
    return {}


def main():
    pairs = []
    for slug in SLUGS:
        body = json.loads(
            urllib.request.urlopen(
                f"{API}/api/customization-config/{slug}", timeout=20
            ).read().decode()
        )
        data = body.get("data", body)
        by_part = defaultdict(dict)
        for p in data.get("positions") or []:
            ps = p.get("slug") or ""
            lab = p.get("label") or ""
            sd = side(ps, lab)
            if not sd:
                continue
            by_part[part_key(ps)][sd] = {
                "slug": ps,
                "url": (p.get("imageUrl") or "").strip(),
            }
        for pk, sides in by_part.items():
            if "left" not in sides or "right" not in sides:
                continue
            L, R = sides["left"], sides["right"]
            ml, mr = meta(L["url"]), meta(R["url"])
            same_url = L["url"] == R["url"]
            same_cl = bool(ml.get("cl") and mr.get("cl") and ml["cl"] == mr["cl"])
            same_etag = bool(
                ml.get("etag") and mr.get("etag") and ml["etag"] == mr["etag"]
            )
            row = {
                "category": slug,
                "part": pk,
                "left": L["slug"],
                "right": R["slug"],
                "same_url": same_url,
                "same_cl": same_cl,
                "same_etag": same_etag,
                "cl_l": ml.get("cl"),
                "cl_r": mr.get("cl"),
            }
            pairs.append(row)
            print(
                f"{slug}/{pk}: same_url={same_url} same_cl={same_cl} "
                f"cl={ml.get('cl')}/{mr.get('cl')} etag_same={same_etag}"
            )

    suspicious = [p for p in pairs if p["same_url"] or p["same_cl"] or p["same_etag"]]
    print("TOTAL_LR_PAIRS", len(pairs))
    print("SUSPICIOUS", len(suspicious))
    for p in suspicious:
        print("SUS", p)


if __name__ == "__main__":
    main()
