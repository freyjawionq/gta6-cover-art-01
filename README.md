# Vice Poster Studio — GTA 6-style cover art maker (make.fun draft)

A static web app that turns your own photos and a caption into a GTA-style
multi-panel poster (Vice City sunset / neon colour grade, bold caption
lettering) and exports it as a PNG in 1080x1080, 1080x1350 or 1920x1080.

- `app/` — the app. Open `app/index.html` in desktop Chrome, or run
  `node serve.ts` and open http://localhost:8080. Works offline; photos are
  read on your machine and never uploaded.
- `screenshots/` — 4 real browser renders: the wide cover, the editor with
  the sample photo loaded, the portrait cover, the square cover.
- `main.ts` — copies `app/` + `screenshots/` to the output dir and writes
  `dossier.json` (check with `MAKEFUN_OUTPUT_DIR=out node main.ts`).
- `take-shots.mjs` — retakes the screenshots with chrome-headless-shell.
- `shots.json` — the staged scenes the screenshots use.

## Status: PRIVATE DRAFT — not submittable as-is

This draft was built outside a sealed make.fun recording (strict-transcripts
competition), so it cannot be submitted in this form. A submittable version
needs the same app rebuilt inside a fresh recorded session started after the
competition opened. No entry has been submitted from this repository.

The sample photo (`app/samples/vice-boulevard.png`) is an original image
drawn with a Python script (`/tmp/make-sample.py` on the build machine), not
a photo of a real person and not game artwork. No Rockstar logos, wordmarks,
artwork, characters or fonts are used anywhere.
