import Layout from "@/components/layout"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getContactInfo, getLegalEntityName, getSiteConfig } from "@/lib/site-config"

export default function TermsPage() {
  const config = getSiteConfig()
  const contactInfo = getContactInfo()
  const legalEntityName = getLegalEntityName()
  const legalEntityPossessive = legalEntityName.endsWith('s') ? `${legalEntityName}'` : `${legalEntityName}'s`
  const legalEntityNameUpper = legalEntityName.toUpperCase()
  const showPoliticalContent = config.showPoliticalContent
  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg" className="min-h-screen">
        <Container size="md">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase text-center mb-8">
            TERMS OF SERVICE
          </h1>

          <p className="text-center text-lg mb-12 max-w-2xl mx-auto">Last Updated: January 2025</p>

          <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-8 text-foreground">
              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">1. ACCEPTANCE OF TERMS</h2>
                <p className="leading-relaxed">
                  By accessing and using {contactInfo.websiteLabel} (the "Website"), you accept and agree to be bound by these Terms of
                  Service ("Terms"). If you do not agree to these Terms, please do not use the Website. {legalEntityName} ("we", "us", or "our") reserves the right to modify these Terms at any
                  time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">2. DESCRIPTION OF SERVICE</h2>
                <p className="leading-relaxed">
                  {legalEntityName} is a nonprofit organization dedicated to eradicating disease by {showPoliticalContent ? "advocating for" : "researching public support for"} the 1% Treaty—a
                  global agreement to redirect 1% of military spending to fund pragmatic clinical trials. Our Website
                  provides information about {showPoliticalContent ? "the movement" : "the initiative"}, allows users to answer the 1% Treaty question, track their
                  impact, and connect with allied organizations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">3. USER ACCOUNTS</h2>
                <h3 className="text-xl font-bold mb-2">Account Creation</h3>
                <p className="leading-relaxed mb-4">
                  To access certain features (such as the dashboard), you may need to create an account. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>

                <h3 className="text-xl font-bold mb-2 mt-6">Account Termination</h3>
                <p className="leading-relaxed">
                  We reserve the right to suspend or terminate your account if you violate these Terms or engage in
                  fraudulent, abusive, or illegal activity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">4. USER CONDUCT</h2>
                <p className="leading-relaxed mb-4">You agree NOT to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the Website for any illegal purpose or in violation of any laws</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                  <li>Interfere with or disrupt the Website or servers</li>
                  <li>Attempt to gain unauthorized access to any portion of the Website</li>
                  <li>Upload viruses, malware, or any malicious code</li>
                  <li>Harvest or collect information about other users</li>
                  <li>Use automated systems (bots, scrapers) without permission</li>
                  <li>Engage in any activity that could harm {legalEntityPossessive} reputation</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">5. REFERRAL PROGRAM</h2>
                <p className="leading-relaxed">
                  Our referral tracking system allows you to share your unique referral link and track how many people
                  answer the 1% Treaty question through your link. You agree not to engage in fraudulent referral
                  activities, including but not limited to creating fake accounts, using automated systems, or
                  misleading others about the nature of the referral program.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">6. INTELLECTUAL PROPERTY</h2>
                <h3 className="text-xl font-bold mb-2">Our Content</h3>
                <p className="leading-relaxed mb-4">
                  All content on the Website, including text, graphics, logos, images, and software, is the property of
                  {legalEntityName} or its licensors and is protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-bold mb-2">Your Content</h3>
                <p className="leading-relaxed mb-4">
                  When you submit content to the Website (profile information, organization descriptions, comments), you
                  grant {legalEntityName} a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display that
                  content in connection with operating the Website and promoting the 1% Treaty movement.
                </p>

                <h3 className="text-xl font-bold mb-2">Sharing and Attribution</h3>
                <p className="leading-relaxed">
                  We encourage sharing of our mission and content. You may share, reproduce, and distribute our
                  materials for non-commercial purposes related to promoting the 1% Treaty, provided you attribute {legalEntityName}
                  and do not modify the content in misleading ways.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">7. DONATIONS</h2>
                <p className="leading-relaxed">
                  All donations to {legalEntityName} are voluntary and non-refundable except as required by law. Donations are used to
                  support our mission of eradicating disease through the 1% Treaty. We provide transparency about fund
                  usage on our website. Consult your tax advisor regarding the deductibility of donations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">8. DISCLAIMERS</h2>
                <p className="leading-relaxed mb-4">
                  THE WEBSITE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
                  IMPLIED. WE DO NOT WARRANT THAT:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Website will be uninterrupted, secure, or error-free</li>
                  <li>The information provided is accurate, complete, or current</li>
                  <li>Any defects will be corrected</li>
                  <li>The Website is free of viruses or harmful components</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  The information on this Website is for informational purposes only and does not constitute medical,
                  legal, or financial advice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">9. LIMITATION OF LIABILITY</h2>
                <p className="leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, {legalEntityNameUpper} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
                  INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF
                  THE WEBSITE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">10. INDEMNIFICATION</h2>
                <p className="leading-relaxed">
                  You agree to indemnify, defend, and hold harmless {legalEntityName} and its officers, directors, employees, and
                  agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising out
                  of your use of the Website, violation of these Terms, or violation of any rights of another.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">11. GOVERNING LAW</h2>
                <p className="leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in
                  which {legalEntityName} is registered, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">12. DISPUTE RESOLUTION</h2>
                <p className="leading-relaxed">
                  Any disputes arising from these Terms or your use of the Website shall be resolved through binding
                  arbitration, except that either party may seek injunctive relief in court for intellectual property
                  infringement or violation of confidentiality obligations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">13. SEVERABILITY</h2>
                <p className="leading-relaxed">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
                  limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in
                  full force and effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">14. CONTACT INFORMATION</h2>
                <p className="leading-relaxed">If you have questions about these Terms, please contact us at:</p>
                <div className="mt-4 p-4 bg-brutal-yellow border-4 border-primary">
                  <p className="font-bold">{legalEntityName}</p>
                  <p>Email: {contactInfo.email}</p>
                  <p>Website: {contactInfo.websiteLabel}</p>
                </div>
              </section>
            </div>
          </Card>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
