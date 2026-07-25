import { MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { Reveal } from "@/components/eos-preview/Reveal";

/**
 * SECTION 9: REVIEWS. The comedic breather: hostile competitor feedback from
 * the diseases, then customer reviews from optimized planets. Copy verbatim.
 */
export function ReviewsSection() {
  return (
    <section className="eos-section eos-r2" id="reviews">
      <div className="eos-container">
        <Reveal className="eos-catalog-head">
          <p className="eos-eyebrow">Section 9</p>
          <h2 className="eos-catalog-title">Reviews</h2>
        </Reveal>

        <Reveal>
          <p className="eos-eyebrow" style={{ marginBottom: "0.75rem" }}>
            Reviews from the Competition
          </p>
          <div className="eos-review-grid" data-cols="2">
            <div className="eos-review-card" data-tone="hostile">
              <div className="eos-review-name">Cancer</div>
              <div aria-label="1 out of 5 stars" className="eos-stars">
                ★☆☆☆☆
              </div>
              <p className="eos-review-body">
                &ldquo;One star. They started checking which medicines
                work.&rdquo;
              </p>
            </div>
            <div className="eos-review-card" data-tone="hostile">
              <div className="eos-review-name">The Diseases</div>
              <div aria-label="1 out of 5 stars" className="eos-stars">
                ★☆☆☆☆
              </div>
              <p className="eos-review-body">
                &ldquo;They outspent their own cures{" "}
                <ParameterValue
                  display="integer"
                  param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO}
                  presentation="inline"
                />{" "}
                to 1. We assumed it was a tribute.&rdquo;
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <p className="eos-eyebrow" style={{ margin: "2.5rem 0 0.75rem" }}>
            Customer Reviews
          </p>
          <div className="eos-review-grid">
            <div className="eos-review-card">
              <div className="eos-review-name">Planet Keth-7</div>
              <div aria-label="5 out of 5 stars" className="eos-stars">
                ★★★★★
              </div>
              <p className="eos-review-body">
                &ldquo;We installed the full suite in Year 3. By Year 5, our
                government&apos;s operating cost had dropped 94%. By Year 12, we
                ran out of diseases. Our children learn about
                &lsquo;disease&rsquo; in history class. They do not believe any
                of it. Would optimize again.&rdquo;
              </p>
            </div>
            <div className="eos-review-card">
              <div className="eos-review-name">Planet GL-881</div>
              <div aria-label="1 out of 5 stars" className="eos-stars">
                ★☆☆☆☆
              </div>
              <p className="eos-review-body">
                &ldquo;Did not get started. Argued about whether the problem
                existed. Currently an asteroid belt. Available for mining
                rights.&rdquo;
              </p>
            </div>
            <div className="eos-review-card">
              <div className="eos-review-name">Planet Thex-9</div>
              <div aria-label="5 out of 5 stars" className="eos-stars">
                ★★★★★
              </div>
              <p className="eos-review-body">
                &ldquo;47 years from extinction when UOS arrived. Same
                trajectory as yours. Same budget allocation. Same glowing
                rectangles. The only difference is we said yes.&rdquo;
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
