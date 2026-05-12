import { CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA } from "../parameters";

function formatMillionDollars(value: number) {
  return `$${(value / 1_000_000).toFixed(2)} million`;
}

export const HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL =
  formatMillionDollars(CORPORATE_DAMAGES_TREBLE_EXPOSURE_PER_CAPITA.value);

export const HUMANITY_V_GOVERNMENT_VERDICT_QUESTION = `Should the governments of Earth be found liable for preventable mass death and owe full damages of ${HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL} to each living human?`;

export const HUMANITY_V_GOVERNMENT_VERDICT_TEXT = {
  markdown: [
    "A YES vote means: find for Humanity.",
    `It records that the governments of Earth should owe the full damages demand: ${HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL} to each living human.`,
    "This is the verdict demand. The 1% Treaty remains the practical settlement offer.",
  ].join("\n\n"),
} as const;
