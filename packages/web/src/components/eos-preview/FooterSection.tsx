/**
 * SECTION 11: FOOTER. The closer, verbatim, including canonical lines. The
 * Manual and About link to their canonical destinations; Contact, Legal, and
 * PPM Request have no destination named in the spec.
 */
export function FooterSection() {
  return (
    <footer className="eos-footer" id="closer">
      <div className="eos-container">
        <p>
          Universe Optimization Services thanks you for your interest in
          continued existence.
        </p>
        <p>
          On most planets, you do not need to incorporate a company to stop
          people from dying. On yours, you do. So we did.
        </p>
        <p>
          The disease coming for someone you love almost certainly has no cure
          yet. This is how one gets found.
        </p>
        <p className="eos-footer-love">
          I love you very much and I do not want you and everyone you have ever
          loved to be slowly tortured and brutally murdered by horrible
          diseases.
        </p>

        <nav aria-label="Footer" className="eos-footer-links">
          <a href="https://manual.warondisease.org" rel="noopener noreferrer" target="_blank">
            The Manual
          </a>
          <a href="/about">About</a>
          {/* TODO: Contact / Legal / PPM Request destinations are not named in
              the spec; candidates: feedback route, /terms + /privacy, and
              ROUTES.fund respectively. Mike decides. */}
          <a href="#">Contact</a>
          <a href="#">Legal</a>
          <a href="#">PPM Request</a>
        </nav>
      </div>
    </footer>
  );
}
