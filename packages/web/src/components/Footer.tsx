import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Preferences", href: "/preferences" },
    { label: "Politicians", href: "/politicians" },
    { label: "Import Data", href: "/import" },
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
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"
            >
              Optomitron
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
              Optimizing health, wealth, and happiness through causal inference and evidence-based governance.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Papers</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} Optomitron — Open source AI governance platform by{" "}
            <a
              href="https://github.com/mikepsinn"
              className="text-primary-500 hover:underline"
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
