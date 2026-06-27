import { headers } from "next/headers";
import { Container } from "@/components/ui/container";
import { getSiteMetadata } from "@/lib/metadata";
import { ROUTES, termsLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

const UPDATED_AT = "May 22, 2026";
const SECTION_HEADING_CLASS =
  "mb-4 text-2xl font-black uppercase text-foreground";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  return getSiteMetadata(
    site,
    {
      title: `${termsLink.label} - ${site.name}`,
      description: termsLink.description,
    },
    termsLink.href,
  );
}

export default async function TermsPage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const legalEntityName = site.legalEntityName;
  const contactEmail = site.publicContactEmail;
  const websiteLabel = new URL(site.canonicalOrigin).hostname;

  return (
    <main className="min-h-screen bg-background py-12 text-foreground sm:py-16">
      <Container size="md">
        <h1 className="mb-8 text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
          Terms of Service
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-center text-lg font-bold">
          Last updated {UPDATED_AT}
        </p>

        <article className="border border-foreground bg-background p-5 sm:p-8">
          <div className="space-y-8 text-foreground">
            <section>
              <h2 className={SECTION_HEADING_CLASS}>1. Agreement</h2>
              <p className="font-bold leading-relaxed">
                These terms govern your use of {site.name}, operated by{" "}
                {legalEntityName}. By using {websiteLabel}, you agree to these
                terms. If you do not agree, do not use the site.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>2. What the Site Does</h2>
              <p className="font-bold leading-relaxed">
                The site supports public campaigns, votes, signatures,
                referrals, endorsements, organization pages, dashboards, tasks,
                donations, and related educational materials. Features may
                change as the project changes.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                3. Earth Optimization Missions
              </h2>
              <p className="mb-4 font-bold leading-relaxed">
                Earth Optimization Missions and similar coordination features
                are for adults using the site to coordinate platonic campaign
                work. We do not screen every user, verify backgrounds,
                supervise sessions, or promise that another person is safe.
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Do not use mission coordination features if you are under 18.
                </li>
                <li>
                  Choose the setting yourself: online, in public, or not at
                  all. Leave whenever you want.
                </li>
                <li>
                  Do not send money, bank details, passwords, identity
                  documents, or emergency favors to another user.
                </li>
                <li>
                  Report unsafe or abusive behavior. Block anyone you do not
                  want to hear from.
                </li>
                <li>
                  If you are in immediate danger, contact local emergency
                  services.
                </li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                4. Accounts and Identity
              </h2>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Use accurate information when you create an account or sign
                  in.
                </li>
                <li>
                  Do not impersonate a person, organization, government, or
                  campaign.
                </li>
                <li>Keep your sign-in method secure.</li>
                <li>
                  Tell us if you believe your account was used without
                  permission.
                </li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                5. Votes, Signatures, Referrals, and Endorsements
              </h2>
              <p className="mb-4 font-bold leading-relaxed">
                Public support tools only work when submissions are honest.
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Do not submit fake, duplicate, automated, or misleading votes
                  or signatures.
                </li>
                <li>
                  Do not misrepresent an endorsement or claim authority you do
                  not have.
                </li>
                <li>
                  Do not manipulate referral tracking, rewards, rankings, or
                  public counts.
                </li>
                <li>Do not spam people or hide what a referral link does.</li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>6. Your Submissions</h2>
              <p className="font-bold leading-relaxed">
                You are responsible for what you submit. If you submit a public
                signature, vote, endorsement, organization profile, task update,
                plaintiff card, memorial, evidence file, comment, or similar
                material, you allow us to host, display, reproduce, and share it
                in connection with the site and the campaign. Do not submit
                material you do not have the right to share.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                7. Plaintiffs, Represented People, and Memorials
              </h2>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Do not add a living person, or a person whose status is
                  unknown, unless you have their permission or legal authority
                  to represent them.
                </li>
                <li>
                  Do not publicly disclose a living or unknown-status person&apos;s
                  health condition unless you have consent or legal authority to
                  make that disclosure.
                </li>
                <li>
                  If you add a deceased person, use a good-faith family,
                  personal-representative, or comparable basis for submitting
                  their memorial.
                </li>
                <li>
                  Only upload public evidence you have the right to share. Do
                  not upload private medical records, confidential files, or
                  anything you know should not be public.
                </li>
                <li>
                  Claims about governments, agencies, organizations, conflicts,
                  causes of death, or responsible parties must be made in good
                  faith. We may remove or limit public display of contested,
                  unsafe, misleading, or unlawful material.
                </li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>8. Site Materials</h2>
              <p className="font-bold leading-relaxed">
                You may link to and share public campaign materials as long as
                you do not mislead people, remove attribution, or imply that we
                endorse your edited version. Software and other materials may
                have separate license terms where posted.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                9. Donations and Payments
              </h2>
              <p className="font-bold leading-relaxed">
                Donations and payments are voluntary. They may be nonrefundable
                unless required by law or the applicable payment processor. We
                do not provide tax, financial, investment, medical, or legal
                advice.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                10. Do Not Break the Site
              </h2>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Do not attack, scrape, overload, reverse engineer, or bypass
                  the site.
                </li>
                <li>
                  Do not upload malware or use the site to harm other systems.
                </li>
                <li>Do not use the site for unlawful activity.</li>
                <li>
                  Do not collect personal information from other users without
                  permission.
                </li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>11. Moderation</h2>
              <p className="font-bold leading-relaxed">
                We may remove content, block activity, suspend accounts, or
                refuse service when we believe activity is fraudulent, abusive,
                unlawful, misleading, harmful, or inconsistent with these terms.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                12. No Professional Advice
              </h2>
              <p className="font-bold leading-relaxed">
                The site contains campaign, policy, medical, legal, financial,
                and technical information. It is general information, not
                personal medical advice, legal advice, financial advice, tax
                advice, or investment advice.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                13. Availability and Disclaimers
              </h2>
              <p className="font-bold leading-relaxed">
                The site is provided as is and as available. It may change,
                break, lose features, or be unavailable. To the maximum extent
                allowed by law, we disclaim warranties and are not liable for
                indirect, incidental, consequential, special, exemplary, or
                punitive damages arising from your use of the site.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>14. Other Legal Terms</h2>
              <p className="font-bold leading-relaxed">
                These terms do not limit rights that cannot be waived under
                applicable law. If part of these terms is unenforceable, the
                rest remains in effect. We may update these terms by posting a
                new version here. Continued use of the site means you accept the
                updated terms.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>15. Contact</h2>
              <div className="mt-4 border border-foreground bg-background p-4 text-foreground">
                <p className="font-black">{legalEntityName}</p>
                <p className="font-bold">Email: {contactEmail}</p>
                <p className="font-bold">Website: {websiteLabel}</p>
              </div>
            </section>
          </div>
        </article>

        <p className="mt-8 text-center text-sm font-bold text-muted-foreground">
          See also:{" "}
          <a className="underline" href={ROUTES.privacy}>
            Privacy Policy
          </a>
        </p>
      </Container>
    </main>
  );
}
