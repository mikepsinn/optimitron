import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Optimal Budget", href: "/budget" },
    { label: "Optimal Policies", href: "/policies" },
    { label: "Compare Countries", href: "/compare" },
    { label: "Vote", href: "/vote" },
  ],
  resources: [
    { label: "dFDA Spec", href: "https://dfda-spec.warondisease.org", external: true },
    { label: "Wishocracy Paper", href: "https://wishocracy.warondisease.org", external: true },
    { label: "OPG Paper", href: "https://opg.warondisease.org", external: true },
    { label: "OBG Paper", href: "https://obg.warondisease.org", external: true },
  ],
  community: [
    { label: "GitHub", href: "https://github.com/mikepsinn/optomitron", external: true },
    { label: "MIT License", href: "https://opensource.org/licenses/MIT", external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t-4 border-black mt-24 bg-yellow-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-black uppercase text-black">
              ⚡ Optomitron
            </Link>
            <p className="text-sm text-black/70 mt-3 leading-relaxed font-medium">
              Minimizing suffering and saving lives using causal inference on real-world policy outcomes.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-black uppercase mb-3 text-black">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-medium text-black/70 hover:text-black transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-black uppercase mb-3 text-black">Papers</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-black/70 hover:text-black transition-colors"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-black uppercase mb-3 text-black">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-black/70 hover:text-black transition-colors"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-black/20 text-center text-sm text-black/70 font-medium">
          <p>
            © {new Date().getFullYear()} Optomitron — Open source evidence-based policy analysis by{" "}
            <a
              href="https://mikesinn.com"
              className="text-black font-bold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mike P. Sinn
            </a>
            . MIT Licensed.
          </p>
        </div>
      </div>
    </footer>
  );
}
