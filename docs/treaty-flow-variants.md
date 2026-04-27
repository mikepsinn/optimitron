# Treaty Flow Variants

The Treaty vote/share flow uses numbered code variants so we can ship the current best sequence while keeping older sequences available for comparison.

## Active Variants

| Variant ID | Meaning | Source |
| --- | --- | --- |
| `treaty_flow_v1_vote_first` | Current implemented slider-first flow. Preserved for later comparison. | `TreatyVoteFlow` + `TreatyPostVoteShareFlow` |
| `treaty_flow_v2_context_first` | Context-first document flow: apology, grandma, apocalypse framing, then slider/vote/verification/share. Current default. | `docs/questions.md` |

## URL Overrides

Use the `treatyFlow` query parameter to force a variant:

- `/?treatyFlow=treaty_flow_v1_vote_first`
- `/?treatyFlow=treaty_flow_v2_context_first`

Short aliases are accepted for manual QA: `v1`, `vote-first`, `v2`, `context-first`, and `document`.

## Implementation Rule

Fork the orchestration and screen order, not the mechanics. Shared pieces should include:

- allocation slider
- vote submission
- verification gate
- post-vote send loop
- Love/Bossy mode selection
- math dialog
- dashboard redirect
- analytics plumbing

Do not move structural persuasion screens into database rows. Narrative variants are code; message-template variants can be data-driven later.

## Metrics

Every funnel event should include `flow_variant`. Compare variants on:

- verified vote completion
- math dialog opens
- first recipient name entered
- copy/email action
- confirmed sent action
- second recipient started
- depth reminder opt-in
- feedback submit/skip
- dashboard arrival

For now, `treaty_flow_v2_context_first` is optimized for foundation/expert engagement and clarity. `treaty_flow_v1_vote_first` remains available for later vote/share-rate comparison.
