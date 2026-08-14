import type { Metadata } from "next"
import Layout from "@/components/layout"
import { Container } from "@/components/ui/container"
import { SendReferralInvitationClient } from "./send-referral-invitation-client"

// visual-auth-state: required
export const metadata: Metadata = {
  title: "Send One More",
  description: "Send one more 1% Treaty invitation.",
}

export default function SendPage() {
  return (
    <Layout>
      <main className="bg-brutal-yellow py-16">
        <Container size="md">
          <SendReferralInvitationClient />
        </Container>
      </main>
    </Layout>
  )
}
