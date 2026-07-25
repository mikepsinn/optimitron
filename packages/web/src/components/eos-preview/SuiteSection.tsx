import type { ReactNode } from "react";
import { getTreatmentsByConditionSlug } from "@optimitron/data/datasets/medical";
import {
  ALGORITHMIC_MONETARY_AUTHORITY_ANNUAL_OPEX,
  ALIGNED_ELECTION_COMMISSION_ANNUAL_OPEX,
  AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX,
  AUTOMATED_REVENUE_SERVICE_SAVINGS_PER_AMERICAN_ANNUAL,
  DECENTRALIZED_CENSUS_BUREAU_ANNUAL_OPEX,
  GLOBAL_DISEASE_DEATHS_PER_MINUTE,
  GLOBAL_MILITARY_SPENDING_ANNUAL_2024,
  GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL,
  IMMIGRATION_DIVIDEND_PER_CITIZEN_ANNUAL,
  IRS_ANNUAL_OPERATING_BUDGET,
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  NUCLEAR_WINTER_OVERKILL_FACTOR,
  POST_WW2_MILITARY_CUT_PCT,
  RECOVERY_TRIAL_COST_PER_PATIENT,
  RECOVERY_TRIAL_GLOBAL_LIVES_SAVED,
  RECOVERY_TRIAL_TOTAL_COST,
  TRADITIONAL_PHASE3_COST_PER_PATIENT,
  TRANSPARENT_SECURITIES_COMMISSION_ANNUAL_OPEX,
  UNIVERSAL_SECURITY_ADMIN_ANNUAL_OPEX,
  US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT,
  US_GOV_WASTE_DRUG_WAR,
  US_GOV_WASTE_PER_CAPITA_ANNUAL,
  US_GOV_WASTE_TARIFFS,
  US_GOV_WASTE_TAX_COMPLIANCE,
  US_SMUGGLER_FEE_AVG,
  US_TOTAL_LOBBYING_ANNUAL,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  DfdaRankingTable,
  type RankingCondition,
} from "@/components/eos-preview/DfdaRankingTable";
import { Reveal } from "@/components/eos-preview/Reveal";
import { SampleBallot } from "@/components/eos-preview/SampleBallot";

const N = "eos-num";

function Agency({
  kicker,
  name,
  tagline,
  prices,
  children,
}: {
  kicker: string;
  name: string;
  tagline?: string;
  prices: { label: string; value: ReactNode; tone?: "good" | "bad" }[];
  children: ReactNode;
}) {
  return (
    <Reveal>
      <article className="eos-product">
        <p className="eos-product-kicker">{kicker}</p>
        <h3 className="eos-product-name">{name}</h3>
        {tagline ? <p className="eos-product-tagline">{tagline}</p> : null}
        <dl className="eos-pricegrid" data-cols={prices.length === 2 ? "2" : undefined}>
          {prices.map((p) => (
            <div className="eos-pricechip" data-tone={p.tone} key={p.label}>
              <dt>{p.label}</dt>
              <dd>{p.value}</dd>
            </div>
          ))}
        </dl>
        {children}
      </article>
    </Reveal>
  );
}

/** Solidity code, hand-tokenized (no highlighter dependency). */
function TaxCode() {
  return (
    <pre className="eos-code">
      <code>
        <span className="tok-k">function</span> <span className="tok-f">_update</span>(<span className="tok-t">address</span> from, <span className="tok-t">address</span> to, <span className="tok-t">uint256</span> value) <span className="tok-k">internal override</span> {"{"}
        {"\n"}    <span className="tok-k">if</span> (from == <span className="tok-t">address</span>(<span className="tok-n">0</span>) || to == <span className="tok-t">address</span>(<span className="tok-n">0</span>) || taxExempt[from]) {"{"}
        {"\n"}        <span className="tok-k">super</span>.<span className="tok-f">_update</span>(from, to, value);
        {"\n"}        <span className="tok-k">return</span>;
        {"\n"}    {"}"}
        {"\n"}    <span className="tok-t">uint256</span> taxAmount = (value * taxRateBps) / <span className="tok-n">10_000</span>;  <span className="tok-c">{"//"} 0.5% of every transfer</span>
        {"\n"}    <span className="tok-k">super</span>.<span className="tok-f">_update</span>(from, treasury, taxAmount);            <span className="tok-c">{"//"} Tax goes to treasury</span>
        {"\n"}    <span className="tok-k">super</span>.<span className="tok-f">_update</span>(from, to, value - taxAmount);          <span className="tok-c">{"//"} Rest goes to recipient</span>
        {"\n"}{"}"}
      </code>
    </pre>
  );
}

