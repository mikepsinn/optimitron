# 1% Treaty — Song + Video Production Guide

## CHEAPEST APPROACH: Total Cost $0–$10

### Tool 1: SUNO AI (suno.com) — FREE tier
- 50 credits/day = ~10 song generations
- No account needed beyond Google sign-in
- Generates full 2–4 minute songs with vocals from lyrics + style prompt

### Tool 2: OBS Studio — FREE
- Screen-record the HTML music video at 1920x1080

### Tool 3: CapCut or DaVinci Resolve — FREE
- Combine the Suno audio with the screen recording

---

## STEP 1: Generate the Song on Suno

Go to **suno.com** → Create → Custom

### Style Prompt (paste into "Style of Music"):
```
dark synthwave, spoken word verses, anthemic chorus, electronic, cinematic, female vocal, 110 bpm, dramatic build, minor key, industrial undertones
```

### Lyrics (paste into "Lyrics"):
```
[Intro - spoken, reverb]
A message from four thousand two hundred and thirty-seven light-years away
To the species that spends six hundred and four dollars on killing
For every one dollar on healing

[Verse 1]
Six hundred and four to one
That's your ratio, that's what you've done
For every dollar spent to find which medicines work
Six hundred four on weapons — on making humans stop

Thirteen thousand warheads sitting on standby
Enough to end your world thirteen times
In case the first twelve apocalypses
Fail to take — you built backups for the end

[Chorus]
One percent — that's all we're asking
One percent — a pen, thirty seconds
One percent — the wrist moves or
A hundred four more humans stop
Every single minute
One percent

[Verse 2]
Four hundred forty-three years in the queue to not die
At current funding, cures arrive in twenty-four sixty-nine
Everyone alive today will be dead before it clears
Their children too — their grandchildren — probably also

A drug passes the safety test
Everyone agrees it will not kill you
Eight-point-two years on a desk — not a war, a desk
Before a committee says you may have it

[Chorus]
One percent — not ten, not fifty
One percent — a desk, a pen
One percent — or the branding problem
Keeps killing a hundred four a minute
One percent

[Bridge - spoken]
Your employee has a pen and thirty seconds
It has been sitting on a desk
The murder budget or the medicine budget
Thirty seconds of wrist movement
One hundred fifty thousand humans stop every day
One Holocaust every forty days
With fewer Nazis and more insurance paperwork

[Build]
Six-oh-four on weapons — one on cures
Thirteen thousand warheads — zero diseases gone
Four forty-three years in the queue — thirty-five with one percent
A hundred fifty thousand dead today — one pen stroke to start

[Final Chorus - big, anthemic]
One percent
One percent
One percent
If that is too much to ask
Your species has a branding problem
About what it actually values
And the branding problem
Is killing a hundred four humans
Every minute

[Outro - fade]
One percent... one percent... one percent...
Sign the treaty
```

### Alternative Style Prompts (try if first doesn't hit):
- `industrial hip-hop, spoken word, dark, cinematic, 90 bpm, male vocal, political, urgent`
- `orchestral dark pop, dramatic strings, choir, female vocal, 100 bpm, epic build, minor key`
- `acoustic folk protest song, raw, urgent, male vocal, finger-picked guitar, 95 bpm`

---

## STEP 2: Screen-Record the HTML Video

1. Open `one-percent-treaty-video.html` in Chrome (full screen, 1920x1080)
2. Open OBS Studio → set canvas to 1920x1080 → Window Capture on Chrome
3. Press PLAY on the HTML page and Record simultaneously
4. The video auto-advances through 12 scenes over ~109 seconds
5. If your song is longer, you can adjust `sceneDurations` in the HTML

### Adjusting timing to match your Suno output:
In the HTML file, find the `sceneDurations` array and adjust milliseconds per scene to match your song's sections. The scenes correspond to:
```
Scene 0  → Intro (title card)
Scene 1  → Verse 1, line 1 (604:1 ratio)
Scene 2  → Verse 1, line 2 (13,000 warheads)
Scene 3  → Chorus 1
Scene 4  → Verse 2, line 1 (443 years)
Scene 5  → Verse 2, line 2 (8.2 years)
Scene 6  → 150,000 daily deaths
Scene 7  → Chorus 2
Scene 8  → Bridge (spoken)
Scene 9  → Data cascade build
Scene 10 → Final chorus
Scene 11 → Outro / CTA
```

---

## STEP 3: Combine Audio + Video

### Option A: CapCut (free, desktop or web)
1. Import the screen recording + the Suno MP3
2. Mute the video track, add the audio
3. Trim/align, export as MP4 1080p

### Option B: FFmpeg (free, one command)
```bash
ffmpeg -i video.mp4 -i song.mp3 -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest output.mp4
```

### Option C: DaVinci Resolve (free tier)
Full editor if you want to add extra effects, color grading, etc.

---

## STEP 4: Upload

- **YouTube** — free, add to channel
- **TikTok/Reels** — crop to 9:16 in CapCut, use the chorus section (scenes 3 or 7)

---

## Cost Summary

| Tool | Cost |
|------|------|
| Suno AI (free tier) | $0 |
| OBS Studio | $0 |
| CapCut / DaVinci Resolve | $0 |
| YouTube upload | $0 |
| **Total** | **$0** |

If you want more Suno generations or higher quality, Suno Pro is $10/mo for 500 songs.

---

## Key Statistics (for video description / caption)

- 604:1 — weapons-to-medicine spending ratio
- 443 years — time to clear disease treatment queue at current funding
- 150,000 — daily deaths from treatable diseases
- 8.2 years — delay after a drug is proven safe
- 13,000 — nuclear warheads on standby (122x apocalypse threshold)
- 104 — humans who die every minute of delay
- 1% — the amount to redirect. A pen. Thirty seconds.
