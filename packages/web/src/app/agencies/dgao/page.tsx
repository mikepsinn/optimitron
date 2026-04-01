import {
  PRIZE_POOL_HORIZON_MULTIPLE,
  fmtParam,
} from "@optimitron/data/parameters";
import { GameCTA } from "@/components/ui/game-cta";
import hypercertData from "@/data/alignment-hypercerts.json";
import snapshotData from "@/data/wishocracy-snapshot.json";
import { transparencyLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";

export const metadata = getRouteMetadata(transparencyLink);

const pipelineSteps = [
  {
    number: 1,
    label: "Citizen Preferences",
    description:
      "Citizens pick between two things. Then two more. Do this enough times and the maths tells you what everyone actually wants. Your current method is to let 535 people guess.",
    tech: "Storacha (IPFS)",
    techDetail: "Aggregated preference snapshots are content-addressed on IPFS — every version is immutable and linked to its predecessor.",
    color: "bg-brutal-pink",
    borderColor: "border-primary",
    textColor: "text-brutal-pink-foreground",
    subTextColor: "text-background",
  },
  {
    number: 2,
    label: "Alignment Scoring",
    description:
      "We compare what your politicians actually voted for against what you actually wanted. The gap between those two numbers is called a 'Citizen Alignment Score.' It is usually depressing.",
    tech: "Hypercerts (AT Protocol)",
    techDetail: "Each alignment score is published as a Hypercert — an Activity claim with Measurements, Evaluations, and Attachments.",
    color: "bg-brutal-yellow",
    borderColor: "border-primary",
    textColor: "text-brutal-yellow-foreground",
    subTextColor: "text-brutal-yellow-foreground",
  },
  {
    number: 3,
    label: "Verifiable Storage",
    description:
      "Everything is stored where nobody can quietly delete it. Your governments love deleting things. This one can't.",
    tech: "Storacha Gateway",
    techDetail: "Every CID resolves to its exact data at {cid}.ipfs.storacha.link — no server can alter it after the fact.",
    color: "bg-brutal-cyan",
    borderColor: "border-primary",
    textColor: "text-brutal-cyan-foreground",
    subTextColor: "text-brutal-cyan-foreground",
  },
  {
    number: 4,
    label: "Incentive Alignment Bonds",
    description:
      "Smart contracts read the scores and distribute money to politicians based on how much they actually did what voters wanted. Not how much they promised. Not how good their hair is. What they did.",
    tech: "$WISH ERC-20",
    techDetail: "A 0.5% transaction tax funds UBI distribution. Politicians earn $WISH by aligning with citizens, not donors.",
    color: "bg-brutal-cyan",
    borderColor: "border-primary",
    textColor: "text-brutal-cyan-foreground",
    subTextColor: "text-brutal-cyan-foreground",
  },
  {
    number: 5,
    label: "Universal Basic Income",
    description:
      "The 0.5% tax accumulates. Then it goes to everyone. Equally. Your current welfare system has 80+ programmes, costs $1.1 trillion to administer, and still loses people in the cracks. This one has a for-loop.",
    tech: "World ID + Smart Contracts",
    techDetail: "No welfare bureaucracy. No IRS. Automated redistribution funded by economic activity, not income tax.",
    color: "bg-brutal-pink",
    borderColor: "border-primary",
    textColor: "text-brutal-pink-foreground",
    subTextColor: "text-background",
  },
];

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
            Transparency
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            The Full Pipeline
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            On my planet, governance infrastructure is auditable by default.
            Here, I had to build the audit trail from scratch. Every preference
            snapshot, every alignment score, every fund distribution — verifiable
            by anyone, alterable by no one.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            Storacha makes governance data immutable. Hypercerts make it
            auditable. Smart contracts make it enforceable. Your species has had
            these tools for years. You just keep not using them.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase text-foreground mb-8">
          From Voice to Policy
        </h2>
        <div className="space-y-0">
          {pipelineSteps.map((step, index) => (
            <div key={step.label} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 border-4 border-primary ${step.color} flex items-center justify-center font-black text-lg`}>
                  {step.number}
                </div>
                {index < pipelineSteps.length - 1 && (
                  <div className="w-1 flex-1 bg-foreground" />
                )}
              </div>
              <div className={`flex-1 border-4 border-primary ${step.color} p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                <h3 className={`text-xl font-black uppercase ${step.textColor}`}>
                  {step.label}
                </h3>
                <p className={`mt-2 text-sm font-bold ${step.subTextColor}`}>
                  {step.description}
                </p>
                <div className={`mt-4 border-2 ${step.borderColor} bg-background p-3`}>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {step.tech}
                  </div>
                  <p className="mt-1 text-xs font-bold text-muted-foreground">
                    {step.techDetail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase text-foreground mb-6">
          Live Attestation Records
        </h2>
        <p className="text-sm font-bold text-foreground mb-6 max-w-3xl">
          These are real Hypercert records published to the AT Protocol and
          stored on Storacha. Click any CID to verify the content-addressed
          data on IPFS.
        </p>

        <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
          <h3 className="text-lg font-black uppercase text-foreground mb-4">
            Alignment Hypercerts ({hypercertData.politicians.length} Politicians)
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {hypercertData.politicians.map((pol) => (
              <div
                key={pol.politicianId}
                className="border-4 border-primary bg-muted p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-black uppercase text-foreground">
                      {pol.name}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground">
                      {pol.party} · {pol.chamber}
                    </div>
                  </div>
                  <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground px-2 py-1 text-center">
                    <div className="text-lg font-black">{pol.alignmentScore}%</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <a
                    href={`https://${pol.storageCid}.ipfs.storacha.link/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-primary bg-brutal-cyan text-brutal-cyan-foreground px-2 py-1 text-[10px] font-black uppercase hover:bg-brutal-cyan transition-colors truncate"
                  >
                    IPFS: {pol.storageCid.slice(0, 20)}...
                  </a>
                  <div
                    className="border border-primary bg-brutal-cyan text-brutal-cyan-foreground px-2 py-1 text-[10px] font-black uppercase truncate"
                    title={pol.activityUri}
                  >
                    Activity: {pol.activityUri.split("/").pop()}
                  </div>
                  <div
                    className="border border-primary bg-brutal-pink px-2 py-1 text-[10px] font-black uppercase text-brutal-pink-foreground truncate"
                    title={pol.evaluationUri}
                  >
                    Evaluation: {pol.evaluationUri.split("/").pop()}
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground">
                  {pol.votesCompared} votes compared · {Object.keys(pol.itemScores).length} categories
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-lg font-black uppercase text-foreground mb-4">
            Preference Aggregation Snapshot
          </h3>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-3">
              <div className="text-xs font-black uppercase">Participants</div>
              <div className="text-2xl font-black">{snapshotData.participantCount}</div>
            </div>
            <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-3">
              <div className="text-xs font-black uppercase">Consistency Ratio</div>
              <div className="text-2xl font-black">{(snapshotData.consistencyRatio * 100).toFixed(0)}%</div>
            </div>
            <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-3">
              <div className="text-xs font-black uppercase">Categories</div>
              <div className="text-2xl font-black">{snapshotData.preferenceWeights.length}</div>
            </div>
          </div>
          <a
            href={`https://${snapshotData.storageCid}.ipfs.storacha.link/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground px-3 py-2 text-xs font-black uppercase hover:bg-brutal-cyan transition-colors"
          >
            View on IPFS: {snapshotData.storageCid.slice(0, 24)}...
          </a>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase text-foreground mb-6">
          $WISH Token & UBI
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black uppercase mb-3">
              Transaction Tax Replaces the IRS
            </h3>
            <p className="text-sm font-bold leading-relaxed">
              A 0.5% tax on every $WISH transfer automatically funds the
              treasury. No filing. No audits. No 74,000-page tax code. Revenue
              collection as a protocol feature, not a bureaucratic apparatus
              employing 83,000 people to process forms.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-pink text-brutal-pink-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black uppercase mb-3">
              UBI Replaces Welfare Bureaucracy
            </h3>
            <p className="text-sm font-bold leading-relaxed">
              Treasury distributes to verified citizens automatically. World ID
              prevents sybil attacks. No means testing. No case workers. No
              applications. Just money going to people who need it, without
              spending half of it on the process of giving it to them.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black uppercase mb-3">
              Alignment-Based Campaign Finance
            </h3>
            <p className="text-sm font-bold leading-relaxed">
              Politicians earn $WISH proportional to their Citizen Alignment
              Score. Higher alignment = more funding. No donors. No PACs. No
              lobbyists. Smart contracts read Hypercert attestations and
              distribute automatically.
            </p>
          </div>
          <div className="border-4 border-primary bg-brutal-cyan text-brutal-cyan-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black uppercase mb-3">
              The Full Loop
            </h3>
            <p className="text-sm font-bold leading-relaxed">
              Citizens express preferences. System scores politicians.
              Hypercerts make scores verifiable. Smart contracts fund aligned
              politicians. $WISH circulates. Transaction tax funds UBI. No
              middleman at any step. On my planet this is called &ldquo;obvious
              engineering.&rdquo; Here it seems to be called
              &ldquo;utopian.&rdquo;
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase text-foreground mb-6">
          Earth Optimization Prize
        </h2>
        <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-bold leading-relaxed mb-4">
            The Prize is a dominant assurance contract (VoterPrizeTreasury).
            Depositors fund the pool with USDC, which earns Prize fund yield.
            Recruiters share referral links — each verified voter (World ID)
            earns the recruiter 1 VOTE point. When health and income metrics
            cross thresholds, VOTE holders claim proportional prize share.
            If thresholds aren&apos;t met after 15 years, depositors reclaim
            principal + ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} yield. All on-chain. No committee.
          </p>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="border-4 border-primary bg-background p-3">
              <div className="text-xs font-black uppercase text-muted-foreground">Depositors</div>
              <div className="text-sm font-black mt-1">PRIZE Shares</div>
              <div className="text-xs text-muted-foreground mt-1">USDC → Prize fund yield. ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} floor if plan fails. Sybil-resistant via capital commitment.</div>
            </div>
            <div className="border-4 border-primary bg-background p-3">
              <div className="text-xs font-black uppercase text-muted-foreground">Recruiters</div>
              <div className="text-sm font-black mt-1">VOTE Points</div>
              <div className="text-xs text-muted-foreground mt-1">1 VOTE per verified voter recruited via referral link. World ID prevents duplicates.</div>
            </div>
            <div className="border-4 border-primary bg-background p-3">
              <div className="text-xs font-black uppercase text-muted-foreground">Outcomes</div>
              <div className="text-sm font-black mt-1">Two Metrics</div>
              <div className="text-xs text-muted-foreground mt-1">Median healthy life years (1% threshold) + median real income (0.5% threshold).</div>
            </div>
          </div>
          <GameCTA href="/prize" variant="secondary">Play the Game</GameCTA>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-black uppercase text-foreground mb-6">
          Technology Stack
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl mb-2">💾</div>
            <h3 className="font-black text-foreground uppercase mb-2">Storacha</h3>
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              Content-addressed storage on IPFS. Every preference snapshot and
              alignment score gets a CID that resolves to its exact, unalterable
              data. Linked chains of snapshots provide full history.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl mb-2">📜</div>
            <h3 className="font-black text-foreground uppercase mb-2">Hypercerts</h3>
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              Verifiable impact attestations on the AT Protocol. Each alignment
              score becomes an Activity with Measurements, Evaluations, and
              Attachments — a full auditable record of the assessment.
            </p>
          </div>
          <div className="border-4 border-primary bg-background p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-2xl mb-2">🔗</div>
            <h3 className="font-black text-foreground uppercase mb-2">$WISH Token</h3>
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              ERC-20 with built-in transaction tax. WishocraticTreasury splits
              tax revenue across citizen-voted budget categories. UBIDistributor
              handles equal per-citizen payouts for the UBI category.
            </p>
          </div>
        </div>
      </section>

      <section className="card bg-brutal-cyan text-brutal-cyan-foreground border-primary text-center">
        <h2 className="text-2xl font-black mb-3 uppercase">
          Audit Everything
        </h2>
        <p className="mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          The code is public. The data is content-addressed. The attestations
          are on a public protocol. The contracts will be on a public chain.
          If you can&apos;t verify it, it isn&apos;t governance — it&apos;s
          theatre.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href="https://github.com/mikepsinn/optimitron" variant="secondary" external>View Source</GameCTA>
          <GameCTA href="https://iab.warondisease.org" variant="outline" external>Incentive Alignment Bonds Paper</GameCTA>
          <GameCTA href="https://wishocracy.warondisease.org" variant="outline" external>Wishocracy Paper</GameCTA>
        </div>
      </section>
    </div>
  );
}
