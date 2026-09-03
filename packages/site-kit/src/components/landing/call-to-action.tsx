import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";
import Link from "next/link";
import { getResolvedNavItem, isDonateLinkVisible } from "../../lib/site-config";
import { getVoteSectionUrl } from "../../lib/voting";
// TODO: Consider using VoteOrShareButton for the vote card

export default function CallToAction() {
  const donateEnabled = isDonateLinkVisible();
  const researchHref = getResolvedNavItem("research").path;
  const voteHref = getVoteSectionUrl();

  const allOptions = [
    {
      option: "OPTION 1: LEARN",
      action: "DOWNLOAD THE MATH",
      description: "43 studies. 82X proven. Peer-reviewed.",
      color: "bg-brutal-yellow",
      textColor: "text-brutal-yellow-foreground",
      accentColor: "text-brutal-pink",
      href: researchHref,
    },
    {
      option: "OPTION 2: ANSWER",
      action: "THE MOST IMPORTANT QUESTION",
      description: "30 seconds. Anonymous. Historical.",
      color: "bg-brutal-cyan",
      textColor: "text-brutal-cyan-foreground",
      accentColor: "text-brutal-pink",
      href: voteHref,
    },
    ...(donateEnabled
      ? [
          {
            option: "OPTION 3: FUND",
            action: "DONATE (TAX-DEDUCTIBLE)",
            description:
              "501(c)(3). Every dollar to creating a world without disease.",
            color: "bg-background",
            textColor: "text-foreground",
            accentColor: "text-brutal-pink",
            href: "/donate" as string | null,
          },
        ]
      : []),
    {
      option: donateEnabled ? "OPTION 4: DO NOTHING" : "OPTION 3: DO NOTHING",
      action: "DIE FROM SOMETHING PREVENTABLE",
      description: "And watch everyone you've ever loved slowly dissolve.",
      color: "bg-primary",
      textColor: "text-primary-foreground",
      accentColor: "text-brutal-pink",
      href: null as string | null,
    },
  ];

  const options = allOptions;

  return (
    <SectionContainer bgColor="foreground" borderPosition="bottom" padding="lg">
      <Container>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black uppercase text-center mb-16 text-brutal-pink-foreground">
          DO <span className="text-primary">SOMETHING</span>
        </h2>
        <div
          className={`grid md:grid-cols-2 ${options.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-6`}
        >
          {options.map((item, index) => {
            const cardContent = (
              <Card
                key={index}
                className={`${item.color} border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-2 hover:translate-y-2 transition-transform h-full flex flex-col ${item.href ? "cursor-pointer" : ""}`}
              >
                <div
                  className={`text-base sm:text-lg font-black mb-3 uppercase ${item.textColor}`}
                >
                  {item.option}
                </div>
                <div
                  className={`text-lg sm:text-xl font-black mb-3 uppercase ${item.accentColor}`}
                >
                  {item.action}
                </div>
                <div className={`font-bold text-sm ${item.textColor}`}>
                  {item.description}
                </div>
              </Card>
            );

            // For now, keep the vote link as-is since it's a card-based design
            // TODO: Consider creating a VoteOrShareCard component that wraps the entire card
            return item.href ? (
              <Link key={index} href={item.href} className="h-full">
                {cardContent}
              </Link>
            ) : (
              cardContent
            );
          })}
        </div>
      </Container>
    </SectionContainer>
  );
}
