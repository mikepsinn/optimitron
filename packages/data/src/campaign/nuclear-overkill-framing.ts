// Direct lift from manual.warondisease.org. Used on short tagline
// surfaces (endorse moral claim, donation narrative, phone-script
// template). Was previously on /donate hero — Mike preferred the
// verb-first trade headline below for the donation page specifically
// (donation surfaces need ACTION framing, not awareness framing).
export const NUCLEAR_OVERKILL_ALZHEIMERS_TAGLINE =
  "Your governments possess nuclear weapons sufficient to end civilization {NUCLEAR_WINTER_OVERKILL_FACTOR} times but have not cured Alzheimer's once.";

// Verb-first trade headline for action surfaces (donate hero).
// Tells the donor what they're DOING with their donation: trade
// one apocalypse for a 12x faster disease-eradication timeline.
export const TRADE_ONE_APOCALYPSE_HEADLINE =
  "Trade one of humanity's {NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses for disease eradication in {DFDA_QUEUE_CLEARANCE_YEARS} years instead of {STATUS_QUO_QUEUE_CLEARANCE_YEARS}.";

// Optional follow-up sentence when the surface has room.
export const NUCLEAR_OVERKILL_ALZHEIMERS_TREATY_FOLLOWUP =
  "The 1% Treaty asks them to be 1% more rational.";

// Long causal-chain explanation. Currently lives in
// TreatyVoteFlow.tsx; export so other surfaces can pull from one
// source. Numbers parameter-backed.
export const NUCLEAR_OVERKILL_FULL_EXPLANATION =
  "{NUCLEAR_WINTER_WARHEAD_THRESHOLD} nuclear weapons exploding triggers a nuclear winter that collapses the food chain and kills most humans. Humanity has about {GLOBAL_WARHEAD_COUNT} nuclear weapons. That's {NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses of mass murder capacity.";

// Full explanation + the trade pitch + "121 wasteful" framing.
// Currently lives in TreatyPostVoteShareFlow.tsx; export so other
// surfaces can pull from one source.
export const NUCLEAR_OVERKILL_TRADE_PITCH =
  NUCLEAR_OVERKILL_FULL_EXPLANATION +
  " You can only ruin Earth once. The other {NUCLEAR_OVERKILL_SPARE_LAYERS} are just wasteful. The 1% Treaty asks you to trade one apocalypse for something slightly nicer.";

// Dismissive alt-path response after the user clicks
// "More apocalypses please."
export const NUCLEAR_OVERKILL_BUTTON_REJECT_RESPONSE =
  "Cool. You voted to keep all {NUCLEAR_WINTER_OVERKILL_FACTOR} apocalypses.";
