# Care-Integrated Clinical Trials: Margaret's year (explainer video)

A 2:10 explainer for the Care-Integrated Clinical Trials Initiative, built with
[HyperFrames](https://github.com/heygen-com/hyperframes) (HTML + GSAP rendered to MP4).
It follows Margaret, a composite Alzheimer's patient, through the six-step patient
journey, using real footage of the web app's treatment rankings and Outcome Label. It has
narration and captions, and no music.

| File | Purpose |
| --- | --- |
| `SCRIPT.md` | Narration to record, one line per scene (voice: HeyGen "Nadine"), copied from the deck's script |
| `STORYBOARD.md` | Scene-by-scene plan: voiceover, timing, shot sequence, sources |
| `BRIEF.md`, `frame.md` | Intent, audience and the visual design system |
| `compositions/frames/*.html` | The 10 scenes; `index.html` assembles them with captions and audio |
| `public/app/*.png` | Captures of the web app used as footage (`tools/capture-app-screens.mjs`) |
| `timing/authored-words.json` | Word timings each scene was built against |
| `tools/retime-to-narration.py` | Re-times scenes to new narration without rebuilding them |
| `tools/estimate-narration.py` | Estimates word timings for lines not yet recorded, from the recorded voice's pace |
| `tools/use-local-gsap.py` | Points the generated HTML at the vendored GSAP instead of the CDN |
| `assets/vendor/gsap.min.js` | GSAP 3.15.0, vendored so previews and renders work offline ([license](https://gsap.com/standard-license)) |

Rendered MP4s, snapshots, voice samples and generated audio are not committed
(see `.gitignore`).

## Rebuilding

Requires Node 22+, ffmpeg, and the HyperFrames Claude Code plugin (or `npx hyperframes`).
Narration uses HeyGen text-to-speech (`npx hyperframes auth login`; free plan allows
10 minutes a month). `PR` below is the plugin root.

```bash
# 0. Copy the narration from the deck's script into SCRIPT.md and STORYBOARD.md
pnpm --filter @apps/acceleratedmedicine video:narration
# 1. Narration and word timings (writes assets/voice and audio_meta.json)
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/audio.mjs" \
  --script ./SCRIPT.md --storyboard ./STORYBOARD.md --hyperframes . --out ./audio_meta.json \
  --voice 83548de556df48ba8c09c42a57c51d85
# 2. If the narration's pace changed: re-time scenes, then sync durations
python tools/retime-to-narration.py
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/audio.mjs" \
  sync-durations --audio-meta ./audio_meta.json --storyboard ./STORYBOARD.md
# 3. Captions, assembly, transitions, checks, render
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/captions.mjs" \
  build --storyboard ./STORYBOARD.md --audio-meta ./audio_meta.json --hyperframes . --out ./caption_groups.json
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/assemble-index.mjs" \
  --storyboard ./STORYBOARD.md --hyperframes .
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" --script "$PR/skills/faceless-explainer/scripts/transitions.mjs" \
  inject --storyboard ./STORYBOARD.md --hyperframes .
python tools/use-local-gsap.py  # the generators write a CDN <script> tag for GSAP
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" check --timeout 60000
node "$PR/skills/hyperframes/scripts/plugin-cli.mjs" render --quality high --output renders/video.mp4
```

To swap in a recorded voice (for example your own reading of `SCRIPT.md`), produce one
file per line with word timings in `audio_meta.json`, then run steps 2–3. Scenes whose
spoken words changed must be rebuilt rather than re-timed.

`python tools/retime-to-narration.py --check` and `python tools/use-local-gsap.py --check`
change nothing, and exit 1 if a scene is out of sync with the narration or still loads GSAP
from the network.

## Narration source

The narration is the deck's "Say (video line N)" lines
(`apps/acceleratedmedicine/content/patient-journey/script.md`), so the deck and the video say the
same words. A unit test in that app compares each line with the words recorded in
`audio_meta.json`, and fails when the deck's text changes without a new recording:
`pnpm --filter @apps/acceleratedmedicine test:unit video-narration`.

## Accuracy

Every on-screen figure comes from the deck's script (its source lines and notes) or the captured
app pages. Illustrative board-report numbers are labeled
"Example report", and the Step 1 footage carries a "Prototype" pill. The
Lecanemab label values were checked against the FDA prescribing information before
capture (see the prototype's [corrections record](https://github.com/mikepsinn/dfda/blob/d0db04b51e/apps/web/data/optimitron/corrections.json)).

## Moved from the prototype repository

This project moved here from `videos/right-to-trial` in mikepsinn/dfda on October 6, 2026. The
HyperFrames project id is still `right-to-trial` (`meta.json`).

- **Narration recordings:** `assets/voice/` is not committed. The computer that rendered v4 keeps
  its copy there. Without that copy, regenerate every line with step 1, because v4 mixes takes
  recorded at different times.
- **App footage:** `public/app/*.png` are captures of the decentralized-fda prototype. The captures
  stay valid. `tools/capture-app-screens.mjs` re-captures them from that prototype's pages.

## v4

v4 follows the deck's script (`apps/acceleratedmedicine/content/patient-journey/script.md`). Lines 5, 6, 8 and 9
of `SCRIPT.md` reuse v3's recordings; the other six were recorded for v4 (Nadine, HeyGen). The
rewritten scenes were built before the new lines existed, against word timings that
`tools/estimate-narration.py` estimated from Nadine's pace in v3 (`timing/v4-estimated.json`,
`timing/authored-words.json`), then re-timed onto the recordings with
`tools/retime-to-narration.py`. To record only some lines, give step 1 a script with just those
lines and `--out` a separate file, then merge their voices into `audio_meta.json`.
