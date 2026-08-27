import {
  ArrowDown,
  HeartPulse,
  Mail,
  Microscope,
  Stethoscope,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

import Layout from "@/components/layout";
import { RightToTrySupportForm } from "@/components/right-to-try-support-form";
import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

export const metadata: Metadata = {
  title: "Volunteer for Right to Trial | Institute for Accelerated Medicine",
  description:
    "Help bring Right to Trial to every patient. Patients, clinicians, researchers, and public educators can volunteer in any state.",
  alternates: { canonical: "https://acceleratedmedicine.org/contact" },
};

const roles = [
  {
    icon: HeartPulse,
    title: "Patients and caregivers",
    text: "Tell the story only you can tell. Show what another real option could mean when approved treatments are not enough.",
    color: "bg-brutal-pink",
  },
  {
    icon: Stethoscope,
    title: "Clinicians",
    text: "Help make access safe, practical, and real for the patients and professionals who will use it.",
    color: "bg-brutal-yellow",
  },
  {
    icon: Microscope,
    title: "Researchers",
    text: "Help turn each treatment into comparable evidence that improves the next patient’s decision.",
    color: "bg-brutal-cyan",
  },
  {
    icon: Users,
    title: "Organizers and communicators",
    text: "Find the local humans, answer the real questions, and bring Right to Trial to your state.",
    color: "bg-background",
  },
] as const;

export default function VolunteerPage() {
  return (
    <Layout>
      <SectionContainer
        bgColor="background"
        borderPosition="bottom"
        className="py-24 sm:py-28 lg:py-32"
      >
        <Container size="lg" className="text-center">
          <p className="inline-block rotate-[-1deg] border-4 border-primary bg-brutal-cyan px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Volunteer
          </p>
          <h1 className="mx-auto mt-6 max-w-6xl text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
            Help every patient get the Right to Trial.
          </h1>
          <p className="mx-auto mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            Every patient should be able to join a pragmatic clinical trial for
            the most promising treatments. Every result should help the next
            patient. You can help make that normal.
          </p>
          <a
            className="mt-9 inline-flex items-center gap-2 border-4 border-primary bg-brutal-pink px-7 py-4 text-xl font-black uppercase shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[11px_11px_0px_0px_rgba(0,0,0,1)]"
            href="#tell-us-where-you-want-to-help"
          >
            Find my part <ArrowDown className="h-6 w-6" strokeWidth={3} />
          </a>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="pink" borderPosition="bottom">
        <Container>
          <h2 className="mx-auto max-w-5xl text-center text-4xl font-black uppercase leading-none tracking-tighter text-brutal-pink-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            There is useful work for every kind of human.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {roles.map(({ icon: Icon, title, text, color }) => (
              <Card
                key={title}
                className={`${color} gap-4 rounded-none border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
              >
                <Icon className="h-12 w-12" strokeWidth={3} />
                <h3 className="text-2xl font-black uppercase">{title}</h3>
                <p className="text-lg font-bold">{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer
        id="tell-us-where-you-want-to-help"
        bgColor="cyan"
        borderPosition="bottom"
        className="scroll-mt-24"
      >
        <Container size="lg">
          <div className="mx-auto mb-10 max-w-4xl text-center">
            <h2 className="text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Tell us where you want to help.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-bold sm:text-xl">
              Give us one minute. Tell us your state, your role, and the part
              you would love to take on.
            </p>
          </div>
          <RightToTrySupportForm variant="volunteer" />
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="none">
        <Container size="md" className="text-center">
          <Mail className="mx-auto h-14 w-14" strokeWidth={3} />
          <h2 className="mt-4 text-3xl font-black uppercase sm:text-4xl">
            Prefer email?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg font-bold">
            The form is the fastest path. If your idea does not fit it, send it
            directly.
          </p>
          <a
            className="mt-6 inline-block border-4 border-primary bg-background px-7 py-4 text-lg font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
            href="mailto:hello@acceleratedmedicine.org?subject=Right%20to%20Trial%20volunteer"
          >
            Email hello@acceleratedmedicine.org
          </a>
        </Container>
      </SectionContainer>
    </Layout>
  );
}
