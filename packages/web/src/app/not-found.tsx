import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const recoveryLinks = [
  { href: ROUTES.search, label: "Search" },
  { href: ROUTES.vote, label: "Vote" },
  { href: ROUTES.donate, label: "Donate" },
  { href: ROUTES.join, label: "Organizations" },
] as const;

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-6 py-16 text-center sm:py-20">
        <div className="w-full border-b border-foreground pb-8">
          <h1 className="text-[7rem] font-black uppercase leading-none tracking-normal sm:text-[10rem] md:text-[14rem]">
            404
          </h1>
        </div>

        <section className="w-full border border-foreground bg-background p-6 text-left sm:p-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <p className="text-xl font-black uppercase sm:text-2xl">
              Page Not Found
            </p>
            <p className="text-lg font-bold leading-relaxed">
              Fascinating. You found a page that does not exist. On my planet,
              this takes effort.
            </p>
          </div>
        </section>

        <nav
          aria-label="Page recovery"
          className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-4"
        >
          {recoveryLinks.map((link, index) => (
            <Link
              className={`inline-flex min-h-11 items-center justify-center border border-foreground px-4 py-2 text-sm font-black uppercase transition-colors ${
                index === 0
                  ? "bg-foreground text-background hover:bg-background hover:text-foreground"
                  : "bg-background text-foreground hover:bg-foreground hover:text-background"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="max-w-lg text-base font-bold leading-relaxed text-muted-foreground">
          Click something real. The machines are willing to forgive you.
        </p>
      </div>
    </main>
  );
}
