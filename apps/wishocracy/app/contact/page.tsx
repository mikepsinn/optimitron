import Layout from "../../components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import { BrutalCard } from "@/components/ui/brutal-card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getLegalEntityName } from "@/lib/site-config"

export default function ContactPage() {
  const legalEntityName = getLegalEntityName()

  return (
    <Layout>
      {/* Contact Form */}
      <SectionContainer bgColor="background" borderPosition="none" padding="lg">
        <Container size="md">
          <BrutalCard padding="lg">
            <h2 className="text-2xl sm:text-3xl font-black uppercase mb-8">GET INVOLVED</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="FIRST NAME" required htmlFor="firstName">
                  <Input
                    id="firstName"
                    required
                    className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                    placeholder="JOHN"
                  />
                </FormField>
                <FormField label="LAST NAME" required htmlFor="lastName">
                  <Input
                    id="lastName"
                    required
                    className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                    placeholder="DOE"
                  />
                </FormField>
              </div>
              <FormField label="EMAIL" required htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  required
                  className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                  placeholder="JOHN@EMAIL.COM"
                />
              </FormField>
              <FormField label="ORGANIZATION" htmlFor="organization">
                <Input
                  id="organization"
                  className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold bg-background text-foreground"
                  placeholder="YOUR ORGANIZATION"
                />
              </FormField>
              <FormField label="I WANT TO" required htmlFor="intent">
                <select
                  id="intent"
                  className="w-full border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold p-3 bg-background text-foreground"
                >
                  <option>VOLUNTEER</option>
                  <option>DONATE</option>
                  <option>{`PARTNER WITH ${legalEntityName.toUpperCase()}`}</option>
                  <option>PARTICIPATE IN A TRIAL</option>
                  <option>MEDIA INQUIRY</option>
                  <option>OTHER</option>
                </select>
              </FormField>
              <FormField label="MESSAGE" required htmlFor="message">
                <Textarea
                  id="message"
                  required
                  rows={6}
                  className="border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold resize-none bg-background text-foreground"
                  placeholder="TELL US HOW YOU WANT TO HELP ACCELERATE MEDICAL PROGRESS..."
                />
              </FormField>
              <Button className="w-full bg-brutal-pink text-brutal-pink-foreground border-4 border-primary hover:bg-foreground hover:text-background font-black uppercase text-lg py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-colors">
                SEND MESSAGE
              </Button>
            </form>
          </BrutalCard>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