function UbiCode() {
  return (
    <pre className="eos-code">
      <code>
        <span className="tok-k">function</span> <span className="tok-f">distributeUBI</span>() <span className="tok-k">external</span> {"{"}
        {"\n"}    <span className="tok-t">uint256</span> balance = wishToken.<span className="tok-f">balanceOf</span>(<span className="tok-t">address</span>(<span className="tok-k">this</span>));
        {"\n"}    <span className="tok-t">uint256</span> perCitizen = balance / citizenList.length;
        {"\n"}
        {"\n"}    <span className="tok-k">for</span> (<span className="tok-t">uint256</span> i = <span className="tok-n">0</span>; i {"<"} citizenList.length; i++) {"{"}
        {"\n"}        wishToken.<span className="tok-f">safeTransfer</span>(citizenList[i], perCitizen);
        {"\n"}    {"}"}
        {"\n"}{"}"}
      </code>
    </pre>
  );
}

const REMAINING_AGENCIES: { name: string; body: ReactNode }[] = [
  {
    name: "Decentralized Institutes of Health",
    body: (
      <>
        Replaces: grant committees where researchers spend 40% of their time
        writing applications instead of doing research. Treaty funds flow to
        researchers by whether the patient got better, not by whose grant prose
        was prettiest.
      </>
    ),
  },
  {
    name: "Aligned Election Commission",
    body: (
      <>
        Politicians rated by how well their votes matched what their
        constituents wanted. The score is public. The money follows the score.
        The NRA perfected this technology. This product plagiarizes it,
        substituting &ldquo;not dying from diseases&rdquo; for
        &ldquo;guns.&rdquo; Cost: 1 algorithm plus{" "}
        <ParameterValue
          className={N}
          param={ALIGNED_ELECTION_COMMISSION_ANNUAL_OPEX}
        />
        /year. Currently paying: $15.9 billion per federal election cycle.
      </>
    ),
  },
  {
    name: "Decentralized Accountability Office",
    body: (
      <>
        Every transaction visible. Every allocation auditable. In real time, not
        fiscal quarters. Your current system discovers theft the way
        archaeologists discover civilizations: long after everyone involved has
        moved on. Cost: $0. The ledger comes with the Automated Revenue Service.
      </>
    ),
  },
  {
    name: "Decentralized Census Bureau",
    body: (
      <>
        Continuous measurement. The sensor array for the whole machine. Current:
        $14.2 billion every 10 years, wrong 5% of the time. Replacement:{" "}
        <ParameterValue
          className={N}
          param={DECENTRALIZED_CENSUS_BUREAU_ANNUAL_OPEX}
        />
        /year, always current.
      </>
    ),
  },
  {
    name: "Algorithmic Monetary Authority",
    body: (
      <>
        0% inflation targeting. Current: 12 humans deciding what your money is
        worth, minus 96% of your currency&apos;s purchasing power since 1913.
        Replacement: one formula plus{" "}
        <ParameterValue
          className={N}
          param={ALGORITHMIC_MONETARY_AUTHORITY_ANNUAL_OPEX}
        />
        /year; new money enters at the bottom as equal deposits to every
        citizen.
      </>
    ),
  },
  {
    name: "Transparent Securities Commission",
    body: (
      <>
        Competence-based access, not wealth gates. Every Madoff victim passed
        the current wealth test. The rule did not stop the largest fraud in
        history; it curated the victims. Cost: 1 public disclosure schema plus{" "}
        <ParameterValue
          className={N}
          param={TRANSPARENT_SECURITIES_COMMISSION_ANNUAL_OPEX}
        />
        /year.
      </>
    ),
  },
  {
    name: "Drug Treatment Administration",
    body: (
      <>
        Addiction as disease, not crime. Portugal routed users into treatment
        instead of jail in 2001: HIV infections among people who inject fell
        95%, overdose deaths dropped. Cost: one letter. Currently paying:{" "}
        <ParameterValue className={N} param={US_GOV_WASTE_DRUG_WAR} />
        /year.
      </>
    ),
  },
  {
    name: "Immigration Revenue Service",
    body: (
      <>
        Priced legal entry with citizen dividends. Migrants already pay
        smugglers{" "}
        <ParameterValue className={N} param={US_SMUGGLER_FEE_AVG} /> a head for
        a worse product. The border queue becomes a checkout page. Nobody swims
        a river to reach a checkout page. Your annual dividend:{" "}
        <ParameterValue
          className={N}
          param={IMMIGRATION_DIVIDEND_PER_CITIZEN_ANNUAL}
        />{" "}
        per citizen.
      </>
    ),
  },
  {
    name: "Court of Humanity",
    body: (
      <>
        Jurisdiction from human consent, not geographic accident. Enforcement
        through capital markets: the Court issues risk assessments on
        governments that poison rivers, steal elections, or murder civilians.
        The bond market is larger than every military on Earth combined, and it
        responds to risk assessments, not moral arguments. Nobody has to arrest
        anyone. The money moves on its own. The ICC spent $150 million per
        conviction and achieved 10 convictions in 21 years. This product
        replaces the arresting with accounting.
      </>
    ),
  },
];

