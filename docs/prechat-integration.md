# Branded UK pre-chat integration

The existing mobile/desktop Chat button opens the supplied five-step questionnaire.
Existing-order/general support bypasses the garment questions. Google sign-in and
the site's existing chat-cookie consent remain required before live delivery.
Crisp remains inbox-only: native messages and operator replies stay in the Branded panel.

## Local review

Run `npm run dev` and open `http://127.0.0.1:5510/__preview/prechat`.
With a different `DEV_PORT`, use that port instead. This loads the actual mobile
homepage in a 412 px viewport. The local dev server injects a labelled test adapter:
messages, receipts, replies and uploads are simulated. The existing local Google
sign-in preview is used. No Crisp message or customer file is sent in this mode.
Use **Ricomincia** to clear only the questionnaire draft and restart.

The seven garment photos, team portraits, logo and reference icons use SVG
viewBoxes over a shared lossless artwork asset
(`mobile/images/prechat/reference-artwork.webp`). The asset preserves the
supplied image pixels for those elements. Text, selection, upload, navigation
and the enquiry summary are interactive HTML controls.

The review sets a local session cookie so internal page navigation and automatic
mobile/desktop redirects keep the simulation active. To leave test mode, visit
`/__preview/leave`. Normal production HTML never contains the adapter. The dev
server does not execute the Vercel upload function.

## Artwork delivery

`api/prechat-upload.js` verifies the bearer session with the existing auth API,
then signs a private Spaces upload with a 10 MB limit and an exact size policy.
The enquiry sent to Crisp includes a seven-day signed download link. Upload errors
block delivery; the visitor can retry or explicitly choose to send artwork later.
File bytes are not saved in browser storage. After navigation/login they must be
reselected, and the UI requests this instead of claiming the file was uploaded.

The function reuses `DO_SPACES_KEY`, `DO_SPACES_SECRET`, `DO_SPACES_REGION` and
`DO_SPACES_BUCKET`. The bucket must allow browser POSTs from `https://brandeduk.com`
and `https://www.brandeduk.com` in its CORS configuration. Do not grant public read.
The private object uses the origin endpoint rather than the public CDN.

Deployment verification still requires a real signed-in account, chat-cookie
consent, a Crisp receipt/reply and a successful Spaces upload/download. Local
simulation does not establish that the production credentials or CORS are configured.

## Delivery behaviour

The shared chat bridge owns the single `message:sent` listener. It waits for the
matching receipt before showing success, deduplicates concurrent sends and remembers
acknowledged messages on the current page. After a receipt timeout, delivery is
uncertain; a manual retry can duplicate a message if the first receipt never arrives.
Draft answers survive navigation in session storage, and an acknowledged enquiry
opens the normal composer on subsequent pages. No commit, push or deployment is
required to review these local changes.
