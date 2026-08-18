import type { CivicRepresentative } from "@/lib/civic-data";
import { hasBenchmarkProfile } from "@/lib/civic-data";

interface RepresentativeCardProps {
  representatives: CivicRepresentative[];
  onSeeBills?: () => void;
  onViewAlignment?: (rep: CivicRepresentative) => void;
}

export function RepresentativeCard({
  representatives,
  onSeeBills,
  onViewAlignment,
}: RepresentativeCardProps) {
  if (representatives.length === 0) {
    return (
      <div className="opto-card opto-rep-card">
        <div className="opto-rep-card__header">Your Representatives</div>
        <p className="opto-rep-card__empty">No representatives found for this location.</p>
      </div>
    );
  }

  return (
    <div className="opto-card opto-rep-card">
      <div className="opto-rep-card__header">Your Representatives</div>
      <div className="opto-rep-card__list">
        {representatives.map((rep) => (
          <div key={rep.bioguideId} className="opto-rep-card__item">
            <div className="opto-rep-card__info">
              <span className="opto-rep-card__name">{rep.name}</span>
            </div>
            <div className="opto-rep-card__detail">
              {rep.title} &middot; {rep.state}
              {rep.district != null ? `-${rep.district}` : ""} &middot; {rep.chamber}
            </div>
            <div className="opto-rep-card__actions">
              {onSeeBills && (
                <button
                  type="button"
                  className="opto-rep-card__btn"
                  onClick={onSeeBills}
                >
                  See bills
                </button>
              )}
              {onViewAlignment && hasBenchmarkProfile(rep.bioguideId) && (
                <button
                  type="button"
                  className="opto-rep-card__btn opto-rep-card__btn--alignment"
                  onClick={() => onViewAlignment(rep)}
                >
                  View alignment
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
