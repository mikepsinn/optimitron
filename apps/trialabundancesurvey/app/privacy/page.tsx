import Layout from "@/components/layout"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getContactInfo, getLegalEntityName } from "@/lib/site-config"

export default function PrivacyPage() {
  const contactInfo = getContactInfo()
  const legalEntityName = getLegalEntityName()
  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg" className="min-h-screen">
        <Container size="md">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase text-center mb-8">
            PRIVACY POLICY
          </h1>

          <p className="text-center text-lg mb-12 max-w-2xl mx-auto">Last Updated: January 2025</p>

          <Card className="p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-8 text-foreground">
              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">1. INTRODUCTION</h2>
                <p className="leading-relaxed">
                  {legalEntityName} ("we", "us", or "our") is committed to protecting your
                  privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                  when you visit our website {contactInfo.websiteLabel} and use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">2. INFORMATION WE COLLECT</h2>
                <h3 className="text-xl font-bold mb-2">Personal Information</h3>
                <p className="leading-relaxed mb-4">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Answer the 1% Treaty question</li>
                  <li>Register for a dashboard account</li>
                  <li>Submit a contact form</li>
                  <li>Register your organization in our Divisions registry</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Make a donation</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  This information may include: name, email address, organization name, social media handles, profile
                  information, and any other information you choose to provide.
                </p>

                <h3 className="text-xl font-bold mb-2 mt-6">Automatically Collected Information</h3>
                <p className="leading-relaxed">
                  When you visit our website, we automatically collect certain information about your device, including
                  information about your web browser, IP address, time zone, and some of the cookies installed on your
                  device. We also collect information about how you interact with our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">3. HOW WE USE YOUR INFORMATION</h2>
                <p className="leading-relaxed mb-4">We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, operate, and maintain our website and services</li>
                  <li>Track participation in the 1% Treaty movement</li>
                  <li>Process your referrals and track your impact</li>
                  <li>Send you updates about the movement and our progress</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Process donations and maintain donation records</li>
                  <li>Improve and optimize our website and services</li>
                  <li>Prevent fraud and enhance security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">4. SHARING YOUR INFORMATION</h2>
                <p className="leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information in the following
                  circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>With your consent:</strong> When you opt to be displayed publicly as a "soldier in the war
                    on disease"
                  </li>
                  <li>
                    <strong>Service providers:</strong> With third-party vendors who perform services on our behalf
                    (email delivery, analytics, payment processing)
                  </li>
                  <li>
                    <strong>Legal requirements:</strong> When required by law or to protect our rights
                  </li>
                  <li>
                    <strong>Aggregated data:</strong> We may share anonymized, aggregated statistics about participation
                    in the movement
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">5. COOKIES AND TRACKING</h2>
                <p className="leading-relaxed">
                  We use cookies and similar tracking technologies to track activity on our website and hold certain
                  information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being
                  sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">6. YOUR RIGHTS</h2>
                <p className="leading-relaxed mb-4">Depending on your location, you may have the following rights:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Access:</strong> Request access to your personal information
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of inaccurate information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your personal information
                  </li>
                  <li>
                    <strong>Opt-out:</strong> Opt out of marketing communications
                  </li>
                  <li>
                    <strong>Data portability:</strong> Request a copy of your data in a portable format
                  </li>
                </ul>
                <p className="leading-relaxed mt-4">To exercise these rights, please contact us at {contactInfo.email}</p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">7. DATA SECURITY</h2>
                <p className="leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal
                  information. However, no method of transmission over the Internet or electronic storage is 100%
                  secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">8. CHILDREN'S PRIVACY</h2>
                <p className="leading-relaxed">
                  Our website is not intended for children under 13 years of age. We do not knowingly collect personal
                  information from children under 13. If you believe we have collected information from a child under
                  13, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">9. INTERNATIONAL TRANSFERS</h2>
                <p className="leading-relaxed">
                  Your information may be transferred to and maintained on computers located outside of your state,
                  province, country, or other governmental jurisdiction where data protection laws may differ. By using
                  our website, you consent to such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">10. CHANGES TO THIS POLICY</h2>
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                  new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this
                  Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-black uppercase mb-4 text-brutal-pink">11. CONTACT US</h2>
                <p className="leading-relaxed">
                  If you have questions about this Privacy Policy, please contact us at:
                </p>
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