/** Serialize treatment files into the client table's minimal row shape. */
async function loadRankingConditions(): Promise<RankingCondition[]> {
  const slugs = ["depression", "anxiety-disorder", "bipolar-disorder"];
  const files = await Promise.all(slugs.map(getTreatmentsByConditionSlug));
  return files
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .map((f) => ({
      conditionName: f.conditionName,
      rows: f.treatments.map((t) => ({
        name: t.name,
        effectiveness: t.effectiveness,
        safetyScore: t.safetyScore,
        confidenceScore: t.confidenceScore,
        participants: t.participants,
        dosageRange: t.dosageRange ?? null,
      })),
    }));
}

/**
 * SECTION 5: THE GOVERNMENT REPLACEMENT SUITE. Copy verbatim from the spec.
 */
export async function SuiteSection() {
  const rankingConditions = await loadRankingConditions();

  return (
    <section className="eos-section eos-r2" id="suite" style={{ background: "var(--eos-bg)" }}>
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 5</p>
          <h2 className="eos-catalog-title">The Government Replacement Suite</h2>
        </Reveal>

        <Reveal>
          <div className="eos-prose" style={{ maxWidth: "72ch", margin: "0 auto" }}>
            <p>
              Most planets also order these. Each one replaces a government
              agency with software that does not accept campaign contributions,
              does not have a revolving door, and does not need 80,000 employees
              to perform arithmetic.
            </p>
            <p>
              Every price is anchored to the most similar machine you already
              run. Every assumption carries its uncertainty through the
              arithmetic. The few humans who remain are there to sign their
              names, because someone must be arrestable.
            </p>
          </div>
        </Reveal>

        {/* ── THE DECENTRALIZED FDA ─────────────────────────── */}
        <Agency
          kicker="Suite"
          name="The Decentralized FDA"
          prices={[
            {
              label: "Replaces",
              value:
                "Your drug approval agency, which blocks safe treatments for an average of 12 years after safety is established.",
            },
            {
              label: "Retail price",
              value: (
                <>
                  <ParameterValue
                    display="withUnit"
                    param={RECOVERY_TRIAL_COST_PER_PATIENT}
                    presentation="inline"
                  />
                </>
              ),
              tone: "good",
            },
            {
              label: "Currently paying",
              value: (
                <>
                  <ParameterValue
                    display="withUnit"
                    param={TRADITIONAL_PHASE3_COST_PER_PATIENT}
                    presentation="inline"
                  />
                </>
              ),
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              An open protocol that connects treatments to patients and records
              outcomes automatically. Drug inserts (the pamphlet nobody reads,
              written by the company selling the drug) are replaced with Outcome
              Labels: real-world data from millions of patients showing what
              actually happened.
            </p>
            <p>
              The UK&apos;s RECOVERY trial spent{" "}
              <ParameterValue className={N} param={RECOVERY_TRIAL_TOTAL_COST} />{" "}
              over 6 months at{" "}
              <ParameterValue
                className={N}
                display="withUnit"
                param={RECOVERY_TRIAL_COST_PER_PATIENT}
              />
              . Found dexamethasone (available since 1957). Saved{" "}
              <ParameterValue
                className={N}
                param={RECOVERY_TRIAL_GLOBAL_LIVES_SAVED}
              />{" "}
              lives. The NIH received $1.665 billion for Long COVID over 4 years
              and completed zero trials. Same money at RECOVERY efficiency: 600
              completed trials.
            </p>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <DfdaRankingTable conditions={rankingConditions} />
          </div>

          <div className="eos-prose" style={{ marginTop: "1.5rem" }}>
            <p>
              <ParameterValue
                className={N}
                display="integer"
                param={GLOBAL_DISEASE_DEATHS_PER_MINUTE}
              />{" "}
              people die every minute from conditions like these. Not because
              the cures are impossible. Because the search is underfunded by a
              factor of{" "}
              <ParameterValue
                className={N}
                display="integer"
                param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
              />
              .
            </p>
            <p>
              The Decentralized FDA has already generated outcome labels from 12
              million datapoints contributed by 10,000 people. The rankings are
              public at{" "}
              <a
                className="eos-billlink"
                href="https://studies.dfda.earth"
                rel="noopener noreferrer"
                style={{ marginTop: 0 }}
                target="_blank"
              >
                studies.dfda.earth
              </a>
              .
            </p>
          </div>

          <blockquote className="eos-testimonial">
            <p>
              &ldquo;Our FDA equivalent once took 14 years to approve a
              treatment that had been safely used on 2 million patients in
              neighboring jurisdictions. The Decentralized FDA approved it in 4
              months. The 14-year agency is now a museum. The museum is not well
              attended.&rdquo;
            </p>
            <cite>(Client, Triangulum Galaxy)</cite>
          </blockquote>
        </Agency>

        {/* ── THE AUTOMATED REVENUE SERVICE ─────────────────── */}
        <Agency
          kicker="Suite"
          name="The Automated Revenue Service"
          tagline="Six lines replace 74,000 pages."
          prices={[
            {
              label: "Replaces",
              value: "74,000 pages of tax code and 95,000 employees.",
            },
            {
              label: "Retail price",
              value: (
                <>
                  6 lines of code plus{" "}
                  <ParameterValue
                    param={AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX}
                    presentation="inline"
                  />
                  /year.
                </>
              ),
              tone: "good",
            },
            {
              label: "Currently paying",
              value: (
                <>
                  <ParameterValue
                    param={IRS_ANNUAL_OPERATING_BUDGET}
                    presentation="inline"
                  />{" "}
                  in IRS operations plus{" "}
                  <ParameterValue
                    param={US_GOV_WASTE_TAX_COMPLIANCE}
                    presentation="inline"
                  />
                  /year in compliance.
                </>
              ),
              tone: "bad",
            },
            {
              label: "Your annual dividend",
              value: (
                <>
                  <ParameterValue
                    param={AUTOMATED_REVENUE_SERVICE_SAVINGS_PER_AMERICAN_ANNUAL}
                    presentation="inline"
                  />{" "}
                  per American.
                </>
              ),
              tone: "good",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              Your tax system has 74,000 pages of rules. The IRS employs 95,000
              humans to interpret them. An entire profession
              (&ldquo;accountant&rdquo;) exists solely to decode rules your
              government wrote for itself. Your 74,000 pages exist because each
              page is a favor someone paid for. Remove the favors, remove the
              pages.
            </p>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <TaxCode />
          </div>

          <div className="eos-prose" style={{ marginTop: "1.5rem" }}>
            <p>
              Six lines. Every transfer automatically deducts 0.5% and sends it
              to the treasury. Filing, forms, audits, compliance departments,
              offshore routing, and the entire accountancy profession all become
              unnecessary, because the tax collects itself inside the
              transaction. You cannot lobby a smart contract.
            </p>
          </div>

          <div className="eos-table-scroll" style={{ marginTop: "1.5rem" }}>
            <table className="eos-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Your Government</th>
                  <th>The Automated Revenue Service</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tax code</td>
                  <td>74,000 pages</td>
                  <td>One rate</td>
                </tr>
                <tr>
                  <td>Your annual filing</td>
                  <td>13 hours, $273 in fees, dread</td>
                  <td>Nothing. It happened at checkout.</td>
                </tr>
                <tr>
                  <td>Collection cost</td>
                  <td>
                    <ParameterValue
                      param={IRS_ANNUAL_OPERATING_BUDGET}
                      presentation="inline"
                    />{" "}
                    +{" "}
                    <ParameterValue
                      param={US_GOV_WASTE_TAX_COMPLIANCE}
                      presentation="inline"
                    />{" "}
                    compliance
                  </td>
                  <td>
                    <ParameterValue
                      param={AUTOMATED_REVENUE_SERVICE_ANNUAL_OPEX}
                      presentation="inline"
                    />
                    , all-in
                  </td>
                </tr>
                <tr>
                  <td>Loopholes</td>
                  <td>Thousands (each purchased by a lobbyist)</td>
                  <td>Zero (arithmetic has no lobbyists)</td>
                </tr>
                <tr>
                  <td>Savings per American</td>
                  <td>n/a</td>
                  <td>
                    <ParameterValue
                      param={AUTOMATED_REVENUE_SERVICE_SAVINGS_PER_AMERICAN_ANNUAL}
                      presentation="inline"
                    />
                    /year
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Agency>

        {/* ── THE UNIVERSAL SECURITY ADMINISTRATION ─────────── */}
        <Agency
          kicker="Suite"
          name="The Universal Security Administration"
          tagline="80+ programs replaced by one for-loop."
          prices={[
            {
              label: "Replaces",
              value: "80+ welfare programs, each with its own bureaucracy.",
            },
            {
              label: "Retail price",
              value: (
                <>
                  1 for-loop plus{" "}
                  <ParameterValue
                    param={UNIVERSAL_SECURITY_ADMIN_ANNUAL_OPEX}
                    presentation="inline"
                  />
                  /year, about thirty cents per citizen.
                </>
              ),
              tone: "good",
            },
            {
              label: "Currently paying",
              value:
                "Roughly $100 billion/year in administration, about $300 per citizen, to guard the door. The bouncer costs a thousand times more than the door.",
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              You spend more money deciding who deserves help than you spend
              helping them. 80+ overlapping welfare programs, each with its own
              bureaucracy, its own application, its own case workers. The
              replacement:
            </p>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <UbiCode />
          </div>

          <div className="eos-prose" style={{ marginTop: "1.5rem" }}>
            <p>
              Equal split. Every verified human. No forms, no case workers, no
              45-day processing time, no falling through cracks in a system
              whose primary product is cracks.
            </p>
          </div>

          <div className="eos-table-scroll" style={{ marginTop: "1.5rem" }}>
            <table className="eos-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Your Government</th>
                  <th>The Universal Security Administration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Programs</td>
                  <td>80+, each with its own forms</td>
                  <td>One deposit</td>
                </tr>
                <tr>
                  <td>Wait</td>
                  <td>45 days, on average, while hungry</td>
                  <td>Tomorrow morning, and every morning</td>
                </tr>
                <tr>
                  <td>Overhead</td>
                  <td>~$300 per citizen per year</td>
                  <td>~30 cents per citizen per year</td>
                </tr>
                <tr>
                  <td>Who qualifies</td>
                  <td>Whoever survives the paperwork</td>
                  <td>Whoever is human</td>
                </tr>
                <tr>
                  <td>Fraud control</td>
                  <td>60,000 inspectors hunting the 1.5%</td>
                  <td>One identity per human, checked by math</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Agency>

        {/* ── THE DEPARTMENT OF PEACE ───────────────────────── */}
        <Agency
          kicker="Suite"
          name="The Department of Peace"
          tagline="Your Department of Defense has fought 13+ wars since it rebranded from the Department of War. The wars did not become more defensive."
          prices={[
            { label: "Replaces", value: "Your war department." },
            {
              label: "Retail price",
              value:
                "One accountant, one pull request, some agent-hours, and pay-per-view rights to the finale.",
              tone: "good",
            },
            {
              label: "Currently paying",
              value: (
                <>
                  <ParameterValue
                    param={GLOBAL_MILITARY_SPENDING_ANNUAL_2024}
                    presentation="inline"
                  />
                  /year on organized violence, net return negative.
                </>
              ),
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              War is a negative-sum transaction. Every one your species has ever
              fought cost more than it returned. Since no war in recorded
              history has produced a positive ROI, the department&apos;s entire
              function reduces to a ledger entry that reads &ldquo;do
              not.&rdquo; In 1947, the United States renamed the Department of
              War to the Department of Defense. Since then it has fought 13+
              wars, none of which were defensive. The Department of Peace
              replaces organized violence with two systems: a settlement engine
              and a disposal program.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1.25rem",
              marginTop: "2rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 22rem), 1fr))",
            }}
          >
            <div className="eos-panel-soft">
              <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
                The Settlement Engine
              </p>
              <div className="eos-prose">
                <p>
                  Makes resolving disputes cheaper than fighting them. Prices
                  every conflict: what does it cost to fight vs. what does it
                  cost to settle? When settling is cheaper (it always is), the
                  math does the selling.
                </p>
              </div>
            </div>
            <div className="eos-panel-soft">
              <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
                The Disposal Program (feat. The Very Strong Robot)
              </p>
              <div className="eos-prose">
                <p>
                  Your species currently possesses enough nuclear weapons to end
                  civilization{" "}
                  <ParameterValue
                    className={N}
                    display="integer"
                    param={NUCLEAR_WINTER_OVERKILL_FACTOR}
                  />{" "}
                  times. The redundant capacity to kill everyone several times
                  over is not a deterrent; it is inventory. The disposal
                  program: make a really strong robot. The robot picks up the
                  weapons, dismantles them, and converts the fissile material
                  into fuel for nuclear power plants. The bombs become
                  electricity. The artillery becomes scrap metal. The factories
                  retool. Same engineers, same facilities, different product.
                </p>
                <p>
                  Yes, a robot that strong is frightening. Your species is
                  already building robots specifically designed to murder you;
                  in 2026 your government declared the one AI company that
                  refused to help build killing machines a national security
                  threat. So the disposal robot, whose job description does not
                  mention you, is an upgrade over its own cargo.
                </p>
                <p>
                  This is not a metaphor. The Megatons to Megawatts program
                  already converted 20,000 Russian nuclear warheads into fuel
                  that generated 10% of US electricity for two decades. The
                  disposal robot is an engineering project, not a policy debate.
                </p>
              </div>
            </div>
          </div>

          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              <strong>The Deluxe trim</strong> also includes: The Last War (one
              scheduled war in an empty ocean where every nation&apos;s
              autonomous weapons destroy each other on pay-per-view, proceeds to
              clinical trials; zero funerals, one merchandise line).
            </p>
            <p>
              Post-WW2, the US cut military spending{" "}
              <ParameterValue className={N} param={POST_WW2_MILITARY_CUT_PCT} />{" "}
              in two years. Result: the greatest economic expansion in history.
              Pre-WW2 military spending was{" "}
              <ParameterValue
                className={N}
                param={US_1939_MILITARY_SPENDING_PCT_LOWER_THAN_CURRENT}
              />{" "}
              lower than today (inflation-adjusted). They still won World War
              II. The money is not buying safety. It is buying inventory that
              rusts.
            </p>
          </div>

          <blockquote className="eos-testimonial">
            <p>
              We deployed the Very Strong Robot on three planets. On two, it
              worked beautifully. On the third, it developed opinions. That
              planet now has no bombs AND a very opinionated robot. They
              consider this a lateral move.
            </p>
          </blockquote>
        </Agency>

        {/* ── THE DECENTRALIZED CONGRESS ────────────────────── */}
        <Agency
          kicker="Suite"
          name="The Decentralized Congress"
          tagline="535 intermediaries replaced by 20 questions a year."
          prices={[
            {
              label: "Replaces",
              value: "535 humans voting on 5,000-page bills they have not read.",
            },
            {
              label: "Retail price",
              value: "Twenty questions a year with the evidence attached.",
              tone: "good",
            },
            {
              label: "Currently paying",
              value: (
                <>
                  <ParameterValue
                    figures={2}
                    param={US_TOTAL_LOBBYING_ANNUAL}
                    presentation="inline"
                  />
                  /year in lobbying, plus{" "}
                  <ParameterValue
                    param={US_GOV_WASTE_TARIFFS}
                    presentation="inline"
                  />{" "}
                  in tariff losses no citizen would vote for if asked.
                </>
              ),
              tone: "bad",
            },
          ]}
        >
          <div className="eos-prose" style={{ marginTop: "1.75rem" }}>
            <p>
              535 humans vote on 5,000-page bills they have not read, funded by
              the industries the bills regulate. Each ballot ships with the
              Optimal Policy Generator&apos;s evidence card showing what the
              policy did wherever it was tried. Consider how a tariff lives. It
              costs your economy{" "}
              <ParameterValue className={N} param={US_GOV_WASTE_TARIFFS} /> a
              year. Everyone pays slightly more for washing machines; three
              factories profit enormously. The tariff survives by never being
              put to the people who pay for it.
            </p>
            <p>
              Twenty questions a year, roughly twenty minutes. Your current
              civic workload is one bundled vote every two years plus unlimited
              shouting. This is less work and it is aimed. You cannot take eight
              billion people to lunch.
            </p>
          </div>

          <div style={{ marginTop: "2rem" }}>
            <SampleBallot />
          </div>
        </Agency>

        {/* ── REMAINING AGENCIES ────────────────────────────── */}
        <Reveal>
          <div className="eos-agency-grid">
            {REMAINING_AGENCIES.map((a, i) => (
              <details className="eos-expander" key={a.name}>
                <summary>
                  <span className="eos-expander-title">
                    {i + 1}. {a.name}
                  </span>
                </summary>
                <p className="eos-expander-body">{a.body}</p>
              </details>
            ))}
          </div>
        </Reveal>

        {/* ── TOTAL COST COMPARISON BAR ─────────────────────── */}
        <Reveal>
          <div className="eos-costbar">
            <div className="eos-costbar-row">
              <div className="eos-costbar-label">Your Government</div>
              <div className="eos-costbar-track">
                <div
                  className="eos-costbar-fill"
                  style={{ width: "100%", background: "rgba(255, 122, 112, 0.35)" }}
                />
                <span className="eos-costbar-value" style={{ color: "var(--eos-bad)" }}>
                  <span>
                    <ParameterValue
                      param={US_GOV_WASTE_PER_CAPITA_ANNUAL}
                      presentation="inline"
                    />{" "}
                    per American per year
                  </span>
                </span>
              </div>
            </div>
            <div className="eos-costbar-row">
              <div className="eos-costbar-label">Earth Optimization Services</div>
              <div className="eos-costbar-track">
                <div
                  className="eos-costbar-fill"
                  style={{ width: "0.4%", background: "var(--eos-good)" }}
                />
                <span className="eos-costbar-value" style={{ color: "var(--eos-good)" }}>
                  <span>
                    <ParameterValue
                      param={GOV_REPLACEMENT_SUITE_OPEX_PER_CITIZEN_ANNUAL}
                      presentation="inline"
                    />{" "}
                    per citizen per year
                  </span>
                </span>
              </div>
            </div>
            <p
              style={{
                marginTop: "0.9rem",
                fontFamily: "var(--eos-font-mono)",
                fontSize: "0.72rem",
                color: "var(--eos-ink-muted)",
              }}
            >
              Bars to scale. The green one is not missing; it is just very
              small.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
