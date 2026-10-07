# Customization position-image audit

- API base: `https://api.brandeduk.com`
- Source of slugs: `test-order-popup/order.js` (`customizationConfigTarget`, `P4_CATEGORY_METHODS`, `P4_PRODUCT_ASSET_FOLDER`)
- Categories probed: 18
- Total position rows: 104
- Hard-flagged rows: 0 (mismatch / duplicate / missing / dead)
- Opaque filenames (no position tokens after stripping garment prefix): 104
- Unique image URLs checked: 104
- CSV: `customization-position-image-audit.csv`

## Flag counts (row occurrences)

- `opaque_filename`: 104

## By category

| category_slug | productType | positions | hard_flagged | opaque_filename | fetch |
|---|---|---:|---:|---:|---|
| tshirts | T-shirts | 9 | 0 | 9 | ok |
| shirts | Shirts | 8 | 0 | 8 | ok |
| polos | Polos | 9 | 0 | 9 | ok |
| hoodies | Hoodies | 8 | 0 | 8 | ok |
| sweatshirts | Sweatshirts | 9 | 0 | 9 | ok |
| fleece | Fleece | 6 | 0 | 6 | ok |
| softshells | Softshells | 6 | 0 | 6 | ok |
| jackets | Jackets | 6 | 0 | 6 | ok |
| gilets-body-warmers | Gilets & Body Warmers | 4 | 0 | 4 | ok |
| safety-vests | Hi Vis | 4 | 0 | 4 | ok |
| aprons | Aprons | 5 | 0 | 5 | ok |
| bags | Bags | 4 | 0 | 4 | ok |
| caps | Caps | 6 | 0 | 6 | ok |
| hats | Hats | 4 | 0 | 4 | ok |
| beanies | Beanies | 3 | 0 | 3 | ok |
| trousers | Trousers | 5 | 0 | 5 | ok |
| shorts | Shorts | 4 | 0 | 4 | ok |
| sweatpants | Sweatpants | 4 | 0 | 4 | ok |

## Sample mismatches

### filename_mismatch_left_right (0 total)
_none_

### duplicate_url_lr (0 total)
_none_

### missing_url (0 total)
_none_

### dead_url (0 total)
_none_

### filename_mismatch_part (0 total)
_none_

### duplicate_url_other (0 total)
_none_

## Notes

- 104/104 position image filenames are opaque (hashed uploads; garment prefix like `tshirts-short-sleeve-…` stripped before token checks). `filename_mismatch_*` only fires when remaining path tokens contradict the position label/slug.
- `duplicate_url_lr` is the strongest automated signal for swapped/shared left vs right mockups. Content-level L/R swaps with distinct opaque hashes are not detectable from filenames alone.
- No images were auto-fixed.

## Soft L/R content-length check

Compared 29 left/right position pairs via Content-Length / ETag (no image auto-fix).

- Identical URL: 0
- Identical Content-Length: 0
- Identical ETag: 0

Asymmetric sizes (ratio >= 2.0) — soft signal only; may be different crop/composition, not proof of swap:

| category | part | left_bytes | right_bytes | ratio |
|---|---|---:|---:|---:|
| polos | sleeve | 33460 | 92806 | 2.77 |
| hoodies | sleeve | 91594 | 39214 | 2.34 |
| softshells | sleeve | 52076 | 107164 | 2.06 |

## Top findings

1. All 18 category slugs from order.js resolve (HTTP 200) on https://api.brandeduk.com/api/customization-config/{slug}.
2. 104/104 positions have a live imageUrl (no missing_url / dead_url).
3. No automated hard mismatches: no shared left/right URLs, no descriptive filename left/right contradictions (uploads are opaque hashes like `tshirts-short-sleeve-<ts>-<id>.webp`).
4. Filename-only audit cannot detect content-level left/right swaps when hashes differ.
5. Soft: sleeve L/R byte sizes differ sharply for polos, hoodies, softshells — worth visual spot-check.

## Sample rows (no hard mismatch; illustrative)

- tshirts / left-chest → .../tshirts-short-sleeve-1789838196342-uqr63pcl.webp (opaque_filename)
- tshirts / right-chest → .../tshirts-short-sleeve-1789838197286-flt1pb68.webp (opaque_filename; distinct URL/size from left)
- polos / left-sleeve → 33460 bytes vs right-sleeve 92806 bytes (size_asymmetric_lr soft)

