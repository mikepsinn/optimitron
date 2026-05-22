import { headers } from "next/headers";
import { Container } from "@/components/ui/container";
import { getSiteMetadata } from "@/lib/metadata";
import { privacyLink, ROUTES } from "@/lib/routes";
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
      title: `${privacyLink.label} - ${site.name}`,
      description: privacyLink.description,
    },
    privacyLink.href,
  );
}

export default async function PrivacyPage() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const legalEntityName = site.legalEntityName;
  const contactEmail = site.publicContactEmail;
  const websiteLabel = new URL(site.canonicalOrigin).hostname;

  return (
    <main className="min-h-screen bg-background py-12 text-foreground sm:py-16">
      <Container size="md">
        <h1 className="mb-8 text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
          Privacy Policy
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-center text-lg font-bold">
          Last updated {UPDATED_AT}
        </p>

        <article className="border border-foreground bg-background p-5 sm:p-8">
          <div className="space-y-8 text-foreground">
            <section>
              <h2 className={SECTION_HEADING_CLASS}>1. Who We Are</h2>
              <p className="font-bold leading-relaxed">
                {site.name} is operated by {legalEntityName}. This policy
                explains what we collect when you use {websiteLabel}, why we
                collect it, when it may be public, and how to contact us.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                2. Information We Collect
              </h2>
              <p className="mb-4 font-bold leading-relaxed">
                We collect information you give us directly, information created
                by your use of the site, and limited technical data needed to
                keep the site working.
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Account and contact details, such as your name, email address,
                  display name, organization, profile URL, and sign-in provider.
                </li>
                <li>
                  Campaign activity, such as votes, signatures, endorsements,
                  referral links, invitations, dashboard actions, task activity,
                  and survey or form responses.
                </li>
                <li>
                  Public profile details you choose to publish, such as your
                  name, organization, social links, biography, and endorsement
                  text.
                </li>
                <li>
                  Earth Optimization Mission details, such as your mission
                  profile, photos, city, answers, matches, messages, proposed
                  meeting plans, blocks, safety acknowledgments, and safety
                  reports.
                </li>
                <li>
                  Plaintiff, represented-person, and memorial details you
                  submit, such as names, photos, relationships, life or death
                  status, health condition or cause of death, comments, memorial
                  details, evidence files, and claims about responsible parties.
                </li>
                <li>
                  Donation records if you donate. Payment processors handle card
                  details; we receive transaction status, amount, and related
                  contact details.
                </li>
                <li>
                  Technical data, such as IP address, browser, device, pages
                  viewed, referrer, timestamps, cookies, session data, logs, and
                  analytics events.
                </li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>3. How We Use It</h2>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Operate accounts, dashboards, voting, referrals, and forms.
                </li>
                <li>
                  Count support, prevent duplicate or fraudulent activity, and
                  detect abuse.
                </li>
                <li>
                  Show public signatures, endorsements, profiles, counts, and
                  referral impact where the site asks for public display.
                </li>
                <li>
                  Send authentication emails, receipts, invitations, updates,
                  and replies to support requests.
                </li>
                <li>Process donations and maintain transaction records.</li>
                <li>
                  Improve performance, security, reliability, and user
                  experience.
                </li>
                <li>Comply with legal obligations and enforce site rules.</li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>4. What May Be Public</h2>
              <p className="font-bold leading-relaxed">
                Some parts of this site are built for public persuasion and
                public records. If you sign, vote, endorse, publish a profile,
                submit an organization, add a plaintiff or memorial, upload
                public evidence, or share a public referral link, the site may
                display the details you submitted, related public counts, and
                referral impact. Public plaintiff and memorial pages may show
                the person's name, photo, relationship, life or death status,
                public comments, memorial details, evidence, and
                responsible-party claims. They may also show a condition or
                cause when the form asks for public display and you confirm it.
                For living people or people whose status is unknown, we publish
                a health condition only when you confirm you have consent or
                legal authority to disclose it. We do not intentionally publish
                your private email address unless you put it into a public
                field.
              </p>
              <p className="mt-4 font-bold leading-relaxed">
                Earth Optimization Mission profiles are meant for opted-in
                adults. Mission profile details, photos, answers, matches,
                messages, and meeting plans may be visible to the users involved
                and to people helping us review safety reports or abuse. Do not
                put anything in a mission profile or message that you would not
                want handled by an early web application and safety reviewers.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>5. When We Share It</h2>
              <p className="mb-4 font-bold leading-relaxed">
                We do not sell personal information. We share information only
                when it is needed to run the site, show public campaign records,
                or meet legal and security obligations.
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 font-bold">
                <li>
                  Service providers that help with hosting, databases,
                  authentication, email, analytics, security, payments, and
                  support.
                </li>
                <li>
                  Public visitors, when you choose a public action or submit
                  information through a public flow.
                </li>
                <li>
                  Authorities, courts, or other parties when required by law or
                  needed to protect the site, users, or the public.
                </li>
                <li>
                  A successor organization if the project is reorganized,
                  merged, or transferred.
                </li>
              </ul>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                6. Cookies and Analytics
              </h2>
              <p className="font-bold leading-relaxed">
                We use cookies and similar technologies for sign-in sessions,
                preferences, abuse prevention, analytics, and basic site
                operation. Blocking cookies may break account, vote, dashboard,
                or referral features.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>7. Retention</h2>
              <p className="font-bold leading-relaxed">
                We keep information for as long as needed to operate the site,
                maintain campaign records, prevent fraud, resolve disputes,
                comply with law, and keep security logs. Public campaign records
                and plaintiff or memorial records may stay visible after an
                account is closed unless we agree or are required to remove
                them.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>8. Your Choices</h2>
              <p className="mb-4 font-bold leading-relaxed">
                Depending on where you live, you may be able to request access,
                correction, deletion, portability, or limits on certain uses of
                your personal information. You can also unsubscribe from
                non-essential email.
              </p>
              <p className="font-bold leading-relaxed">
                Send requests to{" "}
                <a className="underline" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
                . We may need to verify your identity before changing account or
                campaign records.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>9. Security</h2>
              <p className="font-bold leading-relaxed">
                We use technical and organizational safeguards designed to
                protect personal information. No internet service is perfectly
                secure, so do not send information you would not want handled by
                a web application.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>10. Children</h2>
              <p className="font-bold leading-relaxed">
                The site is not directed to children under 13. If you believe a
                child under 13 provided personal information, contact us and we
                will review it. Earth Optimization Missions and other user-meeting
                features are only for adults 18 or older.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>
                11. International Visitors
              </h2>
              <p className="font-bold leading-relaxed">
                We operate from the United States and may process information in
                the United States and other countries where our providers work.
                Those countries may have different privacy rules than yours.
              </p>
            </section>

            <section>
              <h2 className={SECTION_HEADING_CLASS}>12. Changes and Contact</h2>
              <p className="mb-4 font-bold leading-relaxed">
                We may update this policy by posting a new version here. The
                date above shows when it was last changed.
              </p>
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
          <a className="underline" href={ROUTES.terms}>
            Terms of Service
          </a>
        </p>
      </Container>
    </main>
  );
}
