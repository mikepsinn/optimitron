import { headers } from "next/headers";
import { BrutalCard } from "@/components/ui/brutal-card";
import { Container } from "@/components/ui/container";
import { SectionContainer } from "@/components/ui/section-container";
import { getSiteMetadata } from "@/lib/metadata";
import { ROUTES, termsLink } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

const UPDATED_AT = "May 2, 2026";
const SECTION_HEADING_CLASS =
  "mb-4 text-2xl font-black uppercase text-brutal-pink";

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
    <SectionContainer
      bgColor="background"
      borderPosition="none"
      padding="lg"
      className="min-h-screen"
    >
      <Container size="md">
        <h1 className="mb-8 text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
          Terms of Service
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-center text-lg font-bold">
          Last updated {UPDATED_AT}
        </p>

        <BrutalCard padding="lg">
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
              <h2 className={SECTION_HEADING_CLASS}>3. Accounts and Identity</h2>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Use accurate information when you create an account or sign in.
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
                4. Votes, Signatures, Referrals, and Endorsements
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
              <h2 className={SECTION_HEADING_CLASS}>5. Your Submissions</h2>
              <p className="font-bold leading-relaxed">
                You are responsible for what you submit. If you submit a public
                signature, vote, endorsement, organization profile, task update,
                or similar material, you allow us to host, display, reproduce,
                and share it in connection with the site and the campaign. Do
                not submit material you do not have the right to share.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>6. Site Materials</h2>
              <p className="font-bold leading-relaxed">
                You may link to and share public campaign materials as long as
                you do not mislead people, remove attribution, or imply that we
                endorse your edited version. Software and other materials may
                have separate license terms where posted.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>7. Donations and Payments</h2>
              <p className="font-bold leading-relaxed">
                Donations and payments are voluntary. They may be nonrefundable
                unless required by law or the applicable payment processor. We
                do not provide tax, financial, investment, medical, or legal
                advice.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>8. Do Not Break the Site</h2>
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
              <h2 className={SECTION_HEADING_CLASS}>9. Moderation</h2>
              <p className="font-bold leading-relaxed">
                We may remove content, block activity, suspend accounts, or
                refuse service when we believe activity is fraudulent, abusive,
                unlawful, misleading, harmful, or inconsistent with these terms.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>10. No Professional Advice</h2>
              <p className="font-bold leading-relaxed">
                The site contains campaign, policy, medical, legal, financial,
                and technical information. It is general information, not
                personal medical advice, legal advice, financial advice, tax
                advice, or investment advice.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                11. Availability and Disclaimers
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
              <h2 className={SECTION_HEADING_CLASS}>12. Other Legal Terms</h2>
              <p className="font-bold leading-relaxed">
                These terms do not limit rights that cannot be waived under
                applicable law. If part of these terms is unenforceable, the
                rest remains in effect. We may update these terms by posting a
                new version here. Continued use of the site means you accept the
                updated terms.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>13. Contact</h2>
              <div className="mt-4 border-4 border-primary bg-brutal-yellow p-4 text-brutal-yellow-foreground">
                <p className="font-black">{legalEntityName}</p>
                <p className="font-bold">Email: {contactEmail}</p>
                <p className="font-bold">Website: {websiteLabel}</p>
              </div>
            </section>
          </div>
        </BrutalCard>

        <p className="mt-8 text-center text-sm font-bold text-muted-foreground">
          See also:{" "}
          <a className="underline" href={ROUTES.privacy}>
            Privacy Policy
          </a>
        </p>
      </Container>
    </SectionContainer>
  );
}
