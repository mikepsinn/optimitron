/**
 * Generate narration audio for the PL Genesis demo video using Gemini TTS.
 *
 * Uses the Gemini API's multimodal generation to produce speech audio
 * from the demo script narration text.
 *
 * Usage:
 *   GOOGLE_API_KEY=... tsx scripts/generate-narration.ts
 *
 * Output: packages/web/demo-assets/narration/ (WAV files per section)
 */
import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUTPUT_DIR = join(__dirname, "..", "demo-assets", "narration");

// Narration segments from the demo script — each becomes a separate audio file
const narrationSegments = [
  {
    id: "01-hook",
    text: `Your governments are misaligned superintelligences — collective intelligence systems controlling billions of lives, optimising for re-election instead of welfare. I built alignment software. It works on my planet. Let's see if your species can handle it.`,
  },
  {
    id: "02-wishocracy-intro",
    text: `Step one: actually ask people what they want. Radical concept, I know.`,
  },
  {
    id: "02-wishocracy-detail",
    text: `Citizens compare budget priorities head-to-head. Eigenvector decomposition produces stable preference weights from as few as ten comparisons. Your species invented this maths in 1977 and then mostly used it to rank sports teams. Every preference snapshot is stored on Storacha — content-addressed, immutable, linked to its predecessor. No server can alter it after the fact.`,
  },
  {
    id: "03-alignment",
    text: `Step two: find out which of your elected officials actually agrees with you. Voting records are compared against citizen preferences. Each politician gets a Citizen Alignment Score — a single number that answers "how much do they actually represent you?"`,
  },
  {
    id: "04-hypercerts",
    text: `Every alignment score is published as a Hypercert on the AT Protocol and stored on Storacha. Click any CID. You'll see the raw JSON — the Activity claim, the Measurements, the Evaluation. Tamper-proof. Auditable by anyone. This is what accountability looks like when you take it seriously.`,
  },
  {
    id: "05-prize",
    text: `Traditional philanthropy: give money, hope it works, never check. My approach: outcome-based escrow. Donors deposit WISH tokens into a Prize Pool smart contract. The funds are locked until health and income metrics cross verifiable thresholds. Then donors vote on which implementers get paid, weighted by deposit amount. Your deposit IS your identity. No sybil attacks possible. Implementers register with Storacha CIDs linking to their Hypercert evidence. Challengers can post a bond to dispute allocations. Lose, you forfeit the bond. Win, the fraudster gets deactivated. Accountability with teeth.`,
  },
  {
    id: "06-wish-token",
    text: `Now for the part your campaign finance lobbyists won't enjoy. The WISH token has a 0.5% transaction tax. That replaces your IRS. No 74,000-page tax code. No 83,000 employees. Revenue collection as a protocol feature. The tax funds two things: Universal Basic Income, distributed automatically to verified citizens via World ID, and Incentive Alignment Bonds, where smart contracts distribute campaign funds to politicians based on their Hypercert-verified alignment scores. Politicians earn funding by aligning with citizens, not donors. No PACs. No lobbyists. Just maths.`,
  },
  {
    id: "07-architecture",
    text: `Under the hood: 15 packages, 2,600 tests, a domain-agnostic causal inference engine, and a fully typed TypeScript monorepo. Storacha for content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. All open source.`,
  },
  {
    id: "08-close",
    text: `Storacha makes governance data immutable. Hypercerts make it auditable. Smart contracts make it enforceable. Your species has had these tools for years. You just keep not using them. Optomitron. Alignment software for the most powerful AIs on your planet — the ones made of people.`,
  },
];

async function generateNarration() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error(
      "Error: Set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY environment variable",
    );
    process.exit(1);
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const client = new GoogleGenAI({ apiKey });

  console.log(`Generating ${narrationSegments.length} narration segments...\n`);

  for (const segment of narrationSegments) {
    const outputPath = join(OUTPUT_DIR, `${segment.id}.wav`);

    if (existsSync(outputPath)) {
      console.log(`  [skip] ${segment.id} — already exists`);
      continue;
    }

    console.log(`  [gen]  ${segment.id} (${segment.text.length} chars)...`);

    try {
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [
          {
            role: "user",
            parts: [{ text: segment.text }],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                // Kore = authoritative female voice — closest to Wishonia's deadpan British-ish style
                voiceName: "Kore",
              },
            },
          },
        },
      } as any);

      // Extract audio data from response
      const candidate = (response as any).candidates?.[0];
      const audioPart = candidate?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("audio/"),
      );

      if (!audioPart?.inlineData?.data) {
        console.error(`  [err]  ${segment.id} — no audio in response`);
        // Write the raw response for debugging
        writeFileSync(
          join(OUTPUT_DIR, `${segment.id}.debug.json`),
          JSON.stringify(response, null, 2),
        );
        continue;
      }

      const audioBuffer = Buffer.from(audioPart.inlineData.data, "base64");
      writeFileSync(outputPath, audioBuffer);
      console.log(
        `  [ok]   ${segment.id} — ${(audioBuffer.length / 1024).toFixed(0)} KB`,
      );
    } catch (error: any) {
      console.error(`  [err]  ${segment.id} — ${error.message}`);

      // If TTS model not available, fall back to generating a timing guide
      if (
        error.message?.includes("not found") ||
        error.message?.includes("not supported")
      ) {
        console.log(
          "\n  Note: Gemini TTS model may not be available in your region.",
        );
        console.log(
          "  Falling back to generating timing guide for manual recording.\n",
        );
        await generateTimingGuide();
        return;
      }
    }

    // Rate limit courtesy
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\nDone! Audio files saved to: ${OUTPUT_DIR}`);
  console.log(
    "\nTo combine with video, use ffmpeg:",
  );
  console.log(
    "  ffmpeg -i demo-video.webm -i narration/01-hook.wav -c:v copy -c:a aac output.mp4",
  );
}

async function generateTimingGuide() {
  const guidePath = join(OUTPUT_DIR, "timing-guide.txt");
  const lines: string[] = [
    "NARRATION TIMING GUIDE",
    "=====================",
    "Read each segment aloud at a deadpan, measured pace.",
    "Wishonia voice: British-ish, dry, slightly disappointed.",
    "",
  ];

  // Estimate ~150 words per minute for deadpan delivery
  const WPM = 140;

  let totalSeconds = 0;
  for (const segment of narrationSegments) {
    const words = segment.text.split(/\s+/).length;
    const seconds = Math.ceil((words / WPM) * 60);
    totalSeconds += seconds;
    lines.push(`[${segment.id}] ~${seconds}s (${words} words)`);
    lines.push(`  "${segment.text}"`);
    lines.push("");
  }

  lines.push(`TOTAL: ~${Math.ceil(totalSeconds / 60)}m ${totalSeconds % 60}s`);

  writeFileSync(guidePath, lines.join("\n"));
  console.log(`  Timing guide written to: ${guidePath}`);
}

generateNarration().catch(console.error);
