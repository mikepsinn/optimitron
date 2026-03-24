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
import "./load-env";
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
    text: `Traditional philanthropy: give money, hope it works, never check. My approach: outcome-based escrow. Depositors put USDC into the Prize Pool smart contract and receive PRIZE claim tokens — their receipt for a share of the pool. The funds earn Aave V3 yield while locked. If health and income metrics cross verifiable thresholds, the funds flow to verified implementers. If they don't, PRIZE holders get their principal back plus roughly 4.2x in accrued yield. You either fix civilisation or you quadruple your money. Implementers register with Storacha CIDs linking to their Hypercert evidence. Challengers can post a bond to dispute allocations. Lose, you forfeit the bond. Win, the fraudster gets deactivated. Accountability with teeth.`,
  },
  {
    id: "06-wish-token",
    text: `Now for the part your campaign finance lobbyists won't enjoy. Two separate instruments. First: Incentive Alignment Bonds. Investors buy bonds. The proceeds fund campaigns for politicians who vote to reallocate from low to high net social value activities — ranked by their Hypercert-verified Alignment Scores. Treaty passes, bondholders earn perpetual returns from treaty revenue. Politicians earn funding by aligning with citizens, not donors. Second: the WISH token. A 0.5% transaction tax replaces your IRS. No 74,000-page tax code. No 83,000 employees. Revenue collection as a protocol feature. The tax funds Universal Basic Income, distributed automatically to verified citizens via World ID, and wishocratic budget allocation. No PACs. No lobbyists. Just maths.`,
  },
  {
    id: "07-architecture",
    text: `Under the hood: 15 packages, 2,600 tests, a domain-agnostic causal inference engine, and a fully typed TypeScript monorepo. Storacha for content-addressed storage. Hypercerts for verifiable attestations. Solidity for enforceable incentives. All open source.`,
  },
  {
    id: "08-close",
    text: `Storacha makes governance data immutable. Hypercerts make it auditable. Smart contracts make it enforceable. Your species has had these tools for years. You just keep not using them. Optimitron. Alignment software for the most powerful AIs on your planet — the ones made of people.`,
  },
];

async function generateNarration() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error(
      "Error: No Gemini API key found.\n" +
      "  Set GOOGLE_GENERATIVE_AI_API_KEY in .env (project root) or as an environment variable.",
    );
    process.exit(1);
  }

  console.log("Using GOOGLE_GENERATIVE_AI_API_KEY from .env\n");

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

      const mimeType: string = audioPart.inlineData.mimeType ?? "audio/wav";
      // Determine file extension from mime type
      const extMap: Record<string, string> = {
        "audio/wav": ".wav",
        "audio/mp3": ".mp3",
        "audio/mpeg": ".mp3",
        "audio/ogg": ".ogg",
        "audio/L16": ".pcm",
        "audio/pcm": ".pcm",
      };
      const ext = extMap[mimeType] ?? ".wav";

      // If Gemini returns raw PCM (audio/L16), wrap in WAV header
      const audioBuffer = Buffer.from(audioPart.inlineData.data, "base64");
      let finalBuffer = audioBuffer;
      const actualPath = outputPath.replace(/\.wav$/, ext === ".pcm" ? ".wav" : ext);

      if (mimeType.includes("L16") || mimeType.includes("pcm")) {
        // Raw PCM: wrap in WAV container (24kHz, 16-bit, mono — Gemini default)
        const sampleRate = 24000;
        const bitsPerSample = 16;
        const channels = 1;
        const byteRate = sampleRate * channels * (bitsPerSample / 8);
        const blockAlign = channels * (bitsPerSample / 8);
        const dataSize = audioBuffer.length;
        const header = Buffer.alloc(44);
        header.write("RIFF", 0);
        header.writeUInt32LE(36 + dataSize, 4);
        header.write("WAVE", 8);
        header.write("fmt ", 12);
        header.writeUInt32LE(16, 16); // subchunk1 size
        header.writeUInt16LE(1, 20); // PCM format
        header.writeUInt16LE(channels, 22);
        header.writeUInt32LE(sampleRate, 24);
        header.writeUInt32LE(byteRate, 28);
        header.writeUInt16LE(blockAlign, 32);
        header.writeUInt16LE(bitsPerSample, 34);
        header.write("data", 36);
        header.writeUInt32LE(dataSize, 40);
        finalBuffer = Buffer.concat([header, audioBuffer]);
        writeFileSync(outputPath, finalBuffer); // keep .wav extension
      } else {
        writeFileSync(actualPath, audioBuffer);
      }

      console.log(
        `  [ok]   ${segment.id} — ${(finalBuffer.length / 1024).toFixed(0)} KB (${mimeType})`,
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
